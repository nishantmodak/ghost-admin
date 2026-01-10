'use client'

import * as React from 'react'
import { ConnectionManager } from './ConnectionManager'

interface SettingsViewProps {
  onConnectionChange?: () => void
}

export function SettingsView({ onConnectionChange }: SettingsViewProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ghost-text">Settings</h1>
        <p className="text-ghost-text-secondary mt-1">
          Manage your Ghost connections and preferences
        </p>
      </div>

      {/* Connections Section */}
      <div>
        <h2 className="text-lg font-semibold text-ghost-text mb-4">
          Ghost Connections
        </h2>
        <ConnectionManager onConnectionChange={onConnectionChange} />
      </div>

      {/* Future Settings Sections */}
      <div className="border border-ghost-border border-dashed rounded-xl p-6 opacity-50">
        <h2 className="text-lg font-semibold text-ghost-text mb-2">
          Preferences
        </h2>
        <p className="text-sm text-ghost-text-muted">
          Additional settings and preferences coming soon.
        </p>
      </div>
    </div>
  )
}
