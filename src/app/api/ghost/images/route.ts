import { NextRequest, NextResponse } from 'next/server'
import { createGhostClient, fetchAllPosts } from '@/lib/ghost'
import { scanPostsForImages, extractImages } from '@/lib/image-alt-parser'
import { getActiveConnection, getConnectionById } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connectionId')

    // Get connection - either specified or active
    let connection
    if (connectionId) {
      connection = getConnectionById(parseInt(connectionId, 10))
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

    // Scan for images without alt text
    const postsWithIssues = scanPostsForImages(posts)

    // Calculate totals
    const totalImages = posts.reduce((sum, post) => {
      return sum + extractImages(post.html || '').length
    }, 0)

    const totalMissing = postsWithIssues.reduce(
      (sum, post) => sum + post.images.length,
      0
    )

    return NextResponse.json({
      success: true,
      totalPosts: posts.length,
      postsWithIssues: postsWithIssues.length,
      totalImages,
      totalMissing,
      posts: postsWithIssues,
    })
  } catch (error) {
    console.error('Image scan error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scan failed' },
      { status: 500 }
    )
  }
}
