'use client'

import Link from 'next/link'
import { Button } from '@/components/Button/Button'
import { Icon } from '@/components/Icon/Icon'
import { UserMenu } from '@/components/UserMenu'
import { appName, appDescription } from '@/lib/constants'



export default function SubjectsPage() {

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
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header with Profile Menu */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2">
            <Icon name="book" size={24} className="text-accent-blue" />
            <span className="font-bold text-xl text-text-primary">{appName}</span>
          </Link>
          <UserMenu />
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-16 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-text-primary">
          Choose a Subject
        </h1>
        <div className="grid grid-cols-3 gap-8 justify-items-center">
          {/*loops over every subject  and then creates a button for each subject*/}
          {subjects.map((subject) => (
            
            <Link key={subject.slug} href={`/${subject.slug}`}>
              <Button variant="subjects" size="subj" color='accent-blue'>
                {subject.name}
              </Button>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border mt-16">
        <div className="max-w-6xl mx-auto text-center text-text-tertiary">
          <p>© 2026 {appName}. Built with ❤️ at Hackathon.</p>
        </div>
      </footer>
    </div>
  )
}