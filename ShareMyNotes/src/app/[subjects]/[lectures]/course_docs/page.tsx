import Link from 'next/link'
import { Button } from '@/components/Button/Button'
import { Icon } from '@/components/Icon/Icon'
import { appName, appDescription } from '@/lib/constants'
import { Navbar } from '@/components/Navbar/Navbar'
import PDFDisplayer from '@/components/PDFViewer/PDFViewer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar/>
      <main className="flex flex-col items-center">
        <div className="mt-6 w-4/5 flex justify-center">
          <PDFDisplayer doc="doc1" height={600} />
        </div>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: 'upload' | 'users' | 'message', title: string, description: string }) {
  return (
    <div className="note-card p-6 rounded-xl transition-all duration-200">
      <div className="w-12 h-12 bg-background-muted rounded-lg flex items-center justify-center mb-4">
        <Icon name={icon} size={24} className="text-text-primary" />
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }: { number: number, title: string, description: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 bg-text-primary text-background rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
        {number}
      </div>
      <h3 className="font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  )
}
