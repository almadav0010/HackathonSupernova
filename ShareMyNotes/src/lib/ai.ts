/**
 * AI Service for Note Analysis & Summarization
 * Using Google Gemini for large context window (1M tokens)
 */

export interface NoteAnalysisInput {
  notes: string
  context?: string // Course content (optional)
  courseTitle?: string
}

export interface NoteAnalysisResult {
  success: boolean
  annotatedNotes: string
  error?: string
}

export interface NoteSummaryInput {
  notes: string
  context?: string // Course/verified content (optional)
}

export interface NoteSummaryResult {
  success: boolean
  summary: string
  error?: string
}

const SYSTEM_PROMPT = `You are an expert academic reviewer. Your job is to review student notes and annotate them inline based on course content.

Guidelines:
- Only annotate issues that would materially affect understanding or correctness.
- Underline in color any incorrect, misleading, ambiguous, or significantly incomplete statements.
- Insert short inline reviewer comments immediately after the affected text, using the same color as the underline.
- Do NOT use symbols, labels, or headings to indicate issue types.
- Do NOT comment on correct or sufficiently complete content.
- Do NOT suggest stylistic or optional improvements.
- Do NOT rewrite, remove, or add content beyond inline annotations.
- Use HTML span tags inside Markdown to apply color and underlining.
- All output must be valid Markdown.

Color coding:
- Red (#ef4444): Incorrect or misleading information
- Orange (#f97316): Ambiguous statements that could be misunderstood
- Yellow (#eab308): Significantly incomplete (missing critical details)

Example annotation format:
<span style="text-decoration: underline; text-decoration-color: #ef4444; color: #ef4444;">incorrect statement</span> <span style="color: #ef4444; font-size: 0.85em;">[This is actually X, not Y]</span>

Return ONLY the annotated notes in valid Markdown format. If the notes are completely correct, return them unchanged.`

function buildUserPrompt(input: NoteAnalysisInput): string {
  let prompt = `Given the following student notes:\n\n${input.notes}\n\n`
  
  if (input.context) {
    prompt += `And the following authoritative course content:\n\n${input.context}\n\n`
  } else if (input.courseTitle) {
    prompt += `Course: ${input.courseTitle}\n\n`
  }
  
  prompt += `Task: Review the notes verbatim and annotate them inline based on the information provided. If no course content is given, use your general knowledge to identify factual errors.`
  
  return prompt
}

/**
 * Analyze notes using Google Gemini API (1M token context!)
 */
