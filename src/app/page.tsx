'use client'

import * as React from 'react'
import { Ghost, Github } from 'lucide-react'
import { ConnectionManager } from '@/components/ConnectionManager'
import { LinkScanner } from '@/components/LinkScanner'
import { Button } from '@/components/ui/button'

export default function Home() {
  const [connectionKey, setConnectionKey] = React.useState(0)

  const handleConnectionChange = () => {
    // Force re-render of components that depend on connection
    setConnectionKey((k) => k + 1)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-ghost-border bg-ghost-bg/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-ghost-green-muted">
                <Ghost className="h-6 w-6 text-ghost-green" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-ghost-text">
                  Ghost Scripts
                </h1>
                <p className="text-xs text-ghost-text-muted">
                  Admin Toolkit
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(
                    'https://github.com/nishantmodak/ghost-admin',
                    '_blank'
                  )
                }
              >
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Banner - shown only when no connection */}
          <div className="relative overflow-hidden rounded-2xl border border-ghost-border bg-gradient-to-br from-ghost-surface to-ghost-bg p-8">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-ghost-text mb-2">
                Welcome to Ghost Scripts
              </h2>
              <p className="text-ghost-text-secondary max-w-xl">
                A powerful toolkit to manage your Ghost blog. Find and replace
                broken links, bulk edit posts, and more — all from a clean local
                interface.
              </p>
            </div>
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-ghost-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>

          {/* Connection Manager */}
          <ConnectionManager onConnectionChange={handleConnectionChange} />

          {/* Tools */}
          <div key={connectionKey}>
            <LinkScanner />
          </div>

          {/* Coming Soon */}
          <div className="grid gap-4 md:grid-cols-2">
            <ComingSoonCard
              title="Media Browser"
              description="Browse, search, and manage all images across your posts"
            />
            <ComingSoonCard
              title="Revision History"
              description="View and restore from Ghost's hidden revision history"
            />
            <ComingSoonCard
              title="SEO Auditor"
              description="Check meta descriptions, alt tags, and more"
            />
            <ComingSoonCard
              title="Redirect Manager"
              description="Visual UI for managing 301 redirects"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-ghost-border mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-ghost-text-muted">
            <p>
              Ghost Scripts is not affiliated with Ghost Foundation.
            </p>
            <p>MIT License</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ComingSoonCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="p-6 rounded-xl border border-ghost-border border-dashed bg-ghost-surface/30 opacity-60">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-medium text-ghost-text">{title}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-ghost-surface-hover text-ghost-text-muted">
          Coming Soon
        </span>
      </div>
      <p className="text-sm text-ghost-text-muted">{description}</p>
    </div>
  )
}
