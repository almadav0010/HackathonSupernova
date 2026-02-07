import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/uploads - Get user's uploads or public uploads
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const courseId = searchParams.get('courseId')
    const lectureId = searchParams.get('lectureId')
    const publicOnly = searchParams.get('public') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('uploads')
      .select(`
        *,
        profiles:user_id (
          id,
          display_name,
          avatar_url
        ),
        courses:course_id (
          id,
          name,
          code
        )
      `)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by course if provided
    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    // Filter by lecture if provided
    if (lectureId) {
      query = query.eq('lecture_id', lectureId)
    }

    // If publicOnly, only show public uploads
    // Otherwise, show user's own uploads + public uploads
    if (publicOnly) {
      query = query.eq('is_public', true)
    } else if (user) {
      // Show user's own uploads and public uploads
      query = query.or(`user_id.eq.${user.id},is_public.eq.true`)
    } else {
      // Not logged in, only show public
      query = query.eq('is_public', true)
    }

    const { data: uploads, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ uploads })
  } catch (error) {
    console.error('Error fetching uploads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/uploads - Delete an upload
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const uploadId = searchParams.get('id')

    if (!uploadId) {
      return NextResponse.json({ error: 'Upload ID required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the upload to verify ownership and get storage path
    const { data: upload, error: fetchError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', uploadId)
      .single()

    if (fetchError || !upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    // Verify ownership
    if (upload.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('uploads')
      .remove([upload.storage_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      // Continue anyway to delete database record
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('uploads')
      .delete()
      .eq('id', uploadId)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
