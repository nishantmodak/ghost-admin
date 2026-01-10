'use client'

import * as React from 'react'
import { Search, ArrowRight, Link2, FileText, ExternalLink, X } from 'lucide-react'
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

type Step = 'find' | 'replace'

export function LinkScanner() {
  const [step, setStep] = React.useState<Step>('find')
  const [pattern, setPattern] = React.useState('')
  const [replacement, setReplacement] = React.useState('')
  const [preservePath, setPreservePath] = React.useState(true)
  const [isScanning, setIsScanning] = React.useState(false)
  const [scanResult, setScanResult] = React.useState<ScanResult | null>(null)
  const [selectedPosts, setSelectedPosts] = React.useState<Set<string>>(new Set())
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [previewData, setPreviewData] = React.useState<PostWithLinks[]>([])
  const { addToast } = useToast()

  const handleScan = async () => {
    if (!pattern.trim()) {
      addToast('error', 'Please enter a search pattern')
      return
    }

    setIsScanning(true)
    setScanResult(null)
    setSelectedPosts(new Set())
    setStep('find')

    try {
      const res = await fetch('/api/ghost/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: pattern.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        addToast('error', data.error || 'Scan failed')
        return
      }

      setScanResult(data)

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

  const handleProceedToReplace = () => {
    if (selectedPosts.size === 0) {
      addToast('error', 'Please select at least one post')
      return
    }
    setStep('replace')
  }

  const handlePreview = async () => {
    if (!replacement.trim()) {
      addToast('error', 'Please enter a replacement pattern')
      return
    }

    // Compute preview data with replacements
    try {
      const res = await fetch('/api/ghost/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: pattern.trim(),
          replacement: replacement.trim(),
          preservePath,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        addToast('error', data.error || 'Preview failed')
        return
      }

      // Filter to only selected posts
      const selectedData = data.posts.filter((p: PostWithLinks) =>
        selectedPosts.has(p.id)
      )
      setPreviewData(selectedData)
      setIsPreviewOpen(true)
    } catch (error) {
      addToast('error', 'Failed to generate preview')
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

      // Reset everything
      setScanResult(null)
      setSelectedPosts(new Set())
      setIsPreviewOpen(false)
      setStep('find')
      setReplacement('')
    } catch (error) {
      addToast('error', 'Failed to update posts')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReset = () => {
    setScanResult(null)
    setSelectedPosts(new Set())
    setStep('find')
    setReplacement('')
    setPattern('')
  }

  const totalSelectedLinks = scanResult?.posts
    .filter((p) => selectedPosts.has(p.id))
    .reduce((sum, p) => sum + p.links.length, 0) || 0

  return (
    <>
      <div className="space-y-6">
        {/* Step 1: Find */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-ghost-green text-ghost-bg text-sm font-bold">
                1
              </div>
              <h3 className="font-semibold text-ghost-text">Find Links</h3>
            </div>
            {scanResult && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
          </div>

          <div
            className="p-5 rounded-xl border border-ghost-border bg-ghost-surface"
            onKeyDown={handleKeyDown}
          >
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Enter domain or URL pattern (e.g., docs.last9.io)"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  disabled={!!scanResult}
                />
              </div>
              <Button
                onClick={handleScan}
                loading={isScanning}
                disabled={!!scanResult}
              >
                <Search className="h-4 w-4 mr-2" />
                {isScanning ? 'Scanning...' : 'Find'}
              </Button>
            </div>
            <p className="text-xs text-ghost-text-muted mt-2">
              Search for links containing this pattern across all your Ghost posts
            </p>
          </div>
        </div>

        {/* Results */}
        {scanResult && scanResult.posts.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="default">
                  {scanResult.matchingPosts} posts found
                </Badge>
                <Badge variant="secondary">
                  {scanResult.totalLinks} total links
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={toggleAll}>
                  {selectedPosts.size === scanResult.posts.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </div>
            </div>

            {/* Posts List */}
            <div className="border border-ghost-border rounded-xl overflow-hidden divide-y divide-ghost-border bg-ghost-surface max-h-[400px] overflow-y-auto">
              {scanResult.posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => togglePost(post.id)}
                  className={`flex items-start gap-4 p-4 transition-colors cursor-pointer ${
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
                      <Badge variant="outline">
                        {post.links.length} {post.links.length === 1 ? 'link' : 'links'}
                      </Badge>
                    </div>
                    <div className="space-y-1 mt-2">
                      {post.links.slice(0, 2).map((link, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs text-ghost-text-muted font-mono"
                        >
                          <Link2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{link.original}</span>
                        </div>
                      ))}
                      {post.links.length > 2 && (
                        <p className="text-xs text-ghost-text-muted pl-5">
                          +{post.links.length - 2} more
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(post.url, '_blank')
                    }}
                    title="View post"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Selection Summary & Next Step */}
            {selectedPosts.size > 0 && step === 'find' && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-ghost-green-muted/20 border border-ghost-green/30">
                <div className="text-sm">
                  <span className="font-semibold text-ghost-green">
                    {selectedPosts.size}
                  </span>{' '}
                  <span className="text-ghost-text-secondary">
                    posts selected ({totalSelectedLinks} links)
                  </span>
                </div>
                <Button onClick={handleProceedToReplace}>
                  Continue to Replace
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {scanResult && scanResult.posts.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <Search className="h-12 w-12 text-ghost-text-muted mx-auto mb-3" />
            <p className="text-ghost-text-secondary">
              No posts found with links matching &quot;{pattern}&quot;
            </p>
            <Button variant="secondary" className="mt-4" onClick={handleReset}>
              Try Another Search
            </Button>
          </div>
        )}

        {/* Step 2: Replace */}
        {step === 'replace' && selectedPosts.size > 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-ghost-green text-ghost-bg text-sm font-bold">
                2
              </div>
              <h3 className="font-semibold text-ghost-text">Replace With</h3>
            </div>

            <div className="p-5 rounded-xl border border-ghost-border bg-ghost-surface space-y-4">
              <div>
                <Input
                  label="Replacement pattern"
                  placeholder="newdocs.last9.io"
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  hint="The new domain or URL prefix"
                />
              </div>

              <Checkbox
                label="Preserve path structure"
                checked={preservePath}
                onChange={(e) => setPreservePath(e.target.checked)}
              />

              {/* Preview */}
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

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setStep('find')}
                >
                  Back to Selection
                </Button>
                <Button
                  onClick={handlePreview}
                  disabled={!replacement.trim()}
                >
                  Preview {selectedPosts.size} Posts
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <PreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        posts={previewData}
        pattern={pattern}
        replacement={replacement}
        onConfirm={handleUpdate}
        isUpdating={isUpdating}
      />
    </>
  )
}
