import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/uploads/[id]/download - Get download URL and increment counter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Get the upload
    const { data: upload, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    // Check if user can download this file
    if (!upload.is_public && (!user || upload.user_id !== user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Create signed URL for download (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('uploads')
      .createSignedUrl(upload.storage_path, 3600, {
        download: upload.file_name, // This sets the download filename
      })

    if (signedUrlError || !signedUrlData) {
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }

    // Increment download count (fire and forget)
    supabase.rpc('increment_download_count', { upload_id: id })

    // Log activity if user is logged in
    if (user) {
      supabase.from('activity_log').insert({
        user_id: user.id,
        action_type: 'download',
        target_type: 'upload',
        target_id: id,
        metadata: { file_name: upload.file_name }
      })
    }

    return NextResponse.json({ 
      downloadUrl: signedUrlData.signedUrl,
      fileName: upload.file_name
    })
  } catch (error) {
    console.error('Error generating download URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
