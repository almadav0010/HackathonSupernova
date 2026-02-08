import Link from 'next/link'
import { Button } from '@/components/Button/Button'
import { Icon } from '@/components/Icon/Icon'
import { IconName } from '@/components/Icon/Icon'
import { appName } from '@/lib/constants'

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
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-accent-blue/10 text-accent-blue px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Icon name="zap" size={16} />
            AI-Powered Note Analysis
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-text-primary mb-6 leading-tight">
            Transform Your Notes Into{' '}
            <span className="text-accent-blue">Learning Insights</span>
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            The smart note-taking platform where students get AI-powered feedback based on course material, 
            and teachers gain real-time understanding of student comprehension — all before the exam.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                <Icon name="zap" size={20} className="mr-2" />
                Start For Free
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                <Icon name="login" size={20} className="mr-2" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          <StatCard value="AI" label="Powered Feedback" />
          <StatCard value="Real-time" label="Corrections" />
          <StatCard value="Per Lecture" label="Reports" />
          <StatCard value="Centralized" label="Notes Hub" />
        </div>

        {/* For Students Section */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              For Students
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Take notes during lectures and get instant AI feedback based on your course material
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon="zap"
              title="Auto-Correct Your Notes"
              description="AI analyzes your notes against the course material and automatically corrects mistakes, fills gaps, and improves clarity."
              highlight
            />
            <FeatureCard 
              icon="message"
              title="Personalized AI Feedback"
              description="Get detailed feedback on your understanding. The AI identifies what you've grasped and what needs more attention."
            />
            <FeatureCard 
              icon="folder"
              title="Centralized Notes Hub"
              description="Keep all your notes organized by subject and lecture in one place. Access them anytime, from any device."
            />
          </div>
        </div>

        {/* For Teachers Section */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              For Teachers
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Understand your students' comprehension before the exam, not after
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon="bar-chart"
              title="Comprehension Reports"
              description="Generate detailed reports based on student note-taking patterns. Identify common misconceptions and knowledge gaps."
              highlight
            />
            <FeatureCard 
              icon="calendar"
              title="Per-Lecture Analytics"
              description="Track student understanding for each individual lecture. Know exactly which topics need more explanation."
            />
            <FeatureCard 
              icon="users"
              title="Class-Wide Insights"
              description="See aggregated data across all students. Understand overall class comprehension and adjust teaching accordingly."
            />
          </div>
        </div>

        {/* How it Works Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-4">
            How It Works
          </h2>
          <p className="text-text-secondary text-center max-w-2xl mx-auto mb-12">
            Simple workflow for both students and teachers
          </p>
          
          {/* Student Flow */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-text-primary text-center mb-8">
              <span className="text-accent-blue">Students</span>
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              <StepCard 
                number={1}
                title="Take Notes"
                description="Write notes during lectures in the editor"
              />
              <StepCard 
                number={2}
                title="AI Correction"
                description="Click to auto-correct based on course material"
              />
              <StepCard 
                number={3}
                title="Get Feedback"
                description="Receive personalized insights on your understanding"
              />
              <StepCard 
                number={4}
                title="Improve"
                description="Learn from feedback and ace your exams"
              />
            </div>
          </div>

          {/* Teacher Flow */}
          <div>
            <h3 className="text-xl font-bold text-text-primary text-center mb-8">
              <span className="text-accent-blue">Teachers</span>
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              <StepCard 
                number={1}
                title="Upload Material"
                description="Add course content for AI reference"
              />
              <StepCard 
                number={2}
                title="Students Take Notes"
                description="Students write notes during your lectures"
              />
              <StepCard 
                number={3}
                title="View Reports"
                description="Access comprehension analytics per lecture"
              />
              <StepCard 
                number={4}
                title="Adapt Teaching"
                description="Adjust based on student understanding"
              />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 note-card p-12 rounded-2xl text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-text-secondary mb-8 max-w-xl mx-auto">
            Join thousands of students and teachers using ShareMyNotes to improve academic outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg">
                <Icon name="zap" size={20} className="mr-2" />
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border mt-16">
        <div className="max-w-6xl mx-auto text-center text-text-tertiary">
          <p>© 2026 {appName}. Built with ❤️ at Supernova Hackathon.</p>
        </div>
      </footer>
    </div>
  )
}

function StatCard({ value, label }: { value: string, label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-accent-blue">{value}</div>
      <div className="text-sm text-text-secondary">{label}</div>
    </div>
  )
}

function FeatureCard({ icon, title, description, highlight = false }: { icon: IconName, title: string, description: string, highlight?: boolean }) {
  return (
    <div className={`note-card p-6 rounded-xl transition-all duration-200 ${highlight ? 'ring-2 ring-accent-blue/30' : ''}`}>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${highlight ? 'bg-accent-blue/10' : 'bg-background-muted'}`}>
        <Icon name={icon} size={24} className={highlight ? 'text-accent-blue' : 'text-text-primary'} />
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }: { number: number, title: string, description: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 bg-accent-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
        {number}
      </div>
      <h3 className="font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  )
}
