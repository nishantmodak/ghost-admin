# Ghost Scripts

A local Rails-based admin toolkit for [Ghost CMS](https://ghost.io) that addresses common pain points and limitations of the default Ghost Admin UI.

## The Problem

Ghost is a powerful, modern publishing platform with a clean interface. However, as sites grow and workflows become more complex, several limitations emerge that make day-to-day content management frustrating:

### Content Management Gaps

| Problem | Impact |
|---------|--------|
| **No Media Library** | Images must be re-uploaded for every post. No way to browse or reuse existing assets. |
| **No Version Control UI** | Ghost stores up to 10 revisions internally, but provides no interface to view or restore them. |
| **Limited Bulk Operations** | Native bulk actions limited to tags, access, and featured status. Cannot mass-edit authors, URLs, or content. |
| **No Find & Replace** | To update text across posts, you must export JSON, edit manually, and re-import. |
| **No Built-in Broken Link Checker** | External tools required to detect dead links in your content. |

### Performance & Scale Issues

| Problem | Impact |
|---------|--------|
| **Slow Admin Search** | On large sites (10k+ posts), search performs multiple queries causing noticeable lag. |
| **API Pagination Limits** | `limit=all` removed; max 100 items per page makes bulk operations tedious. |
| **Database Migration Challenges** | SQLite to MySQL migrations (required in Ghost 5.x) often cause connection errors. |

### Editorial Workflow Limitations

| Problem | Impact |
|---------|--------|
| **No Editorial Review Process** | No approval workflows for multi-author publications. Changes go live immediately. |
| **No Diff View** | Cannot see what changed between revisions or who made edits. |
| **Limited Audit Trail** | No comprehensive log of content changes over time. |

### SEO & Technical Gaps

| Problem | Impact |
|---------|--------|
| **Manual Redirect Management** | No UI for managing 301 redirects; requires editing `redirects.json` manually. |
| **Limited Meta Control** | Adding `nofollow` attributes requires switching to HTML blocks. |
| **No Canonical URL Bulk Updates** | Must edit posts individually to fix canonical URLs after migrations. |

### Sources

These issues are documented across the Ghost community:
- [Ghost Forum: Media Library Functionality](https://forum.ghost.org/t/media-library-functionality/10961)
- [Ghost Forum: Article History/Revisions](https://forum.ghost.org/t/article-history-revisions/2892)
- [Ghost Forum: Find/Replace Broken Links](https://forum.ghost.org/t/find-replace-broken-links/47485)
- [Ghost Forum: Admin UI Search is Slow](https://forum.ghost.org/t/ghost-admin-ui-search-is-slow/59353)
- [Ghost Forum: Bulk Actions for Posts](https://forum.ghost.org/t/bulk-actions-for-posts-in-admin/15781)
- [Ghost Forum: Can Ghost Identify Dead Links?](https://forum.ghost.org/t/can-ghost-identify-dead-links/4348)
- [Medevel: Ghost CMS Problems](https://medevel.com/ghost-cms-a-brilliant-idea-haunted-by-serious-problems/)

## Our Solution

Ghost Scripts provides a local Rails application that connects to your Ghost instance via the Admin API, offering tools that Ghost's native admin lacks:

### Planned Features

- **Broken Link Scanner** - Crawl all posts and identify dead internal/external links with one-click fixes
- **Bulk Content Editor** - Find & replace across all posts, mass update authors, tags, and metadata
- **Revision Browser** - View and restore from Ghost's hidden revision history
- **Media Browser** - Browse all uploaded images, find unused assets, detect duplicates
- **Redirect Manager** - Visual UI for managing 301 redirects without editing JSON
- **SEO Auditor** - Check meta descriptions, missing alt tags, duplicate titles
- **Content Health Dashboard** - Overview of drafts, orphaned tags, broken embeds
- **Export Tools** - Backup content to Markdown, with Git-friendly version control

## Requirements

- Ruby 3.2+
- Rails 7.1+
- A Ghost instance (self-hosted or Ghost Pro) with Admin API access

## Installation

```bash
git clone https://github.com/yourusername/ghost-scripts.git
cd ghost-scripts
bundle install
rails db:setup
```

## Configuration

1. Create a custom integration in your Ghost Admin (Settings → Integrations → Add custom integration)
2. Copy your Admin API key
3. Configure the connection:

```bash
cp .env.example .env
# Edit .env with your Ghost URL and Admin API key
```

```env
GHOST_URL=https://your-ghost-site.com
GHOST_ADMIN_API_KEY=your-admin-api-key
```

## Usage

```bash
rails server
# Open http://localhost:3000
```

## Development

```bash
# Run tests
bundle exec rspec

# Run linter
bundle exec rubocop

# Start development server with auto-reload
bin/dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Ghost](https://ghost.org) for building a great publishing platform
- The Ghost community for documenting these pain points
- [TryGhost/api-demos](https://github.com/TryGhost/api-demos) for API examples

## Disclaimer

This project is not affiliated with Ghost Foundation. Ghost is a trademark of Ghost Foundation.
