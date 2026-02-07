// Langflow API Integration (DataStax Astra)
// This module handles communication with your Langflow instance for student performance analysis
// 
// RECOMMENDED FLOW MODIFICATION:
// Replace the File component (File-jG0x9) with a Chat Input component
// This allows sending text content directly via API without needing file uploads
//
// Flow: [Chat Input] → [Split Text] → [AstraDB search] → [Prompt] → [LLM] → [Chat Output]

export interface LangflowResponse {
  success: boolean
  feedback?: string
  correctnessScore?: number
  keyPoints?: string[]
  suggestions?: string[]
  topics?: string[]
  error?: string
}

export interface LangflowInput {
  fileContent: string      // The actual text content of the file
  fileName: string
  fileType: string
  userId: string
  courseId?: string        // Optional: to select which course materials to compare against
  additionalContext?: string
}

// Component IDs from your Langflow flow
const LANGFLOW_COMPONENTS = {
  STUDENT_NOTES_FILE: 'File-jG0x9',      // Student notes input (or Chat Input if modified)
  CLASS_MATERIALS_FILE: 'File-IjqAU',    // Class materials (pre-loaded)
  CHAT_OUTPUT: 'ChatOutput-GKJ2n',       // Output component
  SPLIT_TEXT: 'SplitText-5Fw8h',         // Split text component for student notes
}

/**
 * Call your Langflow flow to analyze student notes against class materials
 * 
 * This sends the file CONTENT directly as text input.
 * 
 * SETUP REQUIRED IN LANGFLOW:
 * 1. Add a "Chat Input" component
 * 2. Connect it to SplitText-5Fw8h (replacing the File connection)
 * 3. Keep the class materials File component for reference materials
 * 
 * OR use the alternative approach with tweaks if your File component supports it.
 */
export async function processWithLangflow(input: LangflowInput): Promise<LangflowResponse> {
  const langflowUrl = process.env.LANGFLOW_API_URL
  const apiToken = process.env.LANGFLOW_API_TOKEN
  const orgId = process.env.LANGFLOW_ORG_ID

  if (!langflowUrl || !apiToken) {
    console.error('Langflow configuration missing')
    return {
      success: false,
      error: 'Langflow not configured. Please set LANGFLOW_API_URL and LANGFLOW_API_TOKEN in .env'
    }
  }

  try {
    // Generate a unique session ID for this analysis
    const sessionId = crypto.randomUUID()

    // Send the file content directly as the input_value
    // This requires a Chat Input component in your flow connected to the processing chain
    const payload = {
      output_type: 'chat',
      input_type: 'chat',
      // Send the actual file content as the input
      input_value: input.fileContent,
      session_id: sessionId,
      // Tweaks can override specific component values
      tweaks: {
        // If you have a Chat Input component, you can also pass via tweaks:
        // 'ChatInput-XXXXX': { input_value: input.fileContent }
      }
    }

    const response = await fetch(langflowUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
        ...(orgId && { 'X-DataStax-Current-Org': orgId }),
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Langflow API error:', errorText)
      return {
        success: false,
        error: `Langflow API error: ${response.status}`
      }
    }

    const data = await response.json()
    
    // Parse Langflow response - DataStax format
    // The response structure may vary, so we try multiple paths
    const output = 
      data.outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
      data.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message ||
      data.outputs?.[0]?.outputs?.[0]?.artifacts?.message ||
      data.outputs?.[0]?.outputs?.[0]?.results?.text?.text ||
      data.result ||
      data.output ||
      data.message ||
      ''

    console.log('Langflow raw output:', output)

    // Try to parse structured response if Langflow returns JSON
    try {
      // Check if output contains JSON (might be wrapped in text)
      const jsonMatch = typeof output === 'string' 
        ? output.match(/\{[\s\S]*\}/) 
        : null
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          success: true,
          feedback: parsed.feedback || parsed.summary || parsed.analysis || output,
          correctnessScore: parsed.correctness_score || parsed.score || parsed.correctnessScore,
          keyPoints: parsed.key_points || parsed.keyPoints || parsed.key_topics || [],
          suggestions: parsed.suggestions || parsed.improvements || [],
          topics: parsed.topics || parsed.subjects || [],
        }
      }
      
      // If output is already an object
      if (typeof output === 'object' && output !== null) {
        return {
          success: true,
          feedback: output.feedback || output.summary || JSON.stringify(output),
          correctnessScore: output.correctness_score || output.score,
          keyPoints: output.key_points || [],
          suggestions: output.suggestions || [],
          topics: output.topics || [],
        }
      }
    } catch {
      // Not JSON, continue with plain text
    }

    // Return plain text feedback
    return {
      success: true,
      feedback: typeof output === 'string' ? output : JSON.stringify(output),
    }

  } catch (error) {
    console.error('Error calling Langflow:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to Langflow'
    }
  }
}

