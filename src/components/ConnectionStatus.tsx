'use client'

import * as React from 'react'
import { CheckCircle, AlertCircle, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Connection {
  id: number
  name: string
  url: string
  is_active: boolean
}

interface ConnectionStatusProps {
  onSettingsClick: () => void
}

export function ConnectionStatus({ onSettingsClick }: ConnectionStatusProps) {
  const [connection, setConnection] = React.useState<Connection | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchConnection = async () => {
      try {
        const res = await fetch('/api/connections')
        const data = await res.json()
        const active = data.connections?.find((c: Connection) => c.is_active)
        setConnection(active || null)
      } catch (error) {
        console.error('Failed to fetch connection:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConnection()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ghost-surface border border-ghost-border">
        <div className="h-2 w-2 rounded-full bg-ghost-text-muted animate-pulse" />
        <span className="text-sm text-ghost-text-muted">Loading...</span>
      </div>
    )
  }

  return (
    <button
      onClick={onSettingsClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
        connection
          ? 'bg-ghost-green-muted/30 border-ghost-green/30 hover:bg-ghost-green-muted/50'
          : 'bg-ghost-surface border-ghost-border hover:bg-ghost-surface-hover'
      )}
    >
      {connection ? (
        <>
          <CheckCircle className="h-4 w-4 text-ghost-green" />
          <span className="text-sm text-ghost-text">{connection.name}</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4 text-ghost-warning" />
          <span className="text-sm text-ghost-text-secondary">Not connected</span>
        </>
      )}
      <Settings className="h-3.5 w-3.5 text-ghost-text-muted ml-1" />
    </button>
  )
}
