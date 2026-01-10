'use client'

import * as React from 'react'
import { Plus, Trash2, CheckCircle, Database, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'

interface Connection {
  id: number
  name: string
  url: string
  admin_key: string
  is_active: boolean
}

interface ConnectionManagerProps {
  onConnectionChange?: () => void
}

export function ConnectionManager({ onConnectionChange }: ConnectionManagerProps) {
  const [connections, setConnections] = React.useState<Connection[]>([])
  const [activeId, setActiveId] = React.useState<number | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const { addToast } = useToast()

  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    url: '',
    adminKey: '',
  })
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})

  const fetchConnections = React.useCallback(async () => {
    try {
      const res = await fetch('/api/connections')
      const data = await res.json()
      setConnections(data.connections || [])
      setActiveId(data.activeId)
    } catch (error) {
      console.error('Failed to fetch connections:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!formData.url.trim()) {
      errors.url = 'URL is required'
    } else if (!formData.url.startsWith('http')) {
      errors.url = 'URL must start with http:// or https://'
    }

    if (!formData.adminKey.trim()) {
      errors.adminKey = 'Admin API Key is required'
    } else if (!formData.adminKey.includes(':')) {
      errors.adminKey = 'Invalid API key format (should contain ":")'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSaving(true)

    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        addToast('error', data.error || 'Failed to add connection')
        return
      }

      addToast('success', 'Connection added successfully')
      setIsDialogOpen(false)
      setFormData({ name: '', url: '', adminKey: '' })
      await fetchConnections()
      onConnectionChange?.()
    } catch (error) {
      addToast('error', 'Failed to add connection')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetActive = async (id: number) => {
    try {
      const res = await fetch(`/api/connections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setActive: true }),
      })

      if (res.ok) {
        await fetchConnections()
        onConnectionChange?.()
        addToast('success', 'Connection activated')
      }
    } catch (error) {
      addToast('error', 'Failed to activate connection')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this connection?')) return

    try {
      const res = await fetch(`/api/connections/${id}`, { method: 'DELETE' })

      if (res.ok) {
        await fetchConnections()
        onConnectionChange?.()
        addToast('success', 'Connection deleted')
      }
    } catch (error) {
      addToast('error', 'Failed to delete connection')
    }
  }

  const activeConnection = connections.find((c) => c.id === activeId)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-ghost-green-muted">
              <Database className="h-5 w-5 text-ghost-green" />
            </div>
            <div>
              <CardTitle>Ghost Connection</CardTitle>
              {activeConnection && (
                <p className="text-sm text-ghost-text-secondary mt-0.5">
                  Connected to {activeConnection.name}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-ghost-green border-t-transparent rounded-full" />
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-ghost-text-muted mx-auto mb-3" />
              <p className="text-ghost-text-secondary mb-4">
                No Ghost connections configured
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add Connection
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    conn.id === activeId
                      ? 'border-ghost-green bg-ghost-green-muted/30'
                      : 'border-ghost-border hover:border-ghost-border-light'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {conn.id === activeId && (
                      <CheckCircle className="h-5 w-5 text-ghost-green flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ghost-text truncate">
                          {conn.name}
                        </span>
                        {conn.id === activeId && (
                          <Badge variant="default" className="flex-shrink-0">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-ghost-text-muted truncate">
                        {conn.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(conn.url + '/ghost', '_blank')}
                      title="Open Ghost Admin"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {conn.id !== activeId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetActive(conn.id)}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-ghost-text-muted hover:text-ghost-error"
                      onClick={() => handleDelete(conn.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Connection Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogContent onClose={() => setIsDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add Ghost Connection</DialogTitle>
            <DialogDescription>
              Connect to your Ghost site using the Admin API. You can find your
              API key in Ghost Admin → Settings → Integrations.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-4">
              <Input
                label="Connection Name"
                placeholder="My Blog"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                error={formErrors.name}
              />
              <Input
                label="Ghost URL"
                placeholder="https://your-blog.ghost.io"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                error={formErrors.url}
                hint="The URL of your Ghost site (without /ghost)"
              />
              <Input
                label="Admin API Key"
                placeholder="xxxxxxxxxxxx:yyyyyyyyyyyyyyyyyyyyyyyy"
                type="password"
                value={formData.adminKey}
                onChange={(e) =>
                  setFormData({ ...formData, adminKey: e.target.value })
                }
                error={formErrors.adminKey}
                hint="Format: {id}:{secret} from your custom integration"
              />
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSaving}>
                {isSaving ? 'Connecting...' : 'Add Connection'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
