'use client'

import * as React from 'react'
import { Search, FileText, ExternalLink, Calendar, Eye, EyeOff, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'

interface Post {
  id: string
  title: string
  slug: string
  url: string
  status: 'published' | 'draft' | 'scheduled'
  published_at: string | null
  updated_at: string
}

type StatusFilter = 'all' | 'published' | 'draft'

export function PostsView() {
  const [posts, setPosts] = React.useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = React.useState<Post[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')
  const { addToast } = useToast()

  const fetchPosts = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/ghost/posts')
      const data = await res.json()

      if (!res.ok) {
        addToast('error', data.error || 'Failed to fetch posts')
        return
      }

      setPosts(data.posts || [])
    } catch (error) {
      addToast('error', 'Failed to fetch posts')
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  React.useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  React.useEffect(() => {
    let filtered = posts

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query)
      )
    }

    setFilteredPosts(filtered)
  }, [posts, searchQuery, statusFilter])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not published'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const publishedCount = posts.filter((p) => p.status === 'published').length
  const draftCount = posts.filter((p) => p.status === 'draft').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-ghost-text-secondary">
            Browse and manage all posts from your Ghost site
          </p>
        </div>
        <Button variant="secondary" onClick={fetchPosts} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats */}
      {!isLoading && posts.length > 0 && (
        <div className="flex items-center gap-3">
          <Badge variant="default">{posts.length} total</Badge>
          <Badge variant="secondary">{publishedCount} published</Badge>
          <Badge variant="outline">{draftCount} drafts</Badge>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ghost-text-muted" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-ghost-surface border border-ghost-border">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              statusFilter === 'all'
                ? 'bg-ghost-green-muted text-ghost-green'
                : 'text-ghost-text-secondary hover:text-ghost-text'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
              statusFilter === 'published'
                ? 'bg-ghost-green-muted text-ghost-green'
                : 'text-ghost-text-secondary hover:text-ghost-text'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Published
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
              statusFilter === 'draft'
                ? 'bg-ghost-green-muted text-ghost-green'
                : 'text-ghost-text-secondary hover:text-ghost-text'
            }`}
          >
            <EyeOff className="h-3.5 w-3.5" />
            Drafts
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-ghost-border bg-ghost-surface animate-pulse"
            >
              <div className="h-5 w-2/3 bg-ghost-surface-hover rounded mb-2" />
              <div className="h-4 w-1/3 bg-ghost-surface-hover rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State - No Connection */}
      {!isLoading && posts.length === 0 && (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-ghost-text-muted mx-auto mb-3" />
          <p className="text-ghost-text-secondary mb-2">No posts found</p>
          <p className="text-sm text-ghost-text-muted">
            Make sure you have a Ghost connection configured in Settings
          </p>
        </div>
      )}

      {/* Empty State - No Results */}
      {!isLoading && posts.length > 0 && filteredPosts.length === 0 && (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-ghost-text-muted mx-auto mb-3" />
          <p className="text-ghost-text-secondary">
            No posts match your search
          </p>
        </div>
      )}

      {/* Posts List */}
      {!isLoading && filteredPosts.length > 0 && (
        <div className="border border-ghost-border rounded-xl overflow-hidden divide-y divide-ghost-border bg-ghost-surface">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 p-4 hover:bg-ghost-surface-hover transition-colors"
            >
              <FileText className="h-5 w-5 text-ghost-text-muted flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-ghost-text truncate">
                    {post.title || 'Untitled'}
                  </span>
                  <Badge
                    variant={post.status === 'published' ? 'default' : 'secondary'}
                  >
                    {post.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-ghost-text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(post.published_at || post.updated_at)}
                  </span>
                  <span className="truncate">/{post.slug}/</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(post.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination hint */}
      {!isLoading && filteredPosts.length > 0 && (
        <p className="text-xs text-ghost-text-muted text-center">
          Showing {filteredPosts.length} of {posts.length} posts
        </p>
      )}
    </div>
  )
}
