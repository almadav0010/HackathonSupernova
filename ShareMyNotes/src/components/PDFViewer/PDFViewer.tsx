"use client"
import React, { useEffect, useRef, useState } from 'react'

type DocKey = 'doc1' | 'doc2' | 'doc3'

type Props = {
  doc: DocKey
  height?: string | number
  width?: string | number
}

const DOC_MAP: Record<DocKey, string> = {
  doc1: '/doc1.pdf',
  doc2: '/doc2.pdf', //TODO change this to the actual path
  doc3: '/doc3.pdf',
}

export default function PDFDisplayer({ doc, height = 600, width = '100%' }: Props) {
  const src = DOC_MAP[doc]

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isFull, setIsFull] = useState(false)

  useEffect(() => {
    function onChange() {
      setIsFull(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (e) {
      // ignore fullscreen errors
    }
  }

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        style={{ height: typeof height === 'number' ? `${height}px` : height, width: typeof width === 'number' ? `${width}px` : width }}
        className="relative border rounded overflow-hidden bg-white"
      >
        {/* Top-right toggle: enter (⤢) when not fullscreen, exit (✕) when fullscreen */}
        <button
          onClick={toggleFullscreen}
          className={`absolute z-30 top-12 right-5 px-3 py-1 border-4 border-solid border-black text-white rounded size-16 text-2xl ${!isFull ? 'bg-green-800/60' : 'bg-red-800/60'}`}
          aria-label={isFull ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFull ? '✕' : '⤢'}
        </button>

        {src ? (
          <iframe src={src} className="w-full h-full" title={`PDF ${doc}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary">Document not found</div>
        )}
      </div>
    </div>
  )
}
