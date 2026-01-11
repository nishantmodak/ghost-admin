'use client'

import * as React from 'react'
import {
  Search,
  ImageIcon,
  FileText,
  ExternalLink,
  X,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'

interface ImageMatch {
  src: string
  alt: string | null
  context: string
  fullTag: string
}

interface PostWithImages {
  id: string
  title: string
  slug: string
  url: string
  status: string
  images: ImageMatch[]
}

interface ScanResult {
  totalPosts: number
  postsWithIssues: number
  totalImages: number
  totalMissing: number
  posts: PostWithImages[]
}

interface AltUpdate {
  postId: string
  src: string
  newAlt: string
}

export function ImageAltAuditor() {
  const [isScanning, setIsScanning] = React.useState(false)
  const [scanResult, setScanResult] = React.useState<ScanResult | null>(null)
  const [selectedPosts, setSelectedPosts] = React.useState<Set<string>>(new Set())
  const [expandedPosts, setExpandedPosts] = React.useState<Set<string>>(new Set())
  const [altValues, setAltValues] = React.useState<Map<string, string>>(new Map())
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const { addToast } = useToast()

  const handleScan = async () => {
    setIsScanning(true)
    setScanResult(null)
    setSelectedPosts(new Set())
    setExpandedPosts(new Set())
    setAltValues(new Map())

    try {
      const res = await fetch('/api/ghost/images')
      const data = await res.json()

      if (!res.ok) {
        addToast('error', data.error || 'Scan failed')
        return
      }

      setScanResult(data)

      if (data.postsWithIssues === 0) {
        addToast('success', 'All images have alt text!')
      } else {
        addToast(
          'info',
          `Found ${data.totalMissing} images without alt text in ${data.postsWithIssues} posts`
        )
      }
    } catch (error) {
      addToast('error', 'Failed to scan posts')
    } finally {
      setIsScanning(false)
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

  const toggleExpanded = (postId: string) => {
    const newExpanded = new Set(expandedPosts)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    setExpandedPosts(newExpanded)
  }

  const toggleAll = () => {
    if (!scanResult) return

    if (selectedPosts.size === scanResult.posts.length) {
      setSelectedPosts(new Set())
    } else {
      setSelectedPosts(new Set(scanResult.posts.map((p) => p.id)))
    }
  }

  const expandAll = () => {
    if (!scanResult) return
    setExpandedPosts(new Set(scanResult.posts.map((p) => p.id)))
  }

  const setAltValue = (postId: string, src: string, value: string) => {
    const key = `${postId}:${src}`
    const newAltValues = new Map(altValues)
    if (value.trim()) {
      newAltValues.set(key, value)
    } else {
      newAltValues.delete(key)
    }
    setAltValues(newAltValues)
  }

  const getAltValue = (postId: string, src: string): string => {
    return altValues.get(`${postId}:${src}`) || ''
  }

  const getUpdatesForPreview = (): AltUpdate[] => {
    const updates: AltUpdate[] = []
    altValues.forEach((newAlt, key) => {
      const [postId, src] = key.split(':')
      if (selectedPosts.has(postId) && newAlt.trim()) {
        updates.push({ postId, src, newAlt })
      }
    })
    return updates
  }

  const handlePreview = () => {
    const updates = getUpdatesForPreview()
    if (updates.length === 0) {
      addToast('error', 'Please enter alt text for at least one image')
      return
    }
    setIsPreviewOpen(true)
  }

  const handleUpdate = async () => {
    const updates = getUpdatesForPreview()
    if (updates.length === 0) {
      addToast('error', 'No updates to apply')
      return
    }

    setIsUpdating(true)

    try {
      const res = await fetch('/api/ghost/images/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })

      const data = await res.json()

      if (!res.ok) {
        addToast('error', data.error || 'Update failed')
        return
      }

      addToast(
        'success',
        `Updated ${data.totalImagesUpdated} images across ${data.postsUpdated} posts`
      )

      // Reset and rescan
      setIsPreviewOpen(false)
      handleScan()
    } catch (error) {
      addToast('error', 'Failed to update posts')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReset = () => {
    setScanResult(null)
    setSelectedPosts(new Set())
    setExpandedPosts(new Set())
    setAltValues(new Map())
  }

  const totalSelectedImages =
    scanResult?.posts
      .filter((p) => selectedPosts.has(p.id))
      .reduce((sum, p) => sum + p.images.length, 0) || 0

  const updatesCount = getUpdatesForPreview().length

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ghost-text">Image Alt Auditor</h2>
            <p className="text-sm text-ghost-text-muted mt-1">
              Find and fix images missing alt text for better accessibility and SEO
            </p>
          </div>
          {scanResult && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <X className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Scan Button */}
        {!scanResult && (
          <div className="p-6 rounded-xl border border-ghost-border bg-ghost-surface text-center">
            <ImageIcon className="h-12 w-12 text-ghost-text-muted mx-auto mb-4" />
            <h3 className="font-medium text-ghost-text mb-2">
              Scan for Missing Alt Text
            </h3>
            <p className="text-sm text-ghost-text-muted mb-4 max-w-md mx-auto">
              Scan all your Ghost posts to find images without alt text. Alt text improves
              accessibility and helps with SEO.
            </p>
            <Button onClick={handleScan} loading={isScanning}>
              <Search className="h-4 w-4 mr-2" />
              {isScanning ? 'Scanning...' : 'Start Scan'}
            </Button>
          </div>
        )}

        {/* Results */}
        {scanResult && scanResult.posts.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            {/* Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="warning">
                  {scanResult.postsWithIssues} posts with issues
                </Badge>
                <Badge variant="secondary">
                  {scanResult.totalMissing} images missing alt
                </Badge>
                <Badge variant="outline">
                  {scanResult.totalImages} total images
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={expandAll}>
                  Expand All
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleAll}>
                  {selectedPosts.size === scanResult.posts.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </div>
            </div>

            {/* Posts List */}
            <div className="border border-ghost-border rounded-xl overflow-hidden bg-ghost-surface">
              {scanResult.posts.map((post) => (
                <div
                  key={post.id}
                  className="border-b border-ghost-border last:border-b-0"
                >
                  {/* Post Header */}
                  <div
                    className={`flex items-center gap-3 p-4 transition-colors cursor-pointer ${
                      selectedPosts.has(post.id)
                        ? 'bg-ghost-green-muted/20'
                        : 'hover:bg-ghost-surface-hover'
                    }`}
                    onClick={() => togglePost(post.id)}
                  >
                    <Checkbox
                      checked={selectedPosts.has(post.id)}
                      onChange={() => togglePost(post.id)}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpanded(post.id)
                      }}
                      className="p-1 hover:bg-ghost-surface-hover rounded transition-colors"
                    >
                      {expandedPosts.has(post.id) ? (
                        <ChevronDown className="h-4 w-4 text-ghost-text-muted" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-ghost-text-muted" />
                      )}
                    </button>
                    <FileText className="h-4 w-4 text-ghost-text-muted flex-shrink-0" />
                    <span className="font-medium text-ghost-text truncate flex-1">
                      {post.title}
                    </span>
                    <Badge
                      variant={post.status === 'published' ? 'default' : 'secondary'}
                    >
                      {post.status}
                    </Badge>
                    <Badge variant="warning">
                      {post.images.length} {post.images.length === 1 ? 'image' : 'images'}
                    </Badge>
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

                  {/* Expanded Image List */}
                  {expandedPosts.has(post.id) && (
                    <div className="px-4 pb-4 pt-2 bg-ghost-bg/50 space-y-3">
                      {post.images.map((image, idx) => (
                        <div
                          key={idx}
                          className="flex gap-4 p-3 rounded-lg border border-ghost-border bg-ghost-surface"
                        >
                          {/* Thumbnail */}
                          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-ghost-surface-hover border border-ghost-border">
                            <img
                              src={image.src}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                target.parentElement!.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center">
                                    <svg class="w-8 h-8 text-ghost-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                `
                              }}
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              {image.alt === null ? (
                                <Badge variant="destructive" className="text-xs">
                                  Missing alt
                                </Badge>
                              ) : (
                                <Badge variant="warning" className="text-xs">
                                  Empty alt
                                </Badge>
                              )}
                              <span className="text-xs text-ghost-text-muted font-mono truncate">
                                {image.src.split('/').pop()}
                              </span>
                            </div>

                            {image.context && (
                              <p className="text-xs text-ghost-text-muted line-clamp-2">
                                Context: {image.context}
                              </p>
                            )}

                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Enter alt text..."
                                value={getAltValue(post.id, image.src)}
                                onChange={(e) =>
                                  setAltValue(post.id, image.src, e.target.value)
                                }
                                className="flex-1"
                              />
                              {getAltValue(post.id, image.src) && (
                                <Check className="h-4 w-4 text-ghost-green flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Bar */}
            {selectedPosts.size > 0 && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-ghost-green-muted/20 border border-ghost-green/30">
                <div className="text-sm">
                  <span className="font-semibold text-ghost-green">
                    {selectedPosts.size}
                  </span>{' '}
                  <span className="text-ghost-text-secondary">
                    posts selected ({totalSelectedImages} images)
                  </span>
                  {updatesCount > 0 && (
                    <span className="text-ghost-text-secondary">
                      {' '}
                      &middot;{' '}
                      <span className="font-semibold text-ghost-green">
                        {updatesCount}
                      </span>{' '}
                      alt texts entered
                    </span>
                  )}
                </div>
                <Button onClick={handlePreview} disabled={updatesCount === 0}>
                  Preview & Apply Changes
                </Button>
              </div>
            )}
          </div>
        )}

        {/* All Good State */}
        {scanResult && scanResult.posts.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-ghost-green-muted flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-ghost-green" />
            </div>
            <h3 className="font-medium text-ghost-text mb-2">All Images Have Alt Text!</h3>
            <p className="text-sm text-ghost-text-muted mb-4">
              Great job! All {scanResult.totalImages} images across {scanResult.totalPosts}{' '}
              posts have alt text.
            </p>
            <Button variant="secondary" onClick={handleScan}>
              Scan Again
            </Button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <PreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        updates={getUpdatesForPreview()}
        posts={scanResult?.posts || []}
        onConfirm={handleUpdate}
        isUpdating={isUpdating}
      />
    </>
  )
}

// Preview Modal Component
interface PreviewModalProps {
  open: boolean
  onClose: () => void
  updates: AltUpdate[]
  posts: PostWithImages[]
  onConfirm: () => void
  isUpdating: boolean
}

function PreviewModal({
  open,
  onClose,
  updates,
  posts,
  onConfirm,
  isUpdating,
}: PreviewModalProps) {
  // Group updates by post
  const updatesByPost = new Map<string, AltUpdate[]>()
  updates.forEach((update) => {
    if (!updatesByPost.has(update.postId)) {
      updatesByPost.set(update.postId, [])
    }
    updatesByPost.get(update.postId)!.push(update)
  })

  const postsToShow = posts.filter((p) => updatesByPost.has(p.id))

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent onClose={onClose} className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Preview Alt Text Changes</DialogTitle>
          <DialogDescription>
            Review the alt text additions before applying them to your Ghost posts.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {/* Summary */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-ghost-bg border border-ghost-border mb-4">
            <div className="flex-1">
              <p className="text-sm text-ghost-text-secondary">
                Adding alt text to{' '}
                <span className="font-medium text-ghost-text">{updates.length}</span> images
                across{' '}
                <span className="font-medium text-ghost-text">{postsToShow.length}</span>{' '}
                posts
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-500 mb-1">
                This action will modify your Ghost posts
              </p>
              <p className="text-ghost-text-secondary">
                Alt text will be added to the image tags in your post HTML. Make sure you
                have a backup or can revert changes if needed.
              </p>
            </div>
          </div>

          {/* Posts with Changes */}
          <div className="space-y-4">
            {postsToShow.map((post) => {
              const postUpdates = updatesByPost.get(post.id) || []
              return (
                <div
                  key={post.id}
                  className="border border-ghost-border rounded-lg overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 py-3 bg-ghost-surface-hover border-b border-ghost-border">
                    <FileText className="h-4 w-4 text-ghost-text-muted" />
                    <span className="font-medium text-ghost-text flex-1 truncate">
                      {post.title}
                    </span>
                    <Badge
                      variant={post.status === 'published' ? 'default' : 'secondary'}
                    >
                      {post.status}
                    </Badge>
                    <Badge variant="outline">{postUpdates.length} images</Badge>
                  </div>
                  <div className="p-4 space-y-3 bg-ghost-bg/50">
                    {postUpdates.map((update, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <ImageIcon className="h-4 w-4 text-ghost-text-muted mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-ghost-text-muted font-mono truncate mb-1">
                            {update.src.split('/').pop()}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-ghost-green select-none">+</span>
                            <span className="text-ghost-green text-sm">
                              alt=&quot;{update.newAlt}&quot;
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={onConfirm} loading={isUpdating}>
            {isUpdating ? 'Applying Changes...' : `Apply ${updates.length} Changes`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
