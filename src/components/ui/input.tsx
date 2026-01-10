'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, ...props }, ref) => {
    const inputId = id || React.useId()

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-ghost-text"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-lg border bg-ghost-surface px-3 py-2 text-sm text-ghost-text placeholder:text-ghost-text-muted transition-colors duration-200',
            'border-ghost-border focus:border-ghost-green focus:outline-none focus:ring-2 focus:ring-ghost-green/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-ghost-error focus:border-ghost-error focus:ring-ghost-error/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-ghost-text-muted">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-ghost-error">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
