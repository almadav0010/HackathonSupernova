import Link from 'next/link'
import { Button } from '@/components/Button/Button'
import { Icon } from '@/components/Icon/Icon'
import { appName, appDescription } from '@/lib/constants'
import { Navbar } from '@/components/Navbar/Navbar'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
      <Link href="/" className="flex items-center gap-2 text-text-primary">
        <Icon name="book" size={28} />
        <span className="text-xl font-bold">{appName}</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/auth/signin">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button size="sm">
            Get Started
          </Button>
        </Link>
      </div>
    </nav>

      {/* Hero Section */}
      <main className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            Learn Together,{' '}
            <span className="text-accent-blue">Grow Together</span>
          </h1>
          <p className="text-xl text-text-secondary mb-8">
            {appDescription}. Share your notes with classmates, collaborate in real-time, 
            and receive AI-powered feedback to enhance your learning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                <Icon name="plus" size={20} className="mr-2" />
                Start Sharing Notes
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                <Icon name="users" size={20} className="mr-2" />
                Join a Lecture Room
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon="upload"
            title="Upload Notes"
            description="Share your lecture notes with classmates. Choose to keep them private or let others see your work."
          />
          <FeatureCard 
            icon="users"
            title="Real-time Collaboration"
            description="Join lecture rooms and see who's online. Collaborate with classmates in real-time using Supabase Presence."
          />
          <FeatureCard 
            icon="message"
            title="AI Feedback"
            description="Get personalized feedback on your notes from AI, powered by the collective knowledge of your class."
          />
        </div>

        {/* How it Works Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <StepCard 
              number={1}
              title="Sign Up"
              description="Create your account in seconds"
            />
            <StepCard 
              number={2}
              title="Select Course"
              description="Choose your subject or lecture"
            />
            <StepCard 
              number={3}
              title="Upload Notes"
              description="Share your notes with the room"
            />
            <StepCard 
              number={4}
              title="Get Feedback"
              description="Receive AI-powered insights"
            />
          </div>
        </div>
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
