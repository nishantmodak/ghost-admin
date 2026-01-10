import { NextRequest, NextResponse } from 'next/server'
import {
  getAllConnections,
  createConnection,
  getActiveConnection,
} from '@/lib/db'
import { testConnection } from '@/lib/ghost'

// GET - List all connections
export async function GET() {
  try {
    const connections = getAllConnections()
    const active = getActiveConnection()

    return NextResponse.json({
      connections: connections.map((c) => ({
        ...c,
        // Mask the API key for security
        admin_key: c.admin_key.substring(0, 8) + '...' + c.admin_key.slice(-4),
      })),
      activeId: active?.id || null,
    })
  } catch (error) {
    console.error('Error fetching connections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    )
  }
}

// POST - Create new connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, url, adminKey, setActive = true } = body

    if (!name || !url || !adminKey) {
      return NextResponse.json(
        { error: 'Missing required fields: name, url, adminKey' },
        { status: 400 }
      )
    }

    // Test the connection first
    const testResult = await testConnection({ url, key: adminKey })
    if (!testResult.success) {
      return NextResponse.json(
        { error: testResult.error || 'Failed to connect to Ghost' },
        { status: 400 }
      )
    }

    // Create the connection
    const connection = createConnection(name, url, adminKey, setActive)

    return NextResponse.json({
      success: true,
      connection: {
        ...connection,
        admin_key: connection.admin_key.substring(0, 8) + '...' + connection.admin_key.slice(-4),
      },
    })
  } catch (error) {
    console.error('Error creating connection:', error)
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    )
  }
}