/**
 * Ingest course materials into AstraDB vector store
 * Call this once per course to load the reference materials
 * 
 * @param courseMaterialUrl - Public URL to the course material file (PDF, TXT, etc.)
 * @param courseId - Identifier for the course (for organization)
 */
export async function ingestCourseMaterials(
  courseMaterialUrl: string,
  courseId: string
): Promise<{ success: boolean; error?: string }> {
  const langflowUrl = process.env.LANGFLOW_API_URL
  const apiToken = process.env.LANGFLOW_API_TOKEN
  const orgId = process.env.LANGFLOW_ORG_ID

  if (!langflowUrl || !apiToken) {
    return { success: false, error: 'Langflow not configured' }
  }

  try {
    const sessionId = `course-ingest-${courseId}-${Date.now()}`

    // Use tweaks to pass the course materials file to the ingest component
    const payload = {
      output_type: 'chat',
      input_type: 'chat',
      input_value: `Ingesting course materials for course: ${courseId}`,
      session_id: sessionId,
      tweaks: {
        [LANGFLOW_COMPONENTS.CLASS_MATERIALS_FILE]: {
          path: courseMaterialUrl,
        }
      }
    }

    const response = await fetch(langflowUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
        ...(orgId && { 'X-DataStax-Current-Org': orgId }),
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to ingest course materials:', errorText)
      return { success: false, error: `API error: ${response.status}` }
    }

    console.log(`Course materials ingested successfully for course: ${courseId}`)
    return { success: true }

  } catch (error) {
    console.error('Error ingesting course materials:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ingest'
    }
  }
}

/**
 * Process text content directly with Langflow (for text files or extracted content)
 */
export async function processTextWithLangflow(
  textContent: string,
  userId: string,
  fileName: string
): Promise<LangflowResponse> {
  const langflowUrl = process.env.LANGFLOW_API_URL
  const apiToken = process.env.LANGFLOW_API_TOKEN
  const orgId = process.env.LANGFLOW_ORG_ID

  if (!langflowUrl || !apiToken) {
    return {
      success: false,
      error: 'Langflow not configured'
    }
  }

  try {
    const sessionId = crypto.randomUUID()

    const inputMessage = `Analyze these student notes from "${fileName}":

${textContent}

Please provide:
1. Assessment of accuracy and correctness
2. Quality evaluation
3. Key points identified
4. Suggestions for improvement

Respond with JSON: {feedback, correctness_score (0-100), key_points [], suggestions [], topics []}`

    const payload = {
      output_type: 'chat',
      input_type: 'text',
      input_value: inputMessage,
      session_id: sessionId,
    }

    const response = await fetch(langflowUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
        ...(orgId && { 'X-DataStax-Current-Org': orgId }),
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Langflow API error: ${response.status}`
      }
    }

    const data = await response.json()
    const output = 
      data.outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
      data.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message ||
      data.result ||
      data.output ||
      ''

    return {
      success: true,
      feedback: typeof output === 'string' ? output : JSON.stringify(output),
    }

  } catch (error) {
    console.error('Error calling Langflow:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to Langflow'
    }
  }
}
