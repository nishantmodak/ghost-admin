export interface ImageMatch {
  src: string
  alt: string | null // null = missing, '' = empty
  context: string
  fullTag: string
  startIndex: number
  endIndex: number
}

export interface PostWithImages {
  id: string
  title: string
  slug: string
  url: string
  status: string
  images: ImageMatch[]
  updatedHtml?: string
}

export interface AltUpdate {
  postId: string
  src: string
  newAlt: string
}

/**
 * Extract all images from HTML content
 */
export function extractImages(html: string): ImageMatch[] {
  const matches: ImageMatch[] = []

  if (!html) {
    return matches
  }

  // Match <img> tags and capture the full tag
  const imgRegex = /<img\s+[^>]*>/gi
  let match

  while ((match = imgRegex.exec(html)) !== null) {
    const fullTag = match[0]
    const startIndex = match.index
    const endIndex = startIndex + fullTag.length

    // Extract src attribute
    const srcMatch = fullTag.match(/src=["']([^"']+)["']/i)
    const src = srcMatch ? srcMatch[1] : ''

    if (!src) continue // Skip images without src

    // Extract alt attribute
    const altMatch = fullTag.match(/alt=["']([^"']*)["']/i)
    const alt = altMatch ? altMatch[1] : null // null means no alt attribute

    // Extract surrounding context (up to 50 chars before and after)
    const contextStart = Math.max(0, startIndex - 50)
    const contextEnd = Math.min(html.length, endIndex + 50)
    let context = html.slice(contextStart, contextEnd)

    // Clean up context for display
    context = context
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    if (contextStart > 0) context = '...' + context
    if (contextEnd < html.length) context = context + '...'

    matches.push({
      src,
      alt,
      context,
      fullTag,
      startIndex,
      endIndex,
    })
  }

  return matches
}

/**
 * Extract images that are missing alt text or have empty alt
 */
export function extractImagesWithoutAlt(html: string): ImageMatch[] {
  const allImages = extractImages(html)
  return allImages.filter((img) => img.alt === null || img.alt === '')
}

/**
 * Apply alt text updates to HTML
 */
export function applyAltUpdates(
  html: string,
  updates: Map<string, string> // src -> newAlt
): { html: string; updatedCount: number } {
  let updatedHtml = html
  let updatedCount = 0

  // Process updates in reverse order of position to maintain correct indices
  const images = extractImages(html)
    .filter((img) => updates.has(img.src))
    .sort((a, b) => b.startIndex - a.startIndex) // Reverse order

  for (const img of images) {
    const newAlt = updates.get(img.src)
    if (newAlt === undefined) continue

    let newTag: string

    if (img.alt === null) {
      // No alt attribute exists - add it before the closing >
      // Insert alt right after src attribute for cleaner HTML
      newTag = img.fullTag.replace(
        /(<img\s+)/i,
        `$1alt="${escapeHtml(newAlt)}" `
      )
    } else {
      // Alt attribute exists (empty) - replace its value
      newTag = img.fullTag.replace(
        /alt=["'][^"']*["']/i,
        `alt="${escapeHtml(newAlt)}"`
      )
    }

    updatedHtml =
      updatedHtml.slice(0, img.startIndex) +
      newTag +
      updatedHtml.slice(img.endIndex)
    updatedCount++
  }

  return { html: updatedHtml, updatedCount }
}

/**
 * Escape HTML special characters for safe attribute values
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Scan posts and find those with images missing alt text
 */
export function scanPostsForImages(
  posts: Array<{
    id: string
    title: string
    slug: string
    url: string
    html: string
    status: string
  }>
): PostWithImages[] {
  const results: PostWithImages[] = []

  for (const post of posts) {
    const images = extractImagesWithoutAlt(post.html || '')

    if (images.length > 0) {
      results.push({
        id: post.id,
        title: post.title,
        slug: post.slug,
        url: post.url,
        status: post.status,
        images,
      })
    }
  }

  return results
}

/**
 * Prepare posts for update by applying alt text changes
 */
export function preparePostUpdates(
  posts: Array<{
    id: string
    title: string
    slug: string
    url: string
    html: string
    status: string
  }>,
  updates: AltUpdate[]
): PostWithImages[] {
  const results: PostWithImages[] = []

  // Group updates by postId
  const updatesByPost = new Map<string, Map<string, string>>()
  for (const update of updates) {
    if (!updatesByPost.has(update.postId)) {
      updatesByPost.set(update.postId, new Map())
    }
    updatesByPost.get(update.postId)!.set(update.src, update.newAlt)
  }

  for (const post of posts) {
    const postUpdates = updatesByPost.get(post.id)
    if (!postUpdates || postUpdates.size === 0) continue

    const { html: updatedHtml, updatedCount } = applyAltUpdates(
      post.html || '',
      postUpdates
    )

    if (updatedCount > 0) {
      // Get the images that were updated for display
      const images = extractImages(post.html || '').filter((img) =>
        postUpdates.has(img.src)
      )

      results.push({
        id: post.id,
        title: post.title,
        slug: post.slug,
        url: post.url,
        status: post.status,
        images,
        updatedHtml,
      })
    }
  }

  return results
}
