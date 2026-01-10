'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, checked, onChange, ...props }, ref) => {
    const checkboxId = id || React.useId()

    return (
      <label
        htmlFor={checkboxId}
        className="inline-flex items-center gap-2 cursor-pointer select-none"
      >
        <div className="relative">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            checked={checked}
            onChange={onChange}
            className="sr-only peer"
            {...props}
          />
          <div
            className={cn(
              'h-5 w-5 rounded border border-ghost-border bg-ghost-surface transition-all duration-200',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-ghost-green peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ghost-bg',
              'peer-checked:bg-ghost-green peer-checked:border-ghost-green',
              'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
              className
            )}
          >
            <Check
              className={cn(
                'h-4 w-4 text-ghost-bg absolute top-0.5 left-0.5 transition-opacity duration-200',
                checked ? 'opacity-100' : 'opacity-0'
              )}
              strokeWidth={3}
            />
          </div>
        </div>
        {label && (
          <span className="text-sm text-ghost-text">{label}</span>
        )}
      </label>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
