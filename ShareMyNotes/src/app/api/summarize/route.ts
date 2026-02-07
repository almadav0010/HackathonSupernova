import { createClient } from '@/lib/supabase/server'
import { summarizeNotesWithAI } from '@/lib/ai'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/summarize - Generate a summary of notes
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { notes, context, uploadId, saveToDb, storagePath } = body

    // Either notes directly or uploadId required
    if (!notes && !uploadId) {
      return NextResponse.json({ error: 'Notes content or Upload ID required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let notesContent = notes
    let resolvedUploadId = uploadId

    // If uploadId provided, fetch notes from database
    if (uploadId && !notes) {
      const { data: upload, error: uploadError } = await supabase
        .from('uploads')
        .select('content, title')
        .eq('id', uploadId)
        .eq('user_id', user.id)
        .single()

      if (uploadError || !upload) {
        return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
      }

      notesContent = upload.content
    }

    // If saveToDb is true and we have a storagePath, find the associated upload
    if (saveToDb && storagePath && !resolvedUploadId) {
      const { data: upload } = await supabase
        .from('uploads')
        .select('id')
        .eq('user_id', user.id)
        .eq('storage_path', storagePath)
        .single()
      
      if (upload) {
        resolvedUploadId = upload.id
      }
    }

    if (!notesContent) {
      return NextResponse.json({ 
        error: 'No content found to summarize.' 
      }, { status: 400 })
    }

    // Call AI to summarize the notes
    const aiResult = await summarizeNotesWithAI({
      notes: notesContent,
      context: context || undefined,
    })

    if (!aiResult.success) {
      return NextResponse.json({ 
        error: aiResult.error || 'Failed to summarize notes' 
      }, { status: 500 })
    }

    // Save summary to database if uploadId exists or was resolved
    if (resolvedUploadId) {
      await supabase
        .from('summaries')
        .upsert({
          user_id: user.id,
          upload_id: resolvedUploadId,
          summary_text: aiResult.summary,
          model_used: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
          generated_at: new Date().toISOString(),
        }, {
          onConflict: 'upload_id',
        })
    }

    return NextResponse.json({
      success: true,
      summary: aiResult.summary,
      savedToDb: !!resolvedUploadId,
    })

  } catch (error) {
    console.error('Error in summarize API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
