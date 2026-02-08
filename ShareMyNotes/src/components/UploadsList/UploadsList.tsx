'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/Button/Button'
import { Icon } from '@/components/Icon/Icon'
import { useToast } from '@/components/Toast/ToastProvider'
import type { IconName } from '@/components/Icon/Icon'

interface Upload {
  id: string
  user_id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  title: string
  description: string | null
  uploaded_at: string
  feedback?: {
    id: string
    feedback_content: string
    score: number | null
    suggestions: string[] | null
  } | null
}

interface UploadsListProps {
  courseId?: string
  lectureId?: string
  onSelectUpload?: (upload: Upload) => void
  refreshTrigger?: number // Increment to trigger refresh
}

const FILE_TYPE_ICONS: Record<string, IconName> = {
  pdf: 'file-text',
  doc: 'file-text',
  docx: 'file-text',
  txt: 'file-text',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
}

export function UploadsList({
  courseId,
  lectureId,
  onSelectUpload,
  refreshTrigger = 0,
}: UploadsListProps) {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    fetchUploads()
  }, [courseId, lectureId, refreshTrigger])

  const fetchUploads = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUploads([])
        setLoading(false)
        return
      }

      // Fetch only user's own uploads (private)
      let query = supabase
        .from('uploads')
        .select(`
          *,
          feedback (
            id,
            feedback_content,
            score,
            suggestions
          )
        `)
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })

      if (courseId) {
        query = query.eq('course_id', courseId)
      }
      if (lectureId) {
        query = query.eq('lecture_id', lectureId)
      }

      const { data, error } = await query

      if (error) {
        showToast(error.message, 'error')
        return
      }

      // Transform to get first feedback item
      const uploadsWithFeedback = (data || []).map(upload => ({
        ...upload,
        feedback: upload.feedback?.[0] || null
      }))

      setUploads(uploadsWithFeedback)
    } catch (error) {
      console.error('Error fetching uploads:', error)
      showToast('Failed to load uploads', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (upload: Upload) => {
    try {
      const response = await fetch(`/api/uploads/${upload.id}/download`)
      const data = await response.json()

      if (data.error) {
        showToast(data.error, 'error')
        return
      }

      // Open download URL in new tab
      window.open(data.downloadUrl, '_blank')
      showToast('Download started!', 'success')
      
      // Refresh to update download count
      fetchUploads()
    } catch (error) {
      console.error('Error downloading:', error)
      showToast('Failed to download file', 'error')
    }
  }

  const handleDelete = async (upload: Upload) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const response = await fetch(`/api/uploads/${upload.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.error) {
        showToast(data.error, 'error')
        return
      }

      showToast('File deleted successfully', 'success')
      fetchUploads()
    } catch (error) {
      console.error('Error deleting:', error)
      showToast('Failed to delete file', 'error')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="loader" size={32} className="animate-spin text-text-secondary" />
      </div>
    )
  }

  if (uploads.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon name="file" size={48} className="mx-auto text-text-secondary mb-4" />
        <p className="text-text-secondary font-medium">No uploads yet</p>
        <p className="text-sm text-text-secondary mt-1">
          Upload your first notes to get AI feedback!
        </p>
      </div>
    )
  }

  const getScoreColor = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return 'bg-background-subtle text-text-primary'
    if (score >= 80) return 'bg-green-100 text-green-700'
    if (score >= 60) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="space-y-4">
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="border-2 border-text-primary hand-drawn-subtle bg-background overflow-hidden"
        >
          {/* Main row */}
          <div 
            className="p-4 hover:bg-background-muted transition-colors cursor-pointer"
            onClick={() => setExpandedId(expandedId === upload.id ? null : upload.id)}
          >
            <div className="flex items-start gap-4">
              {/* File Icon */}
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon
                  name={FILE_TYPE_ICONS[upload.file_type] ?? 'file'}
                  size={24}
                  className="text-blue-600"
                />
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-text-primary truncate">{upload.title}</h3>
                  {upload.feedback?.score !== null && upload.feedback?.score !== undefined && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${getScoreColor(upload.feedback.score)}`}>
                      Score: {upload.feedback.score}%
                    </span>
                  )}
                  {upload.feedback && !upload.feedback.score && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      ✓ Analyzed
                    </span>
                  )}
                  {!upload.feedback && (
                    <span className="px-2 py-0.5 bg-background-subtle text-text-primary text-xs font-medium rounded">
                      Pending
                    </span>
                  )}
                </div>

                <p className="text-sm text-text-secondary mt-1">
                  {upload.file_name} • {formatFileSize(upload.file_size)} • {upload.file_type.toUpperCase()}
                </p>

                <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Icon name="calendar" size={14} />
                    {formatDate(upload.uploaded_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="chevron-right" size={14} className={`transition-transform ${expandedId === upload.id ? 'rotate-90' : ''}`} />
                    {expandedId === upload.id ? 'Hide feedback' : 'View feedback'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(upload)}
                  className="flex items-center gap-1"
                >
                  <Icon name="download" size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(upload)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Icon name="trash" size={16} />
                </Button>
              </div>
            </div>
          </div>

          {/* Expanded Feedback Section */}
          {expandedId === upload.id && (
            <div className="border-t-2 border-text-primary bg-background-muted p-4">
              {upload.feedback ? (
                <div className="space-y-3">
                  <h4 className="font-bold text-text-primary flex items-center gap-2">
                    <Icon name="message" size={18} />
                    AI Feedback
                  </h4>
                  
                  <p className="text-sm text-text-primary whitespace-pre-wrap">
                    {upload.feedback.feedback_content}
                  </p>

                  {upload.feedback.suggestions && upload.feedback.suggestions.length > 0 && (
                    <div className="mt-3">
                      <h5 className="font-bold text-sm text-text-primary mb-2">Suggestions:</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {upload.feedback.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-sm text-text-secondary">
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Icon name="loader" size={24} className="mx-auto text-text-secondary mb-2" />
                  <p className="text-sm text-text-secondary">
                    No AI feedback yet. Analysis may still be processing.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={async (e) => {
                      e.stopPropagation()
                      try {
                        const response = await fetch('/api/analyze', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ uploadId: upload.id }),
                        })
                        if (response.ok) {
                          showToast('Analysis started!', 'success')
                          fetchUploads()
                        }
                      } catch {
                        showToast('Failed to start analysis', 'error')
                      }
                    }}
                  >
                    <Icon name="message" size={16} className="mr-1" />
                    Analyze Now
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
