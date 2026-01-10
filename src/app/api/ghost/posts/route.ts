import { NextResponse } from 'next/server'
import { createGhostClient, fetchAllPosts } from '@/lib/ghost'
import { getActiveConnection } from '@/lib/db'

export async function GET() {
  try {
    const connection = getActiveConnection()

    if (!connection) {
      return NextResponse.json(
        { error: 'No Ghost connection configured. Please add a connection in Settings.' },
        { status: 400 }
      )
    }

    const client = createGhostClient({ url: connection.url, key: connection.admin_key })
    const posts = await fetchAllPosts(client)

    // Return simplified post data for listing
    const simplifiedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      url: post.url,
      status: post.status,
      published_at: post.published_at,
      updated_at: post.updated_at,
    }))

    return NextResponse.json({
      success: true,
      posts: simplifiedPosts,
      total: simplifiedPosts.length,
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
