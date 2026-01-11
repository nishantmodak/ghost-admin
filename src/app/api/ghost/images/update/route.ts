import { NextRequest, NextResponse } from 'next/server'
import { createGhostClient, fetchAllPosts, updatePost } from '@/lib/ghost'
import { applyAltUpdates, AltUpdate } from '@/lib/image-alt-parser'
import { getActiveConnection, getConnectionById } from '@/lib/db'

interface UpdateResult {
  id: string
  title: string
  success: boolean
  error?: string
  imagesUpdated: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { updates, connectionId } = body as {
      updates: AltUpdate[]
      connectionId?: string | number
    }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty updates array' },
        { status: 400 }
      )
    }

    // Get connection - either specified or active
    let connection
    if (connectionId) {
      const id = typeof connectionId === 'string' ? parseInt(connectionId, 10) : connectionId
      connection = getConnectionById(id)
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
    const allPosts = await fetchAllPosts(client)

    // Group updates by postId
    const updatesByPost = new Map<string, Map<string, string>>()
    for (const update of updates) {
      if (!updatesByPost.has(update.postId)) {
        updatesByPost.set(update.postId, new Map())
      }
      updatesByPost.get(update.postId)!.set(update.src, update.newAlt)
    }

    // Get unique post IDs that need updates
    const postIdsToUpdate = Array.from(updatesByPost.keys())
    const postsToUpdate = allPosts.filter((post) => postIdsToUpdate.includes(post.id))

    const results: UpdateResult[] = []

    for (const post of postsToUpdate) {
      try {
        const postUpdates = updatesByPost.get(post.id)
        if (!postUpdates || postUpdates.size === 0) continue

        const { html: updatedHtml, updatedCount } = applyAltUpdates(
          post.html || '',
          postUpdates
        )

        if (updatedCount > 0) {
          await updatePost(client, {
            id: post.id,
            html: updatedHtml,
            updated_at: post.updated_at,
          })

          results.push({
            id: post.id,
            title: post.title,
            success: true,
            imagesUpdated: updatedCount,
          })
        }
      } catch (error) {
        results.push({
          id: post.id,
          title: post.title,
          success: false,
          error: error instanceof Error ? error.message : 'Update failed',
          imagesUpdated: 0,
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const totalImagesUpdated = results.reduce((sum, r) => sum + r.imagesUpdated, 0)

    return NextResponse.json({
      success: true,
      postsUpdated: successCount,
      postsFailed: results.length - successCount,
      totalImagesUpdated,
      results,
    })
  } catch (error) {
    console.error('Image update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    )
  }
}
