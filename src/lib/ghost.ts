import GhostAdminAPI from '@tryghost/admin-api'

export interface GhostCredentials {
  url: string
  key: string
}

export interface GhostPost {
  id: string
  uuid: string
  title: string
  slug: string
  html: string
  status: 'published' | 'draft' | 'scheduled'
  updated_at: string
  published_at: string | null
  url: string
}

export interface GhostPostUpdate {
  id: string
  html: string
  updated_at: string
}

export function createGhostClient(credentials: GhostCredentials): GhostAdminAPI {
  return new GhostAdminAPI({
    url: credentials.url,
    key: credentials.key,
    version: 'v5.0',
  })
}

export async function fetchAllPosts(
  client: GhostAdminAPI
): Promise<GhostPost[]> {
  const allPosts: GhostPost[] = []
  let page = 1
  const limit = 100

  while (true) {
    const posts = await client.posts.browse({
      limit,
      page,
      formats: ['html'],
      fields: ['id', 'uuid', 'title', 'slug', 'html', 'status', 'updated_at', 'published_at', 'url'],
    })

    if (!posts || posts.length === 0) {
      break
    }

    allPosts.push(...(posts as unknown as GhostPost[]))

    // Check if we've fetched all posts
    if (posts.length < limit) {
      break
    }

    page++
  }

  return allPosts
}

export async function updatePost(
  client: GhostAdminAPI,
  update: GhostPostUpdate
): Promise<GhostPost> {
  const result = await client.posts.edit(
    {
      id: update.id,
      html: update.html,
      updated_at: update.updated_at,
    },
    { source: 'html' }
  )

  return result as unknown as GhostPost
}

export async function testConnection(
  credentials: GhostCredentials
): Promise<{ success: boolean; error?: string; postCount?: number }> {
  try {
    const client = createGhostClient(credentials)
    const posts = await client.posts.browse({ limit: 1 })

    // Get total count by browsing with meta
    const meta = await client.posts.browse({ limit: 1, page: 1 })

    return {
      success: true,
      postCount: Array.isArray(meta) ? meta.length : 0,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: message,
    }
  }
}
