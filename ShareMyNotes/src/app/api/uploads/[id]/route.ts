import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/uploads/[id] - Get a single upload
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    const { data: upload, error } = await supabase
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
        ),
        summaries (
          id,
          summary_text,
          key_points,
          topics,
          generated_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    // Check if user can view this upload
    if (!upload.is_public && (!user || upload.user_id !== user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Increment view count (fire and forget)
    supabase.rpc('increment_view_count', { table_name: 'uploads', row_id: id })

    return NextResponse.json({ upload })
  } catch (error) {
    console.error('Error fetching upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/uploads/[id] - Update an upload
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the upload to verify ownership
    const { data: existingUpload, error: fetchError } = await supabase
      .from('uploads')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingUpload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    // Verify ownership
    if (existingUpload.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only allow updating certain fields
    const allowedFields = ['title', 'description', 'is_public', 'tags', 'course_id', 'lecture_id']
    const updateData: Record<string, unknown> = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const { data: upload, error } = await supabase
      .from('uploads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ upload })
  } catch (error) {
    console.error('Error updating upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/uploads/[id] - Delete an upload
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the upload to verify ownership and get storage path
    const { data: upload, error: fetchError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', id)
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
    }

    // Delete from database (will cascade delete summaries and feedback)
    const { error: dbError } = await supabase
      .from('uploads')
      .delete()
      .eq('id', id)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
