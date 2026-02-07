import { NextRequest, NextResponse } from 'next/server'
import { generateProfessorReport } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentNotes, classMaterials, courseTitle, subjectId } = body

    if (!studentNotes || !Array.isArray(studentNotes) || studentNotes.length === 0) {
      return NextResponse.json(
        { error: 'Student notes array is required' },
        { status: 400 }
      )
    }

    if (!classMaterials || typeof classMaterials !== 'string') {
      return NextResponse.json(
        { error: 'Class materials are required' },
        { status: 400 }
      )
    }

    // Generate the professor report
    const result = await generateProfessorReport({
      studentNotes,
      classMaterials,
      courseTitle,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate report' },
        { status: 500 }
      )
    }

    // Optionally save to database
    if (subjectId) {
      try {
        const supabase = await createClient()
        await supabase.from('professor_reports').insert({
          subject_id: subjectId,
          report: result.report,
          student_count: studentNotes.length,
          created_at: new Date().toISOString(),
        })
      } catch (dbError) {
        console.error('Failed to save report to database:', dbError)
        // Continue anyway - report generation succeeded
      }
    }

    return NextResponse.json({
      success: true,
      report: result.report,
      studentCount: studentNotes.length,
    })
  } catch (error) {
    console.error('Professor report API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
