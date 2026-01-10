import Database from 'better-sqlite3'
import path from 'path'

export interface GhostConnection {
  id: number
  name: string
  url: string
  admin_key: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Database file location - in project root
const DB_PATH = path.join(process.cwd(), 'data', 'ghost-scripts.db')

// Ensure the data directory exists
function ensureDataDir() {
  const fs = require('fs')
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Initialize database
function getDb(): Database.Database {
  ensureDataDir()
  const db = new Database(DB_PATH)

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      admin_key TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_connections_active ON connections(is_active);
  `)

  return db
}

// Get all connections
export function getAllConnections(): GhostConnection[] {
  const db = getDb()
  try {
    const rows = db.prepare('SELECT * FROM connections ORDER BY is_active DESC, name ASC').all()
    return rows as GhostConnection[]
  } finally {
    db.close()
  }
}

// Get active connection
export function getActiveConnection(): GhostConnection | null {
  const db = getDb()
  try {
    const row = db.prepare('SELECT * FROM connections WHERE is_active = 1 LIMIT 1').get()
    return row as GhostConnection | null
  } finally {
    db.close()
  }
}

// Get connection by ID
export function getConnectionById(id: number): GhostConnection | null {
  const db = getDb()
  try {
    const row = db.prepare('SELECT * FROM connections WHERE id = ?').get(id)
    return row as GhostConnection | null
  } finally {
    db.close()
  }
}

// Create new connection
export function createConnection(
  name: string,
  url: string,
  adminKey: string,
  setActive: boolean = true
): GhostConnection {
  const db = getDb()
  try {
    // If setting as active, deactivate all others first
    if (setActive) {
      db.prepare('UPDATE connections SET is_active = 0').run()
    }

    const result = db.prepare(`
      INSERT INTO connections (name, url, admin_key, is_active)
      VALUES (?, ?, ?, ?)
    `).run(name, url, adminKey, setActive ? 1 : 0)

    const newConnection = db.prepare('SELECT * FROM connections WHERE id = ?').get(result.lastInsertRowid)
    return newConnection as GhostConnection
  } finally {
    db.close()
  }
}

// Update connection
export function updateConnection(
  id: number,
  data: Partial<{ name: string; url: string; admin_key: string }>
): GhostConnection | null {
  const db = getDb()
  try {
    const updates: string[] = []
    const values: (string | number)[] = []

    if (data.name !== undefined) {
      updates.push('name = ?')
      values.push(data.name)
    }
    if (data.url !== undefined) {
      updates.push('url = ?')
      values.push(data.url)
    }
    if (data.admin_key !== undefined) {
      updates.push('admin_key = ?')
      values.push(data.admin_key)
    }

    if (updates.length === 0) return getConnectionById(id)

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    db.prepare(`UPDATE connections SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    return getConnectionById(id)
  } finally {
    db.close()
  }
}

// Set active connection
export function setActiveConnection(id: number): GhostConnection | null {
  const db = getDb()
  try {
    db.prepare('UPDATE connections SET is_active = 0').run()
    db.prepare('UPDATE connections SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id)
    return getConnectionById(id)
  } finally {
    db.close()
  }
}

// Delete connection
export function deleteConnection(id: number): boolean {
  const db = getDb()
  try {
    const result = db.prepare('DELETE FROM connections WHERE id = ?').run(id)
    return result.changes > 0
  } finally {
    db.close()
  }
}
