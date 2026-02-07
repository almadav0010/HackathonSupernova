import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ingestCourseMaterials } from '@/lib/langflow'

/**
 * POST /api/courses/ingest
 * Ingest course materials into AstraDB for comparison with student notes
 * 
 * Body: { courseId, materialUrl }
 * 
 * IMPORTANT: This should be called by teachers/admins to load reference materials
 * Before students can get feedback, course materials need to be ingested first
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, materialUrl, courseName } = body

    if (!courseId || !materialUrl) {
      return NextResponse.json(
        { error: 'courseId and materialUrl are required' },
        { status: 400 }
      )
    }

    // Optionally: Check if user has permission to ingest materials for this course
    // For hackathon, we'll allow any authenticated user

    console.log(`Ingesting materials for course ${courseId}: ${materialUrl}`)

    // Call Langflow to ingest the course materials
    const result = await ingestCourseMaterials(materialUrl, courseId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to ingest course materials' },
        { status: 500 }
      )
    }

    // Optionally: Record the ingestion in database
    // This helps track which courses have materials loaded
    try {
      await supabase.from('courses').upsert({
        id: courseId,
        name: courseName || courseId,
        materials_url: materialUrl,
        materials_ingested_at: new Date().toISOString(),
        created_by: user.id,
      }, {
        onConflict: 'id'
      })
    } catch (dbError) {
      // Non-critical - continue even if DB update fails
      console.warn('Could not update courses table:', dbError)
    }

    return NextResponse.json({
      success: true,
      message: `Course materials for "${courseName || courseId}" have been ingested successfully`,
      courseId,
    })

  } catch (error) {
    console.error('Error ingesting course materials:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/courses/ingest
 * Get list of courses with ingested materials
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, name, materials_url, materials_ingested_at')
      .not('materials_ingested_at', 'is', null)
      .order('name')

    if (error) {
      console.error('Error fetching courses:', error)
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
    }

    return NextResponse.json({ courses: courses || [] })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
