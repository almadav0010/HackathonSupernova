'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/Icon/Icon'

export function Navbar() {
  const pathname = usePathname()
  
  // Determine active tab based on pathname
  const isActive = (path: string) => pathname?.includes(path)

  return (
    <nav className="sticky text-secondary top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-stretch h-14">
          {/* Back Button */}
          <Link 
            href="../" 
            className="flex items-center justify-center w-14 text-secondary hover:text-primary hover:bg-background-muted/50 transition-all duration-200 border-r border-border-light group"
          >
            <svg 
              className="w-5 h-5 transform group-hover:-translate-x-0.5 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Navigation Links */}
          <div className="flex flex-1">
            <NavLink href="./notes" icon="edit" label="Notes" isActive={isActive('/notes')} />
            <NavLink href="./report" icon="eye" label="Report" isActive={isActive('/report')} />
            <NavLink href="./course_docs" icon="book" label="Course Material" isActive={isActive('/course_docs')} />
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ 
  href, 
  icon, 
  label, 
  isActive 
}: { 
  href: string
  icon: 'edit' | 'eye' | 'book' | 'upload' | 'users' | 'message'
  label: string
  isActive: boolean
}) {
  return (
    <Link 
      href={href} 
      className={`
        flex-1 flex items-center justify-center gap-2 px-4 
        border-r border-border-light last:border-r-0
        transition-all duration-200 relative
        ${isActive 
          ? 'text-primary bg-background-subtle' 
          : 'text-secondary hover:text-primary hover:bg-background-muted/30'
        }
      `}
    >
      <Icon name={icon} size={20} className={isActive ? 'text-accent-blue' : ''} />
      <span className={`font-medium text-sm ${isActive ? 'text-primary' : ''}`}>
        {label}
      </span>
      
      {/* Active indicator */}
      {isActive && (
        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-accent-blue rounded-full" />
      )}
    </Link>
  )
}