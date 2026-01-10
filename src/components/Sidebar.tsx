'use client'

import * as React from 'react'
import { Ghost, Link2, Settings, Image, History, Search, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems = [
  {
    id: 'posts',
    label: 'All Posts',
    icon: FileText,
    available: true,
  },
  {
    id: 'link-replacer',
    label: 'Link Replacer',
    icon: Link2,
    available: true,
  },
  {
    id: 'media-browser',
    label: 'Media Browser',
    icon: Image,
    available: false,
  },
  {
    id: 'revisions',
    label: 'Revisions',
    icon: History,
    available: false,
  },
  {
    id: 'seo-audit',
    label: 'SEO Audit',
    icon: Search,
    available: false,
  },
]

const bottomNavItems = [
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    available: true,
  },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-ghost-surface border-r border-ghost-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-4 border-b border-ghost-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-ghost-green-muted">
            <Ghost className="h-6 w-6 text-ghost-green" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-ghost-text">
              Ghost Scripts
            </h1>
            <p className="text-xs text-ghost-text-muted">Admin Toolkit</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-medium text-ghost-text-muted uppercase tracking-wider">
          Tools
        </p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => item.available && onTabChange(item.id)}
            disabled={!item.available}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === item.id
                ? 'bg-ghost-green-muted text-ghost-green'
                : item.available
                ? 'text-ghost-text-secondary hover:text-ghost-text hover:bg-ghost-surface-hover'
                : 'text-ghost-text-muted cursor-not-allowed opacity-50'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="flex-1 text-left">{item.label}</span>
            {!item.available && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-ghost-surface-hover text-ghost-text-muted">
                Soon
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-ghost-border">
        {bottomNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => item.available && onTabChange(item.id)}
            disabled={!item.available}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === item.id
                ? 'bg-ghost-green-muted text-ghost-green'
                : item.available
                ? 'text-ghost-text-secondary hover:text-ghost-text hover:bg-ghost-surface-hover'
                : 'text-ghost-text-muted cursor-not-allowed opacity-50'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
