'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/Button/Button'
import { Icon } from '@/components/Icon/Icon'
import { useToast } from '@/components/Toast/ToastProvider'

interface FileUploadProps {
  courseId?: string
  lectureId?: string
  onUploadComplete?: (upload: UploadedFile, feedback?: AIFeedback) => void
  maxSizeMB?: number
  acceptedTypes?: string[]
  autoAnalyze?: boolean // Auto-trigger Langflow analysis after upload
}

export interface UploadedFile {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  fileUrl: string
  title: string
  uploadedAt: string
}

export interface AIFeedback {
  id: string
  content: string
  score?: number
  suggestions?: string[]
  keyPoints?: string[]
  topics?: string[]
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg',
]

const FILE_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'text/plain': 'TXT',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/jpg': 'JPG',
}

export function FileUpload({
  courseId,
  lectureId,
  onUploadComplete,
  maxSizeMB = 10,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  autoAnalyze = true,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type not supported. Accepted types: ${acceptedTypes.map(t => FILE_TYPE_LABELS[t] || t).join(', ')}`
    }
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size is ${maxSizeMB}MB`
    }
    return null
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      const error = validateFile(file)
      if (error) {
        showToast(error, 'error')
        return
      }
      setSelectedFile(file)
      setTitle(file.name.replace(/\.[^/.]+$/, '')) // Remove extension for title
    }
  }, [acceptedTypes, maxSizeBytes, showToast])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const error = validateFile(file)
      if (error) {
        showToast(error, 'error')
        return
      }
      setSelectedFile(file)
      setTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  // Analyze upload with Langflow
  const analyzeWithLangflow = async (uploadId: string): Promise<AIFeedback | undefined> => {
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        if (response.status !== 409) {
          showToast(data.error || 'Failed to analyze file', 'error')
        }
        return undefined
      }

      showToast('AI analysis complete!', 'success')
      return data.feedback as AIFeedback

    } catch (error) {
      console.error('Analysis error:', error)
      showToast('Failed to analyze file with AI', 'error')
      return undefined
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast('Please select a file first', 'error')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        showToast('Please sign in to upload files', 'error')
        setIsUploading(false)
        return
      }

      // Create unique file path: userId/timestamp-filename
      const timestamp = Date.now()
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${timestamp}-${selectedFile.name}`
      const storagePath = `${user.id}/${fileName}`

      setUploadProgress(20)

      // Upload to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('uploads')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (storageError) {
        throw new Error(storageError.message)
      }

      setUploadProgress(60)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(storagePath)

      const fileUrl = urlData.publicUrl

      setUploadProgress(80)

      // Save upload record to database (always private)
      const { data: uploadData, error: dbError } = await supabase
        .from('uploads')
        .insert({
          user_id: user.id,
          course_id: courseId || null,
          lecture_id: lectureId || null,
          file_name: selectedFile.name,
          file_type: fileExt || 'unknown',
          file_size: selectedFile.size,
          file_url: fileUrl,
          storage_path: storagePath,
          title: title || selectedFile.name,
          description: description || null,
          is_public: false, // Always private - no sharing
        })
        .select()
        .single()

      if (dbError) {
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage.from('uploads').remove([storagePath])
        throw new Error(dbError.message)
      }

      setUploadProgress(100)

      showToast('File uploaded successfully!', 'success')

      const uploadedFile: UploadedFile = {
        id: uploadData.id,
        fileName: uploadData.file_name,
        fileType: uploadData.file_type,
        fileSize: uploadData.file_size,
        fileUrl: uploadData.file_url,
        title: uploadData.title,
        uploadedAt: uploadData.uploaded_at,
      }

      // Auto-analyze with Langflow if enabled
      let feedback: AIFeedback | undefined
      if (autoAnalyze) {
        setIsUploading(false)
        feedback = await analyzeWithLangflow(uploadData.id)
      }

      // Call callback with uploaded file info and feedback
      if (onUploadComplete) {
        onUploadComplete(uploadedFile, feedback)
      }

      // Reset form
      setSelectedFile(null)
      setTitle('')
      setDescription('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('Upload error:', error)
      showToast(error instanceof Error ? error.message : 'Failed to upload file', 'error')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setTitle('')
    setDescription('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 hand-drawn-subtle
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-text-primary hover:border-blue-400 hover:bg-background-muted'
          }
          ${selectedFile ? 'border-green-500 bg-green-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
          className="hidden"
        />

        {selectedFile ? (
          <div className="space-y-2">
            <Icon name="file" size={40} className="mx-auto text-green-600" />
            <p className="font-bold text-text-primary">{selectedFile.name}</p>
            <p className="text-sm text-text-secondary">
              {formatFileSize(selectedFile.size)} • {FILE_TYPE_LABELS[selectedFile.type] || selectedFile.type}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveFile()
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Icon name="x" size={16} className="mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Icon name="upload" size={40} className="mx-auto text-text-secondary" />
            <p className="font-bold text-text-primary">
              {isDragging ? 'Drop your file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-sm text-text-secondary">
              PDF, DOC, DOCX, TXT, PNG, JPG up to {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>

      {/* File Details Form */}
      {selectedFile && (
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-text-primary mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border-2 border-text-primary hand-drawn-subtle bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Give your notes a title"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-bold text-text-primary mb-2">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border-2 border-text-primary hand-drawn-subtle bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              placeholder="Add a description..."
            />
          </div>

          {/* Info about auto-analysis */}
          {autoAnalyze && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Icon name="info" size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                After uploading, your notes will be automatically analyzed by AI to check correctness and provide feedback.
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {(isUploading || isAnalyzing) && (
            <div className="space-y-2">
              <div className="w-full bg-background-muted rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${isAnalyzing ? 'bg-purple-500 animate-pulse' : 'bg-blue-500'}`}
                  style={{ width: isAnalyzing ? '100%' : `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-text-secondary text-center">
                {isAnalyzing ? '🤖 Analyzing with AI...' : `Uploading... ${uploadProgress}%`}
              </p>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={isUploading || isAnalyzing || !selectedFile}
            className="w-full flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Icon name="loader" size={20} className="animate-spin" />
                Uploading...
              </>
            ) : isAnalyzing ? (
              <>
                <Icon name="loader" size={20} className="animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Icon name="upload" size={20} />
                Upload & Analyze
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
