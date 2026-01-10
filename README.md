# Ghost Scripts

A local admin toolkit for [Ghost CMS](https://ghost.io) that addresses common pain points and limitations of the default Ghost Admin UI.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### Link Replacer (Available Now)

Find and replace links across all your Ghost posts with pattern matching.

- **Pattern Matching** - Replace `docs.old-domain.io/path` with `docs.new-domain.io/path`
- **Preview Mode** - Review all changes in a diff view before applying
- **Selective Updates** - Choose which posts to update
- **Path Preservation** - Automatically preserves URL path structure

### Coming Soon

- **Media Browser** - Browse all uploaded images, find unused assets, detect duplicates
- **Revision History** - View and restore from Ghost's hidden revision history
- **SEO Auditor** - Check meta descriptions, missing alt tags, duplicate titles
- **Redirect Manager** - Visual UI for managing 301 redirects

## The Problem

Ghost is a powerful, modern publishing platform. However, as sites grow, several limitations emerge:

| Problem | Impact |
|---------|--------|
| **No Find & Replace** | Must export JSON, edit manually, and re-import |
| **No Media Library** | Images must be re-uploaded for every post |
| **No Version Control UI** | Revisions stored but no interface to view/restore |
| **Limited Bulk Operations** | Cannot mass-edit URLs, content, or metadata |

See [Ghost Forum discussions](https://forum.ghost.org/t/find-replace-broken-links/47485) for community feedback on these issues.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Ghost-inspired dark theme
- **Ghost Integration**: Official `@tryghost/admin-api` SDK
- **Database**: SQLite (for storing connections locally)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- A Ghost site with Admin API access

### Installation

```bash
# Clone the repository
git clone https://github.com/nishantmodak/ghost-admin.git
cd ghost-admin

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Connecting to Ghost

1. Go to your Ghost Admin → Settings → Integrations
2. Click "Add custom integration"
3. Copy the **Admin API Key** (format: `id:secret`)
4. In Ghost Scripts, click "Add Connection"
5. Enter your Ghost URL and API key

## Usage

### Finding and Replacing Links

1. Enter the domain/pattern to find (e.g., `docs.old-domain.io`)
2. Enter the replacement (e.g., `docs.new-domain.io`)
3. Click "Scan Posts" to find all matching links
4. Review the results and select which posts to update
5. Click "Preview Changes" to see the diff
6. Click "Apply Changes" to update your Ghost posts

## Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Project Structure

```
ghost-scripts/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── connections/  # Connection CRUD
│   │   │   └── ghost/        # Ghost API proxies
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Main dashboard
│   ├── components/
│   │   ├── ui/               # Base UI components
│   │   ├── ConnectionManager.tsx
│   │   ├── LinkScanner.tsx
│   │   └── PreviewModal.tsx
│   └── lib/
│       ├── db.ts             # SQLite operations
│       ├── ghost.ts          # Ghost API client
│       └── link-parser.ts    # Link extraction/replacement
├── data/                     # SQLite database (gitignored)
└── package.json
```

## API Reference

### `POST /api/ghost/scan`

Scan posts for matching links.

```json
{
  "pattern": "old-domain.io",
  "replacement": "new-domain.io",
  "preservePath": true
}
```

### `POST /api/ghost/update`

Apply link replacements to selected posts.

```json
{
  "pattern": "old-domain.io",
  "replacement": "new-domain.io",
  "preservePath": true,
  "postIds": ["post-id-1", "post-id-2"]
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Ghost](https://ghost.org) for building a great publishing platform
- [TryGhost/admin-api](https://github.com/TryGhost/SDK/tree/main/packages/admin-api) for the official SDK

## Disclaimer

This project is not affiliated with Ghost Foundation. Ghost is a trademark of Ghost Foundation.
