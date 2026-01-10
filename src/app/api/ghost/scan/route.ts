import { NextRequest, NextResponse } from 'next/server'
import { createGhostClient, fetchAllPosts } from '@/lib/ghost'
import { scanPostsForLinks, preparePostUpdates } from '@/lib/link-parser'
import { getActiveConnection, getConnectionById } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pattern, replacement, preservePath = true, connectionId } = body

    if (!pattern) {
      return NextResponse.json(
        { error: 'Missing search pattern' },
        { status: 400 }
      )
    }

    // Get connection - either specified or active
    let connection
    if (connectionId) {
      connection = getConnectionById(connectionId)
    } else {
      connection = getActiveConnection()
    }

    if (!connection) {
      return NextResponse.json(
        { error: 'No Ghost connection configured. Please add a connection first.' },
        { status: 400 }
      )
    }

    const client = createGhostClient({ url: connection.url, key: connection.admin_key })
    const posts = await fetchAllPosts(client)

    // If replacement is provided, prepare updates with before/after
    // Otherwise, just scan for matching links
    let results
    if (replacement) {
      results = preparePostUpdates(posts, pattern, replacement, preservePath)
    } else {
      results = scanPostsForLinks(posts, pattern)
    }

    return NextResponse.json({
      success: true,
      totalPosts: posts.length,
      matchingPosts: results.length,
      totalLinks: results.reduce((sum, post) => sum + post.links.length, 0),
      posts: results,
    })
  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scan failed' },
      { status: 500 }
    )
  }
}
