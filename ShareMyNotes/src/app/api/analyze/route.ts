import { createClient } from '@/lib/supabase/server'
import { processWithLangflow } from '@/lib/langflow'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Fetch file content from Supabase Storage
 * For text files, returns the content directly
 * For PDFs/images, we'd need additional processing (not implemented yet)
 */
async function getFileContent(fileUrl: string, fileType: string): Promise<string | null> {
  try {
    // For text-based files, fetch and return content
    if (fileType.includes('text') || 
        fileType.includes('markdown') || 
        fileType.includes('json') ||
        fileType.includes('csv')) {
      const response = await fetch(fileUrl)
      if (!response.ok) return null
      return await response.text()
    }
    
    // For PDFs - you'd need a PDF parser like pdf-parse
    // For now, we return a placeholder message
    if (fileType.includes('pdf')) {
      // TODO: Implement PDF parsing
      // const pdfParse = require('pdf-parse')
      // const response = await fetch(fileUrl)
      // const buffer = await response.arrayBuffer()
      // const data = await pdfParse(Buffer.from(buffer))
      // return data.text
      return `[PDF file content - PDF parsing not yet implemented. File URL: ${fileUrl}]`
    }
    
    // For images - you'd need OCR or multimodal AI
    if (fileType.includes('image')) {
      return `[Image file - requires OCR or multimodal analysis. File URL: ${fileUrl}]`
    }
    
    return null
  } catch (error) {
    console.error('Error fetching file content:', error)
    return null
  }
}

// POST /api/analyze - Analyze an uploaded file with Langflow
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { uploadId } = body

    if (!uploadId) {
      return NextResponse.json({ error: 'Upload ID required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the upload (verify ownership)
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', uploadId)
      .eq('user_id', user.id) // Only allow analyzing own uploads
      .single()

    if (uploadError || !upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    // Check if feedback already exists
    const { data: existingFeedback } = await supabase
      .from('feedback')
      .select('id')
      .eq('upload_id', uploadId)
      .single()

    if (existingFeedback) {
      return NextResponse.json({ 
        error: 'Feedback already exists for this upload',
        feedbackId: existingFeedback.id 
      }, { status: 409 })
    }

    // Fetch the actual file content
    const fileContent = await getFileContent(upload.file_url, upload.file_type)
    
    if (!fileContent) {
      return NextResponse.json({ 
        error: 'Could not read file content. Only text files are currently supported.' 
      }, { status: 400 })
    }

    // Call Langflow to analyze the file content
    const langflowResult = await processWithLangflow({
      fileContent: fileContent,
      fileName: upload.file_name,
      fileType: upload.file_type,
      userId: user.id,
    })

    if (!langflowResult.success) {
      return NextResponse.json({ 
        error: langflowResult.error || 'Failed to analyze file' 
      }, { status: 500 })
    }

    // Store the feedback in the database
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        upload_id: uploadId,
        feedback_type: 'ai-analysis',
        feedback_content: langflowResult.feedback || 'No feedback generated',
        suggestions: langflowResult.suggestions || [],
        score: langflowResult.correctnessScore || null,
      })
      .select()
      .single()

    if (feedbackError) {
      console.error('Error saving feedback:', feedbackError)
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
    }

    // Also store summary if we got key points and topics
    if (langflowResult.keyPoints?.length || langflowResult.topics?.length) {
      await supabase
        .from('summaries')
        .insert({
          user_id: user.id,
          upload_id: uploadId,
          summary_text: langflowResult.feedback || '',
          key_points: langflowResult.keyPoints || [],
          topics: langflowResult.topics || [],
          model_used: 'langflow',
        })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action_type: 'analyze',
      target_type: 'upload',
      target_id: uploadId,
      metadata: { 
        score: langflowResult.correctnessScore,
        has_suggestions: (langflowResult.suggestions?.length || 0) > 0
      }
    })

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        content: langflowResult.feedback,
        score: langflowResult.correctnessScore,
        suggestions: langflowResult.suggestions,
        keyPoints: langflowResult.keyPoints,
        topics: langflowResult.topics,
      }
    })

  } catch (error) {
    console.error('Error in analyze API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/analyze?uploadId=xxx - Get existing feedback for an upload
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const uploadId = searchParams.get('uploadId')

    if (!uploadId) {
      return NextResponse.json({ error: 'Upload ID required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get feedback for this upload (only if user owns it)
    const { data: feedback, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('upload_id', uploadId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !feedback) {
      return NextResponse.json({ feedback: null })
    }

    // Also get summary if exists
    const { data: summary } = await supabase
      .from('summaries')
      .select('*')
      .eq('upload_id', uploadId)
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      feedback: {
        id: feedback.id,
        content: feedback.feedback_content,
        score: feedback.score,
        suggestions: feedback.suggestions,
        type: feedback.feedback_type,
        createdAt: feedback.created_at,
      },
      summary: summary ? {
        text: summary.summary_text,
        keyPoints: summary.key_points,
        topics: summary.topics,
      } : null
    })

  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
