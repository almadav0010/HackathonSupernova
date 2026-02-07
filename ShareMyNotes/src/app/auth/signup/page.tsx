'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/Button/Button'
import { Icon } from '@/components/Icon/Icon'
import { useToast } from '@/components/Toast/ToastProvider'
import { appName } from '@/lib/constants'

export default function SignUpPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
        },
      })

      if (error) {
        showToast(error.message, 'error')
        return
      }

      showToast('Check your email to confirm your account!', 'success')
      router.push('/auth/signin')
    } catch {
      showToast('Error signing up', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      const supabase = createClient()
      const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectUrl}/auth/callback?redirect=/home`,
        },
      })

      if (error) {
        showToast(error.message, 'error')
      }
    } catch {
      showToast('Error signing up with Google', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-text-primary mb-6">
            <Icon name="book" size={32} />
            <h1 className="text-2xl font-bold">{appName}</h1>
          </Link>
          <h2 className="text-xl font-bold text-text-primary">Create Account</h2>
          <p className="text-text-secondary mt-2">Join the collaborative learning community</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-text-primary mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-text-primary hand-drawn-subtle bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-text-primary mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-text-primary hand-drawn-subtle bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-bold text-text-primary mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-text-primary hand-drawn-subtle bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Icon name="loader" size={20} className="animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <Icon name="user" size={20} />
                Sign Up
              </>
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-text-primary hand-drawn-subtle"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-background text-text-secondary font-bold">OR</span>
          </div>
        </div>

        <Button
          onClick={handleGoogleSignUp}
          variant="secondary"
          className="w-full flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>

        <div className="mt-6 text-center">
          <p className="text-text-secondary">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-text-primary font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-text-secondary hover:text-text-primary">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
