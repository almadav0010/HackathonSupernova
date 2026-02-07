'use client'

import React, { useEffect, useRef, useState } from 'react'

type Props = {
  content: string
  height?: string | number
  width?: string | number
}

export default function TextReader({ content, height = 600, width = '100%' }: Props) {
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
        className="relative border-2 border-gray-300 rounded overflow-hidden bg-white"
      >
        {/* Top-right fullscreen toggle button */}
        <button
          onClick={toggleFullscreen}
          className={`absolute z-30 top-12 right-5 px-3 py-1 border-4 border-solid border-black text-white rounded size-16 text-2xl ${!isFull ? 'bg-green-800/60' : 'bg-red-800/60'}`}
          aria-label={isFull ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFull ? '✕' : '⤢'}
        </button>

        {/* Scrollable text content */}
        <div className="w-full h-full overflow-y-auto p-6">
          <pre className="font-mono text-sm text-text-primary whitespace-pre-wrap break-words">
            {content || 'No content available'}
          </pre>
        </div>
      </div>
    </div>
  )
}