export async function analyzeNotesWithAI(input: NoteAnalysisInput): Promise<NoteAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    return {
      success: false,
      annotatedNotes: '',
      error: 'Gemini API key not configured. Add GEMINI_API_KEY to your .env file.',
    }
  }

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT + '\n\n' + buildUserPrompt(input) }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Gemini API error:', errorData)
      return {
        success: false,
        annotatedNotes: '',
        error: `Gemini API error: ${errorData.error?.message || response.statusText}`,
      }
    }

    const data = await response.json()
    const annotatedNotes = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!annotatedNotes) {
      return {
        success: false,
        annotatedNotes: '',
        error: 'No response from AI',
      }
    }

    return {
      success: true,
      annotatedNotes,
    }
  } catch (error) {
    console.error('AI analysis error:', error)
    return {
      success: false,
      annotatedNotes: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Summary prompt for generating structured summaries
 */
const SUMMARY_SYSTEM_PROMPT = `You are an expert academic summarizer. Your job is to create clear, comprehensive summaries of student notes.

Guidelines:
- Create a summary that is detailed, thorough, in-depth, and complex, while maintaining clarity and conciseness.
- Cover all key points and main ideas from the original text, condensing the information into a clear and easy-to-understand format.
- Include relevant details and examples that support the main ideas, while avoiding unnecessary information, redundancy, or speculation.
- Rely strictly on the provided student notes and context; do not include external information.
- Ensure the summary length is appropriate to the complexity and length of the original notes.
- Organize the summary clearly using meaningful Markdown headings and subheadings.
- Each section should be written in well-structured paragraph form.
- Use bullet points sparingly and only when listing items.
- Output must be valid Markdown.`

function buildSummaryPrompt(input: NoteSummaryInput): string {
  let prompt = ''
  
  if (input.context) {
    prompt += `Given the following verified context information:\n\n${input.context}\n\n`
    prompt += `Summarize the student notes enclosed between %% below, ensuring the summary is fully consistent with the context above.\n\n`
  } else {
    prompt += `Summarize the following student notes:\n\n`
  }
  
  prompt += `%%\n${input.notes}\n%%\n\n`
  prompt += `Create a well-organized summary using Markdown headings and paragraphs.`
  
  return prompt
}

/**
 * Summarize notes using Google Gemini API
 */
export async function summarizeNotesWithAI(input: NoteSummaryInput): Promise<NoteSummaryResult> {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    return {
      success: false,
      summary: '',
      error: 'Gemini API key not configured. Add GEMINI_API_KEY to your .env file.',
    }
  }

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SUMMARY_SYSTEM_PROMPT + '\n\n' + buildSummaryPrompt(input) }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 4096,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Gemini API error:', errorData)
      return {
        success: false,
        summary: '',
        error: `Gemini API error: ${errorData.error?.message || response.statusText}`,
      }
    }

    const data = await response.json()
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!summary) {
      return {
        success: false,
        summary: '',
        error: 'No response from AI',
      }
    }

    return {
      success: true,
      summary,
    }
  } catch (error) {
    console.error('AI summary error:', error)
    return {
      success: false,
      summary: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// === Professor Report Feature ===

export interface ProfessorReportInput {
  studentNotes: string[] // Array of notes from multiple students
  classMaterials: string // Official class materials
  courseTitle?: string
}

export interface ProfessorReportResult {
  success: boolean
  report: string
  error?: string
}

const PROFESSOR_REPORT_PROMPT = `You are an expert educational analyst. Your task is to compare student notes with official class materials and identify patterns of misunderstanding across students.

Perform the following analysis:

1. Identify recurring conceptual errors or misconceptions.
2. Detect important key ideas that students consistently failed to include.
3. Highlight incorrect definitions, formulas, or explanations.
4. Identify areas where students show partial understanding or confusion.
5. Infer which topics may not have been communicated clearly in class.

Focus on recurring patterns across multiple students rather than isolated mistakes. Base your reasoning strictly on evidence from the provided materials.

Produce a structured report with the following sections:

## Executive Summary
Provide a concise high-level summary (5–8 sentences) describing the overall quality of student understanding, the main problem areas, and the most urgent instructional gaps.

## Common Misconceptions
List recurring incorrect ideas and explain why they are wrong using references to the class materials.

## Missing Core Concepts
Key ideas from the class materials that students are failing to capture.

## Confusion Patterns
Topics where students demonstrate mixed or partial understanding.

## Instructional Recommendations
Concrete, actionable suggestions for how the professor can clarify or reinforce these topics in future lectures.

Guidelines:
- Be concise, analytical, and evidence-based.
- DO NOT make up anything. If you don't have enough information, say so.
- Clearly tie every conclusion to comparisons between the notes and the class materials.
- Use LaTeX ($..$ for inline, $$...$$ for display) wherever mathematical notation is needed.
- Output must be valid Markdown.`

function buildProfessorReportPrompt(input: ProfessorReportInput): string {
  let prompt = ''
  
  if (input.courseTitle) {
    prompt += `Course: ${input.courseTitle}\n\n`
  }
  
  prompt += `CLASS MATERIALS:\n${input.classMaterials}\n\n`
  prompt += `STUDENT NOTES (${input.studentNotes.length} students):\n\n`
  
  input.studentNotes.forEach((notes, index) => {
    prompt += `--- Student ${index + 1} ---\n${notes}\n\n`
  })
  
  prompt += `Analyze the student notes against the class materials and generate the professor report.`
  
  return prompt
}

/**
 * Generate professor report comparing student notes against class materials
 */
export async function generateProfessorReport(input: ProfessorReportInput): Promise<ProfessorReportResult> {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    return {
      success: false,
      report: '',
      error: 'Gemini API key not configured. Add GEMINI_API_KEY to your .env file.',
    }
  }

  if (input.studentNotes.length === 0) {
    return {
      success: false,
      report: '',
      error: 'No student notes provided for analysis.',
    }
  }

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROFESSOR_REPORT_PROMPT + '\n\n' + buildProfessorReportPrompt(input) }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3, // Lower temp for more analytical output
          maxOutputTokens: 8192,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Gemini API error:', errorData)
      return {
        success: false,
        report: '',
        error: `Gemini API error: ${errorData.error?.message || response.statusText}`,
      }
    }

    const data = await response.json()
    const report = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!report) {
      return {
        success: false,
        report: '',
        error: 'No response from AI',
      }
    }

    return {
      success: true,
      report,
    }
  } catch (error) {
    console.error('AI professor report error:', error)
    return {
      success: false,
      report: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}