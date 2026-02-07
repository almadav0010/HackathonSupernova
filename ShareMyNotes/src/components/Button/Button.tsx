'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'subjects'
  size?: 'sm' | 'md' | 'lg' | 'subj'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'font-bold transition-all duration-150 hand-drawn-subtle inline-flex items-center justify-center'
    
    const variants = {
      primary: 'bg-text-primary text-background hover:bg-primary-dark',
      secondary: 'bg-background border-2 border-text-primary text-text-primary hover:bg-secondary-dark',
      ghost: 'bg-transparent text-text-primary hover:bg-background-muted',
      subjects: 'bg-transparent text-black hover:shadow-lg hover:bg-gray-200 rounded-lg border-2 border-text-primary',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
      subj: 'px-6 py-3 text-lg w-64 h-40',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
