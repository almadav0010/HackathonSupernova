'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button/Button'
import { Icon } from '@/components/Icon/Icon'
import { UserMenu } from '@/components/UserMenu'
import { appName } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'

interface Note {
  id: string
  title: string
  content: string
  storage_path: string
  updated_at: string
  created_at: string
}

export default function SubjectsPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const subjects = [
    { name: 'Linear Algebra', slug: 'linear-algebra' },
    { name: 'Calculus', slug: 'calculus' },
    { name: 'Objects in Programming', slug: 'oop' },
    { name: 'Procedural Programming', slug: 'procedural' },
    { name: 'Datastructures and Algorithms', slug: 'dsa' },
    { name: 'Discrete Mathematics', slug: 'discrete-math' },
    { name: 'Neuroscience', slug: 'neuroscience' },
    { name: 'Databases', slug: 'databases' },
    { name: 'Numerical Methods', slug: 'numerical-methods' },
  ]

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('User:', user?.id)
      
      if (!user) {
        console.log('No user logged in')
        setIsLoading(false)
        return
      }

      // Get all notes for this user - using * to get all columns
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })

      console.log('Query result:', { data, error, count: data?.length })

      if (error) {
        console.error('Error loading notes:', error)
      } else {
        // Map the data to our Note interface
        const mappedNotes = (data || []).map(item => ({
          id: item.id,
          title: item.title || item.file_name || 'Untitled',
          content: item.content || '',
          storage_path: item.storage_path || '',
          updated_at: item.uploaded_at || item.created_at,
          created_at: item.created_at || item.uploaded_at,
        }))
        setNotes(mappedNotes)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const openNote = (note: Note) => {
    // Parse storage_path to get subject and lecture
    // Format: notes/{subject}/{lecture} or notes/{subject}/{lecture}/{noteId}
    if (note.storage_path && note.storage_path.startsWith('notes/')) {
      const parts = note.storage_path.split('/')
      if (parts.length >= 3) {
        const subject = parts[1]
        const lecture = parts[2]
        router.push(`/${subject}/${lecture}/notes`)
        return
      }
    }
    // For notes without proper storage_path, go to upload page
    router.push(`/upload?tab=my-notes`)
  }

  const getPreviewText = (content: string) => {
    if (!content) return 'Empty note'
    const stripped = content.replace(/[#*_`\[\]]/g, '').trim()
    return stripped.length > 100 ? stripped.substring(0, 100) + '...' : stripped
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header with Profile Menu */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2">
            <Icon name="book" size={24} className="text-accent-blue" />
            <span className="font-bold text-xl text-primary">{appName}</span>
          </Link>
          <UserMenu />
        </div>
      </header>

      <main className="px-6 py-8 max-w-6xl mx-auto">
        {/* My Notes Section - Google Docs Style */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-primary flex items-center gap-2">
            <Icon name="file-text" size={24} className="text-blue-500" />
            My Notes ({notes.length})
          </h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="loader" size={32} className="animate-spin text-primary" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Icon name="file-text" size={48} className="text-primary mx-auto mb-3" />
              <p className="text-primary">No notes yet. Choose a subject below to start taking notes!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => openNote(note)}
                  className="group aspect-[3/4] bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col text-left"
                >
                  {/* Document Preview */}
                  <div className="flex-1 p-3 overflow-hidden">
                    <div className="h-full bg-gray-50 rounded border border-gray-100 p-2">
                      <p className="text-[10px] text-primary leading-relaxed line-clamp-[6]">
                        {getPreviewText(note.content)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Document Info */}
                  <div className="px-3 pb-2 pt-1 border-t border-gray-100">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
                        <Icon name="file-text" size={12} className="text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-medium text-primary truncate group-hover:text-blue-600">
                          {note.title || 'Untitled'}
                        </h3>
                        <p className="text-[10px] text-primary">
                          {formatDate(note.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Subjects Section */}
        <section>
          <h1 className="text-4xl font-bold mb-8 text-center text-primary">
            Choose a Subject
          </h1>
          <h2 className="text-1xl font-light mb-5 text-center align-text-bottom text-secondary">
           to start taking notes!
          </h2>
          <div className="grid grid-cols-3 gap-8 justify-items-center">
            {subjects.map((subject) => (
              <Link key={subject.slug} href={`/${subject.slug}`}>
                <Button variant="subjects" size="subj" color='accent-blue'>
                  {subject.name}
                </Button>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border mt-16">
        <div className="max-w-6xl mx-auto text-center text-text-tertiary">
          <p>© 2026 {appName}. Built with ❤️ at Supernova.</p>
        </div>
      </footer>
    </div>
  )
}