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
  caption: string | null
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

interface ImageStats {
  hasAlt: number
  missingAlt: number
  noFeatureImage?: number
  noImages?: number
}

interface StatusCounts {
  published: number
  draft: number
  scheduled: number
}

interface ScanResult {
  totalPosts: number
  postsWithIssues: number
  totalImages: number
  totalMissing: number
  inlineImageStats: ImageStats
  featureImageStats: ImageStats
  statusCounts: StatusCounts
  posts: PostWithImages[]
}

type StatusFilter = 'all' | 'published' | 'draft'

interface AltUpdate {
  postId: string
  src: string
  newAlt: string
}

export function ImageAltAuditor() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isScanning, setIsScanning] = React.useState(false)
  const [scanResult, setScanResult] = React.useState<ScanResult | null>(null)
  const [selectedPosts, setSelectedPosts] = React.useState<Set<string>>(new Set())
  const [expandedPosts, setExpandedPosts] = React.useState<Set<string>>(new Set())
  const [altValues, setAltValues] = React.useState<Map<string, string>>(new Map())
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [updatingPostId, setUpdatingPostId] = React.useState<string | null>(null)
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const { addToast } = useToast()

  // Auto-load on mount
  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/ghost/images')
      const data = await res.json()

      if (!res.ok) {
        addToast('error', data.error || 'Failed to load data')
        return
      }

      setScanResult(data)
    } catch (error) {
      addToast('error', 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsScanning(true)
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
      addToast('success', 'Data refreshed')
    } catch (error) {
      addToast('error', 'Failed to refresh data')
    } finally {
      setIsScanning(false)
    }
  }

  // Filter posts by status and search query
  const filteredPosts = React.useMemo(() => {
    if (!scanResult) return []
    let posts = scanResult.posts

    // Filter by status
    if (statusFilter !== 'all') {
      posts = posts.filter((p) => p.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      posts = posts.filter((p) =>
        p.title.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query)
      )
    }

    return posts
  }, [scanResult, statusFilter, searchQuery])

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
    const key = `${postId}::${src}`
    const newAltValues = new Map(altValues)
    if (value.trim()) {
      newAltValues.set(key, value)
    } else {
      newAltValues.delete(key)
    }
    setAltValues(newAltValues)
  }

  const getAltValue = (postId: string, src: string): string => {
    return altValues.get(`${postId}::${src}`) || ''
  }

  const getUpdatesForPost = (postId: string): AltUpdate[] => {
    const updates: AltUpdate[] = []
    altValues.forEach((newAlt, key) => {
      const separatorIndex = key.indexOf('::')
      if (separatorIndex === -1) return
      const keyPostId = key.slice(0, separatorIndex)
      const src = key.slice(separatorIndex + 2)
      if (keyPostId === postId && newAlt.trim()) {
        updates.push({ postId: keyPostId, src, newAlt })
      }
    })
    return updates
  }

  const getUpdatesForPreview = (): AltUpdate[] => {
    const updates: AltUpdate[] = []
    altValues.forEach((newAlt, key) => {
      const separatorIndex = key.indexOf('::')
      if (separatorIndex === -1) return
      const postId = key.slice(0, separatorIndex)
      const src = key.slice(separatorIndex + 2)
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

  const applyPostUpdates = async (postId: string) => {
    const updates = getUpdatesForPost(postId)
    if (updates.length === 0) {
      addToast('error', 'Please enter alt text for at least one image')
      return
    }

    setUpdatingPostId(postId)

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

      addToast('success', `Updated ${data.totalImagesUpdated} images in post`)

      // Remove updated post from results and clear its alt values
      if (scanResult) {
        const newPosts = scanResult.posts.filter((p) => p.id !== postId)
        setScanResult({
          ...scanResult,
          posts: newPosts,
          postsWithIssues: newPosts.length,
          totalMissing: newPosts.reduce((sum, p) => sum + p.images.length, 0),
        })
      }

      // Clear alt values for this post
      const newAltValues = new Map(altValues)
      Array.from(newAltValues.keys()).forEach((key) => {
        if (key.startsWith(`${postId}::`)) {
          newAltValues.delete(key)
        }
      })
      setAltValues(newAltValues)

      // Remove from selected/expanded
      const newSelected = new Set(selectedPosts)
      newSelected.delete(postId)
      setSelectedPosts(newSelected)

      const newExpanded = new Set(expandedPosts)
      newExpanded.delete(postId)
      setExpandedPosts(newExpanded)
    } catch (error) {
      addToast('error', 'Failed to update post')
    } finally {
      setUpdatingPostId(null)
    }
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

      // Reset and refresh
      setIsPreviewOpen(false)
      handleRefresh()
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
          <Button variant="ghost" size="sm" onClick={handleRefresh} loading={isScanning}>
            <Search className="h-4 w-4 mr-1" />
            {isScanning ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 rounded-xl border border-ghost-border bg-ghost-surface text-center">
            <div className="animate-spin h-8 w-8 border-2 border-ghost-green border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-ghost-text-muted">Loading image data...</p>
          </div>
        )}

        {/* Stats Table */}
        {!isLoading && scanResult && (
          <div className="animate-fade-in">
            <ImageStatsTable
              featureStats={scanResult.featureImageStats}
              inlineStats={scanResult.inlineImageStats}
            />
          </div>
        )}

        {/* Posts with Issues */}
        {!isLoading && scanResult && scanResult.posts.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ghost-text-muted" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center rounded-lg border border-ghost-border bg-ghost-surface p-1">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-ghost-green text-white'
                      : 'text-ghost-text-muted hover:text-ghost-text'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('published')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    statusFilter === 'published'
                      ? 'bg-ghost-green text-white'
                      : 'text-ghost-text-muted hover:text-ghost-text'
                  }`}
                >
                  Published
                </button>
                <button
                  onClick={() => setStatusFilter('draft')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    statusFilter === 'draft'
                      ? 'bg-ghost-green text-white'
                      : 'text-ghost-text-muted hover:text-ghost-text'
                  }`}
                >
                  Drafts
                </button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-ghost-text-muted">
                  Showing {filteredPosts.length} of {scanResult.posts.length} posts with missing alt text
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={expandAll}>
                  Expand All
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleAll}>
                  {selectedPosts.size === filteredPosts.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </div>
            </div>

            {/* Posts List */}
            <div className="border border-ghost-border rounded-xl overflow-hidden bg-ghost-surface">
              {filteredPosts.length === 0 ? (
                <div className="p-8 text-center text-ghost-text-muted">
                  No posts match your filters
                </div>
              ) : filteredPosts.map((post) => (
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

                            {image.caption && (
                              <div className="flex items-center gap-2 p-2 rounded bg-ghost-bg border border-ghost-border">
                                <span className="text-xs text-ghost-text-muted">Caption:</span>
                                <span className="text-xs text-ghost-text flex-1 truncate">
                                  {image.caption}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs px-2"
                                  onClick={() => setAltValue(post.id, image.src, image.caption!)}
                                >
                                  Use as Alt
                                </Button>
                              </div>
                            )}

                            {!image.caption && image.context && (
                              <p className="text-xs text-ghost-text-muted line-clamp-2">
                                Context: {image.context}
                              </p>
                            )}

                            <div className="flex items-center gap-2">
                              <Input
                                placeholder={image.caption ? "Enter alt text or use caption above..." : "Enter alt text..."}
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

                      {/* Per-post Apply Button */}
                      {getUpdatesForPost(post.id).length > 0 && (
                        <div className="flex justify-end pt-2 border-t border-ghost-border">
                          <Button
                            size="sm"
                            onClick={() => applyPostUpdates(post.id)}
                            loading={updatingPostId === post.id}
                            disabled={updatingPostId !== null}
                          >
                            Apply {getUpdatesForPost(post.id).length} Changes to This Post
                          </Button>
                        </div>
                      )}
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
        {!isLoading && scanResult && scanResult.posts.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-ghost-green-muted flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-ghost-green" />
            </div>
            <h3 className="font-medium text-ghost-text mb-2">All Inline Images Have Alt Text!</h3>
            <p className="text-sm text-ghost-text-muted mb-4">
              Great job! All {scanResult.totalImages} inline images across {scanResult.totalPosts}{' '}
              posts have alt text.
            </p>
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

// Combined Image Stats Table Component
function ImageStatsTable({
  featureStats,
  inlineStats,
}: {
  featureStats: ImageStats
  inlineStats: ImageStats
}) {
  const featureTotal = featureStats.hasAlt + featureStats.missingAlt + (featureStats.noFeatureImage || 0)
  const inlineTotal = inlineStats.hasAlt + inlineStats.missingAlt

  const getPercent = (value: number, total: number) => {
    if (total === 0) return '0%'
    const pct = (value / total) * 100
    if (pct > 0 && pct < 1) return '<1%'
    return `${Math.round(pct)}%`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Feature Image Stats */}
      <div className="rounded-xl border border-ghost-border overflow-hidden bg-ghost-surface">
        <div className="px-4 py-3 bg-ghost-surface-hover border-b border-ghost-border">
          <h3 className="font-medium text-ghost-text text-sm">Feature Image Alt</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ghost-border bg-ghost-bg/50">
              <th className="px-4 py-2 text-left font-medium text-ghost-text-muted">Status</th>
              <th className="px-4 py-2 text-right font-medium text-ghost-text-muted w-16">Count</th>
              <th className="px-4 py-2 text-right font-medium text-ghost-text-muted w-14">%</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-ghost-border">
              <td className="px-4 py-2">
                <span className="inline-flex items-center gap-2">
                  <span className="text-ghost-green">✓</span>
                  <span className="text-ghost-text">Has alt text</span>
                </span>
              </td>
              <td className="px-4 py-2 text-right font-mono text-ghost-text">{featureStats.hasAlt}</td>
              <td className="px-4 py-2 text-right font-mono text-ghost-text-muted">{getPercent(featureStats.hasAlt, featureTotal)}</td>
            </tr>
            <tr className="border-b border-ghost-border">
              <td className="px-4 py-2">
                <span className="inline-flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  <span className="text-ghost-text">Missing alt text</span>
                </span>
              </td>
              <td className="px-4 py-2 text-right font-mono text-ghost-text">{featureStats.missingAlt}</td>
              <td className="px-4 py-2 text-right font-mono text-ghost-text-muted">{getPercent(featureStats.missingAlt, featureTotal)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2">
                <span className="inline-flex items-center gap-2">
                  <span className="text-ghost-text-muted">—</span>
                  <span className="text-ghost-text">No feature image</span>
                </span>
              </td>
              <td className="px-4 py-2 text-right font-mono text-ghost-text">{featureStats.noFeatureImage}</td>
              <td className="px-4 py-2 text-right font-mono text-ghost-text-muted">{getPercent(featureStats.noFeatureImage || 0, featureTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Inline Image Stats */}
      <div className="rounded-xl border border-ghost-border overflow-hidden bg-ghost-surface">
        <div className="px-4 py-3 bg-ghost-surface-hover border-b border-ghost-border">
          <h3 className="font-medium text-ghost-text text-sm">Inline Image Alt</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ghost-border bg-ghost-bg/50">
              <th className="px-4 py-2 text-left font-medium text-ghost-text-muted">Status</th>
              <th className="px-4 py-2 text-right font-medium text-ghost-text-muted w-16">Count</th>
              <th className="px-4 py-2 text-right font-medium text-ghost-text-muted w-14">%</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-ghost-border">
              <td className="px-4 py-2">
                <span className="inline-flex items-center gap-2">
                  <span className="text-ghost-green">✓</span>
                  <span className="text-ghost-text">Has alt text</span>
                </span>
              </td>
              <td className="px-4 py-2 text-right font-mono text-ghost-text">{inlineStats.hasAlt}</td>
              <td className="px-4 py-2 text-right font-mono text-ghost-text-muted">{getPercent(inlineStats.hasAlt, inlineTotal)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2">
                <span className="inline-flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  <span className="text-ghost-text">Missing alt text</span>
                </span>
              </td>
              <td className="px-4 py-2 text-right font-mono text-ghost-text">{inlineStats.missingAlt}</td>
              <td className="px-4 py-2 text-right font-mono text-ghost-text-muted">{getPercent(inlineStats.missingAlt, inlineTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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
