'use client'

import * as React from 'react'
import { Github } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { PostsView } from '@/components/PostsView'
import { LinkScanner } from '@/components/LinkScanner'
import { SettingsView } from '@/components/SettingsView'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { Button } from '@/components/ui/button'

const pageTitles: Record<string, string> = {
  posts: 'All Posts',
  'link-replacer': 'Link Replacer',
  'media-browser': 'Media Browser',
  revisions: 'Revisions',
  'seo-audit': 'SEO Audit',
  settings: 'Settings',
}

export default function Home() {
  const [activeTab, setActiveTab] = React.useState('posts')
  const [connectionKey, setConnectionKey] = React.useState(0)

  const handleConnectionChange = () => {
    setConnectionKey((k) => k + 1)
  }

  const handleSettingsClick = () => {
    setActiveTab('settings')
  }

  return (
    <div className="min-h-screen bg-ghost-bg">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-ghost-border bg-ghost-bg/80 backdrop-blur-sm">
          <div className="flex items-center justify-between h-14 px-6">
            <h2 className="text-lg font-semibold text-ghost-text">
              {pageTitles[activeTab] || activeTab}
            </h2>
            <div className="flex items-center gap-3">
              <ConnectionStatus onSettingsClick={handleSettingsClick} />
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
                <Github className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 max-w-5xl">
          {activeTab === 'posts' && (
            <div key={connectionKey} className="animate-fade-in">
              <PostsView />
            </div>
          )}

          {activeTab === 'link-replacer' && (
            <div key={connectionKey} className="animate-fade-in">
              <LinkScanner />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-fade-in">
              <SettingsView onConnectionChange={handleConnectionChange} />
            </div>
          )}

          {activeTab === 'media-browser' && (
            <ComingSoonView
              title="Media Browser"
              description="Browse all uploaded images, find unused assets, and detect duplicates across your Ghost posts."
            />
          )}

          {activeTab === 'revisions' && (
            <ComingSoonView
              title="Revision History"
              description="View and restore from Ghost's hidden revision history. Compare changes between versions."
            />
          )}

          {activeTab === 'seo-audit' && (
            <ComingSoonView
              title="SEO Audit"
              description="Check meta descriptions, missing alt tags, duplicate titles, and other SEO issues."
            />
          )}
        </div>
      </main>
    </div>
  )
}

function ComingSoonView({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-ghost-surface-hover flex items-center justify-center mb-6">
        <span className="text-3xl">🚧</span>
      </div>
      <h2 className="text-xl font-semibold text-ghost-text mb-2">{title}</h2>
      <p className="text-ghost-text-secondary text-center max-w-md">
        {description}
      </p>
      <p className="text-sm text-ghost-text-muted mt-4">Coming soon</p>
    </div>
  )
}
