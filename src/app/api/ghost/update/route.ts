import { NextRequest, NextResponse } from 'next/server'
import { createGhostClient, fetchAllPosts, updatePost } from '@/lib/ghost'
import { replaceLinks } from '@/lib/link-parser'
import { getActiveConnection, getConnectionById } from '@/lib/db'

interface UpdateResult {
  id: string
  title: string
  success: boolean
  error?: string
  linksUpdated: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pattern, replacement, preservePath = true, postIds, connectionId } = body

    if (!pattern || !replacement) {
      return NextResponse.json(
        { error: 'Missing pattern or replacement' },
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
    const allPosts = await fetchAllPosts(client)

    // Filter to only the selected posts
    const postsToUpdate = postIds
      ? allPosts.filter((post) => postIds.includes(post.id))
      : allPosts

    const results: UpdateResult[] = []

    for (const post of postsToUpdate) {
      try {
        const { html: updatedHtml, replacements } = replaceLinks(
          post.html,
          pattern,
          replacement,
          preservePath
        )

        if (replacements.length > 0) {
          await updatePost(client, {
            id: post.id,
            html: updatedHtml,
            updated_at: post.updated_at,
          })

          results.push({
            id: post.id,
            title: post.title,
            success: true,
            linksUpdated: replacements.length,
          })
        }
      } catch (error) {
        results.push({
          id: post.id,
          title: post.title,
          success: false,
          error: error instanceof Error ? error.message : 'Update failed',
          linksUpdated: 0,
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const totalLinksUpdated = results.reduce((sum, r) => sum + r.linksUpdated, 0)

    return NextResponse.json({
      success: true,
      postsUpdated: successCount,
      postsFailed: results.length - successCount,
      totalLinksUpdated,
      results,
    })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    )
  }
}
