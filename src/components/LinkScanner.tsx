'use client'

import * as React from 'react'
import { Search, ArrowRight, Link2, FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { PreviewModal } from './PreviewModal'

interface LinkMatch {
  original: string
  replacement: string
  context: string
}

interface PostWithLinks {
  id: string
  title: string
  slug: string
  url: string
  status: string
  links: LinkMatch[]
  updatedHtml?: string
}

interface ScanResult {
  totalPosts: number
  matchingPosts: number
  totalLinks: number
  posts: PostWithLinks[]
}

export function LinkScanner() {
  const [pattern, setPattern] = React.useState('')
  const [replacement, setReplacement] = React.useState('')
  const [preservePath, setPreservePath] = React.useState(true)
  const [isScanning, setIsScanning] = React.useState(false)
  const [scanResult, setScanResult] = React.useState<ScanResult | null>(null)
  const [selectedPosts, setSelectedPosts] = React.useState<Set<string>>(new Set())
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const { addToast } = useToast()

  const handleScan = async () => {
    if (!pattern.trim()) {
      addToast('error', 'Please enter a search pattern')
      return
    }

    setIsScanning(true)
    setScanResult(null)
    setSelectedPosts(new Set())

    try {
      const res = await fetch('/api/ghost/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: pattern.trim(),
          replacement: replacement.trim() || undefined,
          preservePath,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        addToast('error', data.error || 'Scan failed')
        return
      }

      setScanResult(data)

      // Select all posts by default
      const allPostIds = new Set(data.posts.map((p: PostWithLinks) => p.id))
      setSelectedPosts(allPostIds)

      if (data.matchingPosts === 0) {
        addToast('info', 'No matching links found')
      } else {
        addToast('success', `Found ${data.totalLinks} links in ${data.matchingPosts} posts`)
      }
    } catch (error) {
      addToast('error', 'Failed to scan posts')
    } finally {
      setIsScanning(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleScan()
    }
  }

  const togglePost = (postId: string) => {
    const newSelected = new Set(selectedPosts)
    if (newSelected.has(postId)) {
      newSelected.delete(postId)
    } else {
      newSelected.add(postId)
    }
    setSelectedPosts(newSelected)
  }

  const toggleAll = () => {
    if (!scanResult) return

    if (selectedPosts.size === scanResult.posts.length) {
      setSelectedPosts(new Set())
    } else {
      setSelectedPosts(new Set(scanResult.posts.map((p) => p.id)))
    }
  }

  const handleUpdate = async () => {
    if (selectedPosts.size === 0) {
      addToast('error', 'Please select at least one post')
      return
    }

    setIsUpdating(true)

    try {
      const res = await fetch('/api/ghost/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: pattern.trim(),
          replacement: replacement.trim(),
          preservePath,
          postIds: Array.from(selectedPosts),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        addToast('error', data.error || 'Update failed')
        return
      }

      addToast(
        'success',
        `Updated ${data.postsUpdated} posts with ${data.totalLinksUpdated} link changes`
      )

      // Clear results after successful update
      setScanResult(null)
      setSelectedPosts(new Set())
      setIsPreviewOpen(false)
    } catch (error) {
      addToast('error', 'Failed to update posts')
    } finally {
      setIsUpdating(false)
    }
  }

  const selectedPostsData = scanResult?.posts.filter((p) =>
    selectedPosts.has(p.id)
  ) || []

  const totalSelectedLinks = selectedPostsData.reduce(
    (sum, p) => sum + p.links.length,
    0
  )

  return (
    <>
      <div className="space-y-6">
        {/* Description */}
        <p className="text-ghost-text-secondary">
          Find and replace links across all your Ghost posts. Enter a domain pattern to search for and optionally specify a replacement.
        </p>

        {/* Search Form */}
        <div
          className="p-6 rounded-xl border border-ghost-border bg-ghost-surface space-y-4"
          onKeyDown={handleKeyDown}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Find pattern"
              placeholder="docs.last9.io"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              hint="Domain or URL prefix to search for"
            />
            <Input
              label="Replace with"
              placeholder="newdocs.last9.io"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              hint="New domain or URL prefix"
            />
          </div>

          <div className="flex items-center justify-between">
            <Checkbox
              label="Preserve path structure"
              checked={preservePath}
              onChange={(e) => setPreservePath(e.target.checked)}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-ghost-text-muted hidden sm:inline">
                ⌘+Enter to scan
              </span>
              <Button onClick={handleScan} loading={isScanning}>
                <Search className="h-4 w-4 mr-2" />
                {isScanning ? 'Scanning...' : 'Scan Posts'}
              </Button>
            </div>
          </div>

          {/* Pattern Preview */}
          {pattern && replacement && (
            <div className="p-4 rounded-lg bg-ghost-bg border border-ghost-border">
              <p className="text-xs text-ghost-text-muted mb-2 uppercase tracking-wide">
                Preview
              </p>
              <div className="flex items-center gap-3 text-sm font-mono flex-wrap">
                <span className="text-ghost-error line-through opacity-70">
                  {pattern}/example/path
                </span>
                <ArrowRight className="h-4 w-4 text-ghost-text-muted flex-shrink-0" />
                <span className="text-ghost-green">
                  {replacement}
                  {preservePath ? '/example/path' : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {scanResult && scanResult.posts.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-ghost-text">Results</h3>
                <Badge variant="secondary">
                  {scanResult.matchingPosts} posts
                </Badge>
                <Badge variant="secondary">
                  {scanResult.totalLinks} links
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedPosts.size === scanResult.posts.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>

            {/* Posts List */}
            <div className="border border-ghost-border rounded-xl overflow-hidden divide-y divide-ghost-border bg-ghost-surface">
              {scanResult.posts.map((post) => (
                <div
                  key={post.id}
                  className={`flex items-start gap-4 p-4 transition-colors ${
                    selectedPosts.has(post.id)
                      ? 'bg-ghost-green-muted/20'
                      : 'hover:bg-ghost-surface-hover'
                  }`}
                >
                  <Checkbox
                    checked={selectedPosts.has(post.id)}
                    onChange={() => togglePost(post.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-ghost-text-muted flex-shrink-0" />
                      <span className="font-medium text-ghost-text truncate">
                        {post.title}
                      </span>
                      <Badge
                        variant={
                          post.status === 'published' ? 'default' : 'secondary'
                        }
                      >
                        {post.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {post.links.slice(0, 3).map((link, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Link2 className="h-3 w-3 text-ghost-text-muted flex-shrink-0" />
                          <span className="text-ghost-error line-through truncate text-xs">
                            {link.original}
                          </span>
                          {link.replacement && (
                            <>
                              <ArrowRight className="h-3 w-3 text-ghost-text-muted flex-shrink-0" />
                              <span className="text-ghost-green truncate text-xs">
                                {link.replacement}
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                      {post.links.length > 3 && (
                        <p className="text-xs text-ghost-text-muted pl-5">
                          +{post.links.length - 3} more links
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => window.open(post.url, '_blank')}
                    title="View post"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Action Bar */}
            {replacement && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-ghost-surface border border-ghost-border">
                <div className="text-sm text-ghost-text-secondary">
                  <span className="font-medium text-ghost-text">
                    {selectedPosts.size}
                  </span>{' '}
                  posts selected ({totalSelectedLinks} links)
                </div>
                <Button
                  onClick={() => setIsPreviewOpen(true)}
                  disabled={selectedPosts.size === 0}
                >
                  Preview Changes
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {scanResult && scanResult.posts.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <Search className="h-12 w-12 text-ghost-text-muted mx-auto mb-3" />
            <p className="text-ghost-text-secondary">
              No posts found with links matching &quot;{pattern}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <PreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        posts={selectedPostsData}
        pattern={pattern}
        replacement={replacement}
        onConfirm={handleUpdate}
        isUpdating={isUpdating}
      />
    </>
  )
}
