'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

const Dialog = ({ open, onClose, children }: DialogProps) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Content */}
      <div className="relative z-10 animate-slide-up">{children}</div>
    </div>
  )
}

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }
>(({ className, children, onClose, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-ghost-border bg-ghost-surface shadow-2xl',
      className
    )}
    {...props}
  >
    {onClose && (
      <button
        onClick={onClose}
        className="absolute right-4 top-4 p-1 rounded-lg text-ghost-text-muted hover:text-ghost-text hover:bg-ghost-surface-hover transition-colors z-10"
      >
        <X className="h-5 w-5" />
      </button>
    )}
    {children}
  </div>
))
DialogContent.displayName = 'DialogContent'

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('px-6 py-4 border-b border-ghost-border', className)}
    {...props}
  />
))
DialogHeader.displayName = 'DialogHeader'

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      'text-lg font-semibold text-ghost-text',
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-ghost-text-secondary mt-1', className)}
    {...props}
  />
))
DialogDescription.displayName = 'DialogDescription'

const DialogBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('px-6 py-4 overflow-y-auto max-h-[60vh]', className)}
    {...props}
  />
))
DialogBody.displayName = 'DialogBody'

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-end gap-3 px-6 py-4 border-t border-ghost-border bg-ghost-bg/50',
      className
    )}
    {...props}
  />
))
DialogFooter.displayName = 'DialogFooter'

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
}
