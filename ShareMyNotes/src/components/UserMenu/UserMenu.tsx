'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Icon } from '@/components/Icon/Icon'

interface UserMenuProps {
  userEmail?: string
  userName?: string
}

export function UserMenu({ userEmail, userName }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Get user info on mount
  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser({
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0]
        })
      }
    }
    getUser()
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const displayName = userName || user?.name || 'User'
  const displayEmail = userEmail || user?.email || ''
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-full hover:bg-background-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue to-accent-sage flex items-center justify-center text-white font-semibold text-sm shadow-md">
          {initials}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-background rounded-xl border border-border shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-border-light">
            <p className="font-semibold text-text-primary truncate">{displayName}</p>
            <p className="text-sm text-text-tertiary truncate">{displayEmail}</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <MenuItem href="/upload?tab=my-notes" icon="folder" label="Saved Notes" onClick={() => setIsOpen(false)} />
            <MenuItem href="/upload" icon="upload" label="Upload New" onClick={() => setIsOpen(false)} />
            <MenuDivider />
            <MenuItem href="/settings" icon="settings" label="Settings" onClick={() => setIsOpen(false)} />
          </div>

          {/* Sign Out */}
          <div className="pt-1 border-t border-border-light">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-error hover:bg-error/10 transition-colors duration-150"
            >
              <Icon name="logout" size={18} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({ 
  href, 
  icon, 
  label, 
  onClick 
}: { 
  href: string
  icon: 'file-text' | 'upload' | 'settings' | 'user' | 'home' | 'folder'
  label: string
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:text-text-primary hover:bg-background-muted/50 transition-colors duration-150"
    >
      <Icon name={icon} size={18} />
      <span className="font-medium">{label}</span>
    </Link>
  )
}

function MenuDivider() {
  return <div className="my-1 border-t border-border-light" />
}
