'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/Navbar/Navbar'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

export default function NotesPage() {
  const pathname = usePathname() || ''
  const storageKey = `sharenotes_content:${pathname}`
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [content, setContent] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) setContent(saved)
    setIsMounted(true)
  }, [storageKey])

  // Auto-save to localStorage
  useEffect(() => {
    if (!isMounted) return
    try {
      localStorage.setItem(storageKey, content)
    } catch (e) {
      // ignore
    }
  }, [content, isMounted, storageKey])

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (text) setContent(text)
    }
    reader.readAsText(file)
  }

  function handleExport() {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'notes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-text-primary">My Notes</h1>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,text/markdown"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Upload .md
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Export .txt
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
          </div>
          
          {!showPreview ? (
            // Editor view
            <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write or paste your notes here. Use LaTeX: $x^2$ for inline..."
                className="w-full h-screen p-6 text-text-primary placeholder-gray-400 focus:outline-none resize-none font-mono"
              />
            </div>
          ) : (
            // Preview view
            <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg p-6">
              <div className="prose prose-sm max-w-none h-screen overflow-y-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    p: ({ node, ...props }) => <p className="text-text-primary mb-4" {...props} />,
                    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-text-primary mb-4" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-text-primary mb-3" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-text-primary mb-2" {...props} />,
                    code: ({ node, inline, ...props }) => inline 
                      ? <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono" {...props} />
                      : <code className="block bg-gray-100 p-4 rounded mb-4 overflow-x-auto font-mono text-sm" {...props} />,
                    pre: ({ node, ...props }) => <pre className="bg-gray-100 p-4 rounded mb-4 overflow-x-auto" {...props} />,
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          )}
          
          <div className="mt-4 text-sm text-text-secondary">
            Auto-saved to your browser • Use $..$ for inline LaTeX
          </div>
        </div>
      </main>
    </div>
  )
}
