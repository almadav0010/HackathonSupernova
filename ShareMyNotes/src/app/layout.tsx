import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/Toast/ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ShareMyNotes - Collaborative Learning',
  description: 'Share notes with classmates and get AI-powered feedback to improve your learning.',
  keywords: ['notes', 'learning', 'collaboration', 'students', 'AI', 'feedback', 'education'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
