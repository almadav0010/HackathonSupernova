'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar/Navbar'
import { Icon } from '@/components/Icon/Icon'
import { createClient } from '@/lib/supabase/client'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'

export default function NotesPage() {
  const pathname = usePathname() || ''
  const params = useParams()
  const subject = params?.subjects as string || 'unknown'
  const lecture = params?.lectures as string || 'notes'
  const storageKey = `sharenotes_content:${pathname}`

  const [content, setContent] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [summary, setSummary] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isCorrecting, setIsCorrecting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const subjectName = subject.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const lectureName = lecture.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  // Load from localStorage and database on mount
  useEffect(() => {
    const loadContent = async () => {
      // First try localStorage
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        setContent(saved)
      }
      
      // Then try to load from database
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data } = await supabase
            .from('uploads')
            .select('content')
            .eq('user_id', user.id)
            .eq('storage_path', `notes/${subject}/${lecture}`)
            .single()
          
          if (data?.content) {
            setContent(data.content)
            localStorage.setItem(storageKey, data.content)
          }
        }
      } catch (e) {
        // Ignore errors, use localStorage content
      }
      
      setIsMounted(true)
    }
    
    loadContent()
  }, [storageKey, subject, lecture])

  // Auto-save to localStorage and database with debounce
  useEffect(() => {
    if (!isMounted) return
    
    // Save to localStorage immediately
    try {
      localStorage.setItem(storageKey, content)
    } catch (e) {
      // ignore
    }

    // Debounce database save (save after 2 seconds of no typing)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    if (content.trim()) {
      saveTimeoutRef.current = setTimeout(() => {
        saveToDatabase()
      }, 2000)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [content, isMounted, storageKey])

  // Save notes to database
  const saveToDatabase = async () => {
    if (!content.trim()) return
    
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('Not logged in, skipping database save')
        setIsSaving(false)
        return
      }

      const title = `${subjectName}: ${lectureName}`
      const fileName = `${title}.txt`

      // Check if we already have a note for this lecture
      const { data: existingNote } = await supabase
        .from('uploads')
        .select('id')
        .eq('user_id', user.id)
        .eq('storage_path', `notes/${subject}/${lecture}`)
        .single()

      if (existingNote) {
        // Update existing note
        await supabase
          .from('uploads')
          .update({
            content: content,
            title: title,
            file_name: fileName,
            file_size: new Blob([content]).size,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingNote.id)
      } else {
        // Create new note
        await supabase
          .from('uploads')
          .insert({
            user_id: user.id,
            file_name: fileName,
            file_type: 'txt',
            file_size: new Blob([content]).size,
            file_url: `local://notes/${subject}/${lecture}`,
            storage_path: `notes/${subject}/${lecture}`,
            title: title,
            content: content,
            is_public: false,
          })
      }

      setLastSaved(new Date())
    } catch (error) {
      console.error('Error saving to database:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        setContent(text)
      }
    }
    reader.readAsText(file)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle export
  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${subjectName} - ${lectureName}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handle summarize
  const handleSummarize = async () => {
    if (!content.trim()) {
      alert('Please write some notes first!')
      return
    }

    setIsSummarizing(true)
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notes: content,
          saveToDb: true,
          storagePath: `notes/${subject}/${lecture}`,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary')
      }

      setSummary(data.summary)
      setShowSummary(true)
    } catch (error) {
      console.error('Summary error:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate summary')
    } finally {
      setIsSummarizing(false)
    }
  }

  // Handle AI correction - analyzes and corrects notes
  const handleCorrection = async () => {
    if (!content.trim()) {
      alert('Please write some notes first!')
      return
    }

    setIsCorrecting(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notes: content,
          subject: subjectName,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze notes')
      }

      // Replace content with corrected version
      setContent(data.correctedNotes)
      // Switch to preview mode to show the formatted result
      setShowPreview(true)
      // Save to localStorage
      localStorage.setItem(storageKey, data.correctedNotes)
    } catch (error) {
      console.error('Correction error:', error)
      alert(error instanceof Error ? error.message : 'Failed to correct notes')
    } finally {
      setIsCorrecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-primary mb-1">
                <span>{subjectName}</span>
                <Icon name="chevron-right" size={14} />
                <span>{lectureName}</span>
              </div>
              <h1 className="text-3xl font-bold text-primary">My Notes</h1>
            </div>

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,text/markdown,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-amber-100 text-amber-900 border border-amber-300 rounded hover:bg-amber-200 font-medium shadow-sm flex items-center gap-2"
              >
                <Icon name="upload" size={16} />
                Upload .txt
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-stone-100 text-text-primary border border-stone-300 rounded hover:bg-stone-200 hover:text-text-primary-dark font-medium shadow-sm flex items-center gap-2"
              >
                <Icon name="download" size={16} />
                Export .txt
              </button>
              <button
                onClick={handleSummarize}
                disabled={isSummarizing || !content.trim()}
                className="px-4 py-2 bg-purple-100 text-purple-900 border border-purple-300 rounded hover:bg-purple-200 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSummarizing ? (
                  <>
                    <Icon name="loader" size={16} className="animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  <>
                    <Icon name="zap" size={16} />
                    Summarize
                  </>
                )}
              </button>
              <button
                onClick={handleCorrection}
                disabled={isCorrecting || !content.trim()}
                className="px-4 py-2 bg-green-100 text-green-900 border border-green-300 rounded hover:bg-green-200 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCorrecting ? (
                  <>
                    <Icon name="loader" size={16} className="animate-spin" />
                    Correcting...
                  </>
                ) : (
                  <>
                    <Icon name="check" size={16} />
                    AI Correct
                  </>
                )}
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 bg-orange-50 text-orange-900 border border-orange-200 rounded hover:bg-orange-100 font-medium shadow-sm flex items-center gap-2"
              >
                <Icon name={showPreview ? 'edit' : 'eye'} size={16} />
                {showPreview ? 'Edit' : 'Preview'}
              </button>
              
              {/* Saving indicator */}
              <div className="flex items-center min-w-[80px] justify-end">
                {isSaving ? (
                  <span className="text-amber-600 text-xs flex items-center gap-1">
                    <Icon name="loader" size={12} className="animate-spin" />
                    Saving
                  </span>
                ) : lastSaved ? (
                  <span className="text-green-600 text-xs flex items-center gap-1">
                    <Icon name="check" size={12} />
                    Saved
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          
          {!showPreview ? (
            <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write or paste your notes here. Use LaTeX: $x^2$ for inline..."
                className="w-full h-screen p-6 text-text-primary placeholder-text-primary focus:outline-none resize-none font-mono text-lg"
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg p-6">
              <style>{`
                .preview-content {
                  font-size: 1.2rem;
                  line-height: 1.8;
                }
                .ai-comment {
                  color: #374151 !important;
                  font-style: italic !important;
                  font-size: 0.75em !important;
                  background-color: #f3f4f6;
                  padding: 2px 6px;
                  border-radius: 4px;
                  margin-left: 4px;
                }
              `}</style>
              <div className="preview-content prose max-w-none h-screen overflow-y-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                  components={{
                    p: ({ ...props }) => <p className="text-text-primary mb-4" {...props} />,
                    h1: ({ ...props }) => <h1 className="text-4xl font-bold text-text-primary mb-4" {...props} />,
                    h2: ({ ...props }) => <h2 className="text-3xl font-bold text-text-primary mb-3" {...props} />,
                    h3: ({ ...props }) => <h3 className="text-2xl font-bold text-text-primary mb-2" {...props} />,
                    code: ({ className, children, ...props }) => {
                      const isInline = !className
                      return isInline 
                        ? <code className="bg-background-muted px-2 py-1 rounded text-base font-mono text-text-primary" {...props}>{children}</code>
                        : <code className="block bg-background-subtle p-4 rounded mb-4 overflow-x-auto font-mono text-sm text-text-primary" {...props}>{children}</code>
                    },
                    pre: ({ ...props }) => <pre className="bg-background-subtle p-4 rounded mb-4 overflow-x-auto" {...props} />,
                    span: ({ children, style, ...props }) => {
                      const childText = String(children || '')
                      if (childText.startsWith('[') && childText.endsWith(']')) {
                        return <span className="ai-comment" {...props}>{children}</span>
                      }
                      return <span style={style} {...props}>{children}</span>
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          )}
          
          <div className="mt-2 text-xs text-text-secondary">
            <span>Auto-saved • $..$ for LaTeX • <span className="italic">[AI comments]</span> styled</span>
          </div>
        </div>
      </main>

      {/* Summary Modal */}
      {showSummary && summary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Icon name="zap" size={20} className="text-purple-600" />
                AI Summary
              </h2>
              <button onClick={() => setShowSummary(false)} className="text-text-primary hover:text-text-primary-dark">
                <Icon name="x" size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {summary}
                </ReactMarkdown>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([summary], { type: 'text/markdown' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${subjectName} - ${lectureName} - Summary.md`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="px-4 py-2 bg-purple-100 text-purple-900 border border-purple-300 rounded hover:bg-purple-200 font-medium flex items-center gap-2"
              >
                <Icon name="download" size={16} />
                Export
              </button>
              <button onClick={() => setShowSummary(false)} className="px-4 py-2 bg-background-subtle text-text-primary border border-border-light rounded hover:bg-background-muted hover:text-text-primary-dark font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
