'use client'

import Link from 'next/link'
import { Button } from '@/components/Button/Button'
import { Icon } from '@/components/Icon/Icon'
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
      {/* Navigation */}
      

      {/* Hero Section */}
      <main className="px-6 py-16 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-text-primary">
          Choose a Subject
        </h1>
        <div className="grid grid-cols-3 gap-8">
          {subjects.map((subject) => (
            <Link key={subject.slug} href={`/${subject.slug}`}>
              <Button variant="subjects" size="subj">
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