'use client'

import * as React from 'react'
import { FileText, ArrowRight, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface LinkMatch {
  original: string
  replacement: string
}

interface PostWithLinks {
  id: string
  title: string
  status: string
  links: LinkMatch[]
}

interface PreviewModalProps {
  open: boolean
  onClose: () => void
  posts: PostWithLinks[]
  pattern: string
  replacement: string
  onConfirm: () => void
  isUpdating: boolean
}

export function PreviewModal({
  open,
  onClose,
  posts,
  pattern,
  replacement,
  onConfirm,
  isUpdating,
}: PreviewModalProps) {
  const totalLinks = posts.reduce((sum, p) => sum + p.links.length, 0)

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent onClose={onClose} className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Preview Changes</DialogTitle>
          <DialogDescription>
            Review the link replacements before applying them to your Ghost posts.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {/* Summary */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-ghost-bg border border-ghost-border mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 text-sm font-mono mb-2">
                <span className="text-ghost-error">{pattern}</span>
                <ArrowRight className="h-4 w-4 text-ghost-text-muted" />
                <span className="text-ghost-green">{replacement}</span>
              </div>
              <p className="text-sm text-ghost-text-secondary">
                Updating <span className="font-medium text-ghost-text">{totalLinks}</span> links
                across <span className="font-medium text-ghost-text">{posts.length}</span> posts
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-500 mb-1">
                This action will modify your Ghost posts
              </p>
              <p className="text-ghost-text-secondary">
                Changes will be applied directly to your Ghost site. Make sure you have a backup
                or can revert changes if needed.
              </p>
            </div>
          </div>

          {/* Posts with Changes */}
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border border-ghost-border rounded-lg overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-3 bg-ghost-surface-hover border-b border-ghost-border">
                  <FileText className="h-4 w-4 text-ghost-text-muted" />
                  <span className="font-medium text-ghost-text flex-1 truncate">
                    {post.title}
                  </span>
                  <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                    {post.status}
                  </Badge>
                  <Badge variant="outline">{post.links.length} links</Badge>
                </div>
                <div className="p-4 space-y-2 bg-ghost-bg/50">
                  {post.links.map((link, i) => (
                    <div
                      key={i}
                      className="font-mono text-sm space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-ghost-error select-none">−</span>
                        <span className="text-ghost-error/80 break-all">
                          {link.original}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-ghost-green select-none">+</span>
                        <span className="text-ghost-green break-all">
                          {link.replacement}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={onConfirm} loading={isUpdating}>
            {isUpdating ? 'Applying Changes...' : `Apply ${totalLinks} Changes`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
