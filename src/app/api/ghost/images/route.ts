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

    // Calculate inline image stats
    let inlineImagesWithAlt = 0
    let inlineImagesMissingAlt = 0
    let postsWithNoImages = 0

    for (const post of posts) {
      const images = extractImages(post.html || '')
      if (images.length === 0) {
        postsWithNoImages++
      } else {
        for (const img of images) {
          if (img.alt && img.alt.trim() !== '') {
            inlineImagesWithAlt++
          } else {
            inlineImagesMissingAlt++
          }
        }
      }
    }

    const inlineImageStats = {
      hasAlt: inlineImagesWithAlt,
      missingAlt: inlineImagesMissingAlt,
      noImages: postsWithNoImages,
    }

    // Calculate feature image stats
    const featureImageStats = {
      hasAlt: 0,
      missingAlt: 0,
      noFeatureImage: 0,
    }

    for (const post of posts) {
      if (!post.feature_image) {
        featureImageStats.noFeatureImage++
      } else if (post.feature_image_alt && post.feature_image_alt.trim() !== '') {
        featureImageStats.hasAlt++
      } else {
        featureImageStats.missingAlt++
      }
    }

    // Calculate status breakdown
    const statusCounts = {
      published: 0,
      draft: 0,
      scheduled: 0,
    }

    for (const post of posts) {
      if (post.status === 'published') statusCounts.published++
      else if (post.status === 'draft') statusCounts.draft++
      else if (post.status === 'scheduled') statusCounts.scheduled++
    }

    return NextResponse.json({
      success: true,
      totalPosts: posts.length,
      postsWithIssues: postsWithIssues.length,
      totalImages: inlineImagesWithAlt + inlineImagesMissingAlt,
      totalMissing: inlineImagesMissingAlt,
      inlineImageStats,
      featureImageStats,
      statusCounts,
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
