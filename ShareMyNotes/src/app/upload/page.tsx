'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FileUpload, AIFeedback } from '@/components/FileUpload'
import { UploadsList } from '@/components/UploadsList'
import { Button } from '@/components/Button/Button'
import { Icon } from '@/components/Icon/Icon'
import { appName } from '@/lib/constants'

type Tab = 'upload' | 'my-notes'

export default function UploadPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('upload')
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [lastFeedback, setLastFeedback] = useState<AIFeedback | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/signin?redirect=/upload')
      return
    }

    setUser({ id: user.id, email: user.email || '' })
    setLoading(false)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon name="loader" size={32} className="animate-spin text-text-secondary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-text-primary bg-background sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-text-primary">
            <Icon name="book" size={28} />
            <span className="text-xl font-bold">{appName}</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <Icon name="logout" size={18} className="mr-1" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">My Notes</h1>
        <p className="text-text-secondary mb-8">Upload your notes and get instant AI feedback on accuracy and quality</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b-2 border-text-primary">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 font-bold text-sm transition-colors ${
              activeTab === 'upload'
                ? 'text-text-primary border-b-4 border-text-primary -mb-0.5'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon name="upload" size={18} className="inline mr-2" />
            Upload New
          </button>
          <button
            onClick={() => setActiveTab('my-notes')}
            className={`px-4 py-2 font-bold text-sm transition-colors ${
              activeTab === 'my-notes'
                ? 'text-text-primary border-b-4 border-text-primary -mb-0.5'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon name="folder" size={18} className="inline mr-2" />
            My Notes
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border-2 border-text-primary hand-drawn-subtle p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Icon name="upload" size={24} />
                Upload Notes
              </h2>
              <FileUpload
                autoAnalyze={true}
                onUploadComplete={(file, feedback) => {
                  console.log('Uploaded:', file)
                  if (feedback) {
                    setLastFeedback(feedback)
                  }
                  setRefreshTrigger(prev => prev + 1)
                  setActiveTab('my-notes')
                }}
              />
            </div>

            {/* Show last feedback if available */}
            {lastFeedback && (
              <div className="mt-6 bg-purple-50 border-2 border-purple-300 hand-drawn-subtle p-6">
                <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                  <Icon name="message" size={20} />
                  AI Feedback
                  {lastFeedback.score && (
                    <span className="ml-auto px-3 py-1 bg-purple-200 text-purple-800 text-sm font-bold rounded">
                      Score: {lastFeedback.score}%
                    </span>
                  )}
                </h3>
                <p className="text-purple-900 whitespace-pre-wrap">{lastFeedback.content}</p>
                
                {lastFeedback.suggestions && lastFeedback.suggestions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-bold text-purple-800 mb-2">Suggestions:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {lastFeedback.suggestions.map((s, i) => (
                        <li key={i} className="text-purple-700 text-sm">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                  onClick={() => setLastFeedback(null)}
                >
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-notes' && (
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <Icon name="folder" size={24} />
              My Notes
              <span className="text-sm font-normal text-text-secondary ml-2">
                (Click on a note to see AI feedback)
              </span>
            </h2>
            <UploadsList refreshTrigger={refreshTrigger} />
          </div>
        )}
      </main>
    </div>
  )
}
