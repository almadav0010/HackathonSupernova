import Link from 'next/link'
import { Button } from '@/components/Button/Button'
import { Icon } from '@/components/Icon/Icon'
import { appName } from '@/lib/constants'

export function Navbar() {
  return (
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
  )
}