import { NextRequest, NextResponse } from 'next/server'
import { testConnection, createGhostClient, fetchAllPosts } from '@/lib/ghost'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, key } = body

    if (!url || !key) {
      return NextResponse.json(
        { error: 'Missing url or key' },
        { status: 400 }
      )
    }

    // Test the connection
    const result = await testConnection({ url, key })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to connect to Ghost' },
        { status: 401 }
      )
    }

    // Fetch post count
    const client = createGhostClient({ url, key })
    const posts = await fetchAllPosts(client)

    return NextResponse.json({
      success: true,
      postCount: posts.length,
    })
  } catch (error) {
    console.error('Connection error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 500 }
    )
  }
}
