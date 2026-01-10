import { NextRequest, NextResponse } from 'next/server'
import {
  getConnectionById,
  updateConnection,
  deleteConnection,
  setActiveConnection,
} from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get single connection
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const connection = getConnectionById(parseInt(id, 10))

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      connection: {
        ...connection,
        admin_key: connection.admin_key.substring(0, 8) + '...' + connection.admin_key.slice(-4),
      },
    })
  } catch (error) {
    console.error('Error fetching connection:', error)
    return NextResponse.json(
      { error: 'Failed to fetch connection' },
      { status: 500 }
    )
  }
}

// PATCH - Update connection
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, url, adminKey, setActive } = body

    const connectionId = parseInt(id, 10)

    // If setting as active
    if (setActive) {
      const updated = setActiveConnection(connectionId)
      if (!updated) {
        return NextResponse.json(
          { error: 'Connection not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        connection: {
          ...updated,
          admin_key: updated.admin_key.substring(0, 8) + '...' + updated.admin_key.slice(-4),
        },
      })
    }

    // Update other fields
    const updateData: { name?: string; url?: string; admin_key?: string } = {}
    if (name) updateData.name = name
    if (url) updateData.url = url
    if (adminKey) updateData.admin_key = adminKey

    const updated = updateConnection(connectionId, updateData)
    if (!updated) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      connection: {
        ...updated,
        admin_key: updated.admin_key.substring(0, 8) + '...' + updated.admin_key.slice(-4),
      },
    })
  } catch (error) {
    console.error('Error updating connection:', error)
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    )
  }
}

// DELETE - Delete connection
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const deleted = deleteConnection(parseInt(id, 10))

    if (!deleted) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting connection:', error)
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    )
  }
}
