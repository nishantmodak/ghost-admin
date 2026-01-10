export interface LinkMatch {
  original: string
  replacement: string
  context: string
}

export interface PostWithLinks {
  id: string
  title: string
  slug: string
  url: string
  status: string
  links: LinkMatch[]
  updatedHtml?: string
}

/**
 * Extract all URLs from HTML content that match the given pattern
 */
export function extractMatchingLinks(
  html: string,
  pattern: string
): LinkMatch[] {
  const matches: LinkMatch[] = []

  if (!html || !pattern) {
    return matches
  }

  // Escape special regex characters in the pattern, but keep it as a prefix match
  const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Match URLs in href attributes and plain text URLs
  // This regex finds URLs that start with the pattern
  const urlRegex = new RegExp(
    `(https?://)?${escapedPattern}[^"'\\s<>]*`,
    'gi'
  )

  const urlMatches = html.match(urlRegex)

  if (!urlMatches) {
    return matches
  }

  // Deduplicate URLs
  const uniqueUrls = [...new Set(urlMatches)]

  for (const url of uniqueUrls) {
    // Extract surrounding context (up to 50 chars before and after)
    const index = html.indexOf(url)
    const start = Math.max(0, index - 50)
    const end = Math.min(html.length, index + url.length + 50)
    let context = html.slice(start, end)

    // Clean up context for display
    context = context
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    if (start > 0) context = '...' + context
    if (end < html.length) context = context + '...'

    matches.push({
      original: url,
      replacement: '', // Will be filled in by the replace function
      context,
    })
  }

  return matches
}

/**
 * Replace all matching URLs in HTML with new URLs
 */
export function replaceLinks(
  html: string,
  pattern: string,
  replacement: string,
  preservePath: boolean = true
): { html: string; replacements: LinkMatch[] } {
  const replacements: LinkMatch[] = []

  if (!html || !pattern || !replacement) {
    return { html, replacements }
  }

  // Escape special regex characters in the pattern
  const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Match URLs that start with the pattern
  const urlRegex = new RegExp(
    `(https?://)?${escapedPattern}([^"'\\s<>]*)`,
    'gi'
  )

  const newHtml = html.replace(urlRegex, (match, protocol, path) => {
    let newUrl: string

    if (preservePath) {
      // Preserve the path structure
      const hasProtocol = match.toLowerCase().startsWith('http')
      const replacementHasProtocol = replacement.toLowerCase().startsWith('http')

      if (replacementHasProtocol) {
        newUrl = replacement + (path || '')
      } else {
        const proto = hasProtocol ? (protocol || 'https://') : ''
        newUrl = proto + replacement + (path || '')
      }
    } else {
      // Just replace the domain part
      newUrl = replacement
    }

    replacements.push({
      original: match,
      replacement: newUrl,
      context: '',
    })

    return newUrl
  })

  return { html: newHtml, replacements }
}

/**
 * Scan posts and find those with matching links
 */
export function scanPostsForLinks(
  posts: Array<{ id: string; title: string; slug: string; url: string; html: string; status: string }>,
  pattern: string
): PostWithLinks[] {
  const results: PostWithLinks[] = []

  for (const post of posts) {
    const links = extractMatchingLinks(post.html, pattern)

    if (links.length > 0) {
      results.push({
        id: post.id,
        title: post.title,
        slug: post.slug,
        url: post.url,
        status: post.status,
        links,
      })
    }
  }

  return results
}

/**
 * Prepare posts for update by replacing links
 */
export function preparePostUpdates(
  posts: Array<{ id: string; title: string; slug: string; url: string; html: string; status: string }>,
  pattern: string,
  replacement: string,
  preservePath: boolean = true
): PostWithLinks[] {
  const results: PostWithLinks[] = []

  for (const post of posts) {
    const { html: updatedHtml, replacements } = replaceLinks(
      post.html,
      pattern,
      replacement,
      preservePath
    )

    if (replacements.length > 0) {
      results.push({
        id: post.id,
        title: post.title,
        slug: post.slug,
        url: post.url,
        status: post.status,
        links: replacements,
        updatedHtml,
      })
    }
  }

  return results
}
