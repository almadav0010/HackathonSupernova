'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/Button/Button'
import { appName } from '@/lib/constants'
import { Icon } from '@/components/Icon/Icon'

// hardcoded lecture data for every subject
//the URL structire changes through the file structure int he app
//[subjects] allows us to dynamically change the URL depending ont he subject
const lectureData: Record<string, string[]> = {
  'linear-algebra': ['Vectors & Matrices', 'Eigenvalues', 'Linear Transformations', 'Determinants'],
  'calculus': ['Limits', 'Derivatives', 'Integrals', 'Series'],
  'oop': ['Classes & Objects', 'Inheritance', 'Polymorphism', 'Encapsulation'],
  'procedural': ['Functions', 'Loops', 'Arrays', 'Pointers'],
  'dsa': ['Arrays', 'Linked Lists', 'Trees', 'Sorting Algorithms'],
  'discrete-math': ['Logic', 'Sets', 'Graph Theory', 'Combinatorics'],
  'neuroscience': ['Neurons', 'Synapses', 'Brain Regions', 'Neural Networks'],
  'databases': ['SQL Basics', 'Joins', 'Normalization', 'Indexing'],
  'numerical-methods': ['Root Finding', 'Interpolation', 'Integration', 'ODEs'],
}

// Schöne Namen für die Subjects
const subjectNames: Record<string, string> = {
  'linear-algebra': 'Linear Algebra',
  'calculus': 'Calculus',
  'oop': 'Objects in Programming',
  'procedural': 'Procedural Programming',
  'dsa': 'Datastructures and Algorithms',
  'discrete-math': 'Discrete Mathematics',
  'neuroscience': 'Neuroscience',
  'databases': 'Databases',
  'numerical-methods': 'Numerical Methods',
}

export default function SubjectLecturesPage() {
  const params = useParams()
  const subject = params.subjects as string  // z.B. "linear-algebra"
  
  const lectures = lectureData[subject] || []
  const subjectName = subjectNames[subject] || subject

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-16 max-w-6xl mx-auto">
        
        {/* Back Button */}
        <Link href="/home">
          <Button variant="ghost" size="md"> 
            <Icon name="chevron-left" size={20} className="mr-1" />
            Back to Subjects
          </Button>
        </Link>
        
        {/* Title */}
        <h1 className="text-4xl font-bold mt-8 mb-6 text-text-primary">
          {subjectName}
        </h1>
        
        <p className="text-text-secondary mb-8">
          Choose a lecture to view notes:
        </p>

        {/* Lectures Grid */}
        <div className="grid grid-cols-3 gap-8">
          {lectures.map((lecture, index) => (
            <Link key={index} href={`/${subject}/lecture-${index + 1}`}>
              <Button variant="subjects" size="subj">
                {lecture}
              </Button>
            </Link>
          ))}
        </div>

        {/* No lectures found */}
        {lectures.length === 0 && (
          <p className="text-text-secondary">No lectures found for this subject.</p>
        )}

      </main>

      <footer className="px-6 py-8 border-t border-border mt-16">
        <div className="max-w-6xl mx-auto text-center text-text-tertiary">
          <p>© 2026 {appName}. Built with ❤️ at Hackathon.</p>
        </div>
      </footer>
    </div>
  )
}



/*

this is a file insdie [subjects] folder and was made as a dynamic router to each fo the subjects pages in the website....

basic structure and workings:
- what this [subjects] folder does is that it creates a dynamic route for each subject, so that when the user clicks on a subject, they are taken to a page that lists all the lectures for that subject.
- basic proces:
    - ser clicks ona subject
    - url becomes autoomatically to /subject-name
    - [subjects]/page.tsx file loads
    - userParams() --> in the specifc subject will come
    - lectureData object is used to get the lectures for that subject
    - subjectNames object is used to get the nice name for that subject
    - page is rendered with the lectures for that subject

*/