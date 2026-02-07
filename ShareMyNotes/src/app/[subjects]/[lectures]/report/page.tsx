'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Icon } from '@/components/Icon/Icon'
import { Navbar } from '@/components/Navbar/Navbar'
import { createClient } from '@/lib/supabase/client'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

export default function ReportPage() {
  const params = useParams()
  const subject = params?.subjects as string || 'unknown'
  const lecture = params?.lectures as string || 'notes'
  
  // Summary state
  const [summary, setSummary] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Professor Report state
  const [professorReport, setProfessorReport] = useState<string | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [classMaterials, setClassMaterials] = useState('')
  const [showReportSetup, setShowReportSetup] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const classMaterialsInputRef = useRef<HTMLInputElement>(null)

  // Load saved summary on mount
  useEffect(() => {
    loadSummary()
  }, [subject, lecture])

  const loadSummary = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Please log in to view your summary')
        setIsLoading(false)
        return
      }

      // First find the upload for this lecture
      const { data: upload } = await supabase
        .from('uploads')
        .select('id')
        .eq('user_id', user.id)
        .eq('storage_path', `notes/${subject}/${lecture}`)
        .single()

      if (!upload) {
        setSummary(null)
        setIsLoading(false)
        return
      }

      // Then get the summary for this upload
      const { data: summaryData, error: summaryError } = await supabase
        .from('summaries')
        .select('summary_text, generated_at')
        .eq('upload_id', upload.id)
        .single()

      if (summaryError || !summaryData) {
        setSummary(null)
      } else {
        setSummary(summaryData.summary_text)
      }
    } catch (err) {
      console.error('Error loading summary:', err)
      setError('Failed to load summary')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Please log in first')
        return
      }

      // Get the notes content
      const { data: upload } = await supabase
        .from('uploads')
        .select('content')
        .eq('user_id', user.id)
        .eq('storage_path', `notes/${subject}/${lecture}`)
        .single()

      if (!upload?.content) {
        setError('No notes found for this lecture. Go to Notes tab and write some notes first.')
        return
      }

      // Call the summarize API
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: upload.content,
          saveToDb: true,
          storagePath: `notes/${subject}/${lecture}`,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary')
      }

      setSummary(data.summary)
    } catch (err) {
      console.error('Error generating summary:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  // Handle class materials upload
  const handleClassMaterialsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        setClassMaterials(text)
      }
    }
    reader.readAsText(file)
    
    if (classMaterialsInputRef.current) {
      classMaterialsInputRef.current.value = ''
    }
  }

  // Handle professor report generation
  const handleGenerateProfessorReport = async () => {
    setReportError(null)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setReportError('Please log in first')
        return
      }

      // Get the notes content
      const { data: upload } = await supabase
        .from('uploads')
        .select('content')
        .eq('user_id', user.id)
        .eq('storage_path', `notes/${subject}/${lecture}`)
        .single()

      if (!upload?.content) {
        setReportError('No notes found for this lecture. Go to Notes tab and write some notes first.')
        return
      }

      if (!classMaterials.trim()) {
        setReportError('Please upload or paste class materials first.')
        return
      }

      setIsGeneratingReport(true)
      setShowReportSetup(false)

      const response = await fetch('/api/professor-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNotes: [upload.content],
          classMaterials: classMaterials,
          courseTitle: subject.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report')
      }

      setProfessorReport(data.report)
    } catch (err) {
      console.error('Professor report error:', err)
      setReportError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleExport = (content: string, type: 'summary' | 'report') => {
    const subjectName = subject.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const lectureName = lecture.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = type === 'summary' 
      ? `${subjectName} - ${lectureName} - Summary.md`
      : `${subjectName} - ${lectureName} - Professor Report.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar/>
      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* AI Summary Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Icon name="zap" size={24} className="text-purple-600" />
                AI Summary
              </h2>
              <div className="flex gap-2">
                {summary && (
                  <button
                    onClick={() => handleExport(summary, 'summary')}
                    className="px-4 py-2 bg-stone-100 text-stone-800 border border-stone-300 rounded hover:bg-stone-200 font-medium shadow-sm flex items-center gap-2"
                  >
                    <Icon name="download" size={16} />
                    Export
                  </button>
                )}
                <button
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary}
                  className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingSummary ? (
                    <>
                      <Icon name="loader" size={16} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icon name="zap" size={16} />
                      {summary ? 'Regenerate' : 'Generate Summary'}
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                <Icon name="alert" size={20} />
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="bg-white rounded-lg border-2 border-gray-200 p-12 text-center">
                <Icon name="loader" size={32} className="animate-spin mx-auto text-gray-400" />
                <p className="mt-4 text-gray-500">Loading summary...</p>
              </div>
            ) : summary ? (
              <div className="bg-white rounded-lg border-2 border-gray-200 shadow-lg">
                <div className="p-6 overflow-y-auto max-h-[50vh]">
                  <div className="prose max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        p: ({ ...props }) => <p className="text-text-primary mb-4 text-lg leading-relaxed" {...props} />,
                        h1: ({ ...props }) => <h1 className="text-3xl font-bold text-text-primary mb-4 mt-6" {...props} />,
                        h2: ({ ...props }) => <h2 className="text-2xl font-bold text-purple-800 mb-3 mt-5 pb-2 border-b border-purple-200" {...props} />,
                        h3: ({ ...props }) => <h3 className="text-xl font-semibold text-text-primary mb-2 mt-4" {...props} />,
                        ul: ({ ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                        ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                        li: ({ ...props }) => <li className="text-text-primary text-lg" {...props} />,
                        strong: ({ ...props }) => <strong className="font-bold text-purple-900" {...props} />,
                        blockquote: ({ ...props }) => <blockquote className="border-l-4 border-purple-300 pl-4 italic text-gray-600 my-4" {...props} />,
                        code: ({ className, children, ...props }) => {
                          const isInline = !className
                          return isInline 
                            ? <code className="bg-gray-200 px-2 py-1 rounded text-base font-mono" {...props}>{children}</code>
                            : <code className="block bg-gray-100 p-4 rounded mb-4 overflow-x-auto font-mono text-sm" {...props}>{children}</code>
                        },
                      }}
                    >
                      {summary}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <Icon name="file-text" size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Summary Yet</h3>
                <p className="text-gray-500 mb-4 text-sm">
                  Generate an AI summary of your notes.
                </p>
                <button
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary}
                  className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingSummary ? (
                    <>
                      <Icon name="loader" size={16} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icon name="zap" size={16} />
                      Generate Summary
                    </>
                  )}
                </button>
              </div>
            )}
          </section>

          {/* Professor Report Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Icon name="bar-chart" size={24} className="text-blue-600" />
                Professor Report
              </h2>
              <div className="flex gap-2">
                {professorReport && (
                  <button
                    onClick={() => handleExport(professorReport, 'report')}
                    className="px-4 py-2 bg-stone-100 text-stone-800 border border-stone-300 rounded hover:bg-stone-200 font-medium shadow-sm flex items-center gap-2"
                  >
                    <Icon name="download" size={16} />
                    Export
                  </button>
                )}
                <button
                  onClick={() => setShowReportSetup(true)}
                  disabled={isGeneratingReport}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingReport ? (
                    <>
                      <Icon name="loader" size={16} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icon name="bar-chart" size={16} />
                      {professorReport ? 'Regenerate Report' : 'Generate Report'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {reportError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                <Icon name="alert" size={20} />
                {reportError}
              </div>
            )}

            {isGeneratingReport ? (
              <div className="bg-white rounded-lg border-2 border-gray-200 p-12 text-center">
                <Icon name="loader" size={32} className="animate-spin mx-auto text-blue-500" />
                <p className="mt-4 text-gray-500">Analyzing notes against class materials...</p>
              </div>
            ) : professorReport ? (
              <div className="bg-white rounded-lg border-2 border-gray-200 shadow-lg">
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <div className="prose max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        p: ({ ...props }) => <p className="text-text-primary mb-4" {...props} />,
                        h1: ({ ...props }) => <h1 className="text-2xl font-bold text-text-primary mb-3 mt-6" {...props} />,
                        h2: ({ ...props }) => <h2 className="text-xl font-bold text-blue-800 mb-2 mt-5 pb-1 border-b border-blue-200" {...props} />,
                        h3: ({ ...props }) => <h3 className="text-lg font-semibold text-text-primary mb-2 mt-4" {...props} />,
                        ul: ({ ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                        ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                        li: ({ ...props }) => <li className="text-text-primary" {...props} />,
                        strong: ({ ...props }) => <strong className="font-bold text-blue-900" {...props} />,
                        blockquote: ({ ...props }) => <blockquote className="border-l-4 border-blue-300 pl-4 italic text-gray-600 my-4" {...props} />,
                      }}
                    >
                      {professorReport}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <Icon name="bar-chart" size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Professor Report Yet</h3>
                <p className="text-gray-500 mb-4 text-sm max-w-md mx-auto">
                  Compare student notes against class materials to identify misconceptions and learning gaps.
                </p>
                <button
                  onClick={() => setShowReportSetup(true)}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold inline-flex items-center gap-2"
                >
                  <Icon name="bar-chart" size={16} />
                  Generate Report
                </button>
              </div>
            )}
          </section>

        </div>
      </main>

      {/* Professor Report Setup Modal */}
      {showReportSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Icon name="bar-chart" size={20} className="text-blue-600" />
                Generate Professor Report
              </h2>
              <button
                onClick={() => setShowReportSetup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Icon name="x" size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  This tool compares student notes against class materials to identify misconceptions, missing concepts, and areas of confusion.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Notes
                </label>
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800 flex items-center gap-2">
                  <Icon name="check" size={16} />
                  Will use saved notes from this lecture
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Materials (Official content to compare against)
                </label>
                <input
                  ref={classMaterialsInputRef}
                  type="file"
                  accept=".md,.markdown,.txt"
                  onChange={handleClassMaterialsUpload}
                  className="hidden"
                />
                {classMaterials ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Icon name="check" size={16} />
                      Materials loaded ({classMaterials.length} characters)
                    </span>
                    <button
                      onClick={() => setClassMaterials('')}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => classMaterialsInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon name="upload" size={20} />
                    Click to upload class materials (.txt, .md)
                  </button>
                )}
                <textarea
                  value={classMaterials}
                  onChange={(e) => setClassMaterials(e.target.value)}
                  placeholder="Or paste class materials here..."
                  className="mt-2 w-full h-32 p-3 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowReportSetup(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateProfessorReport}
                disabled={!classMaterials.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Icon name="bar-chart" size={16} />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
