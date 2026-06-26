# @brandkity/mcp — [BrandKity](https://brandkity.com) MCP Server

Model Context Protocol server for **BrandKity** — create and manage brand kits from any AI agent (Claude Desktop, Cursor, Windsurf, or any MCP-compatible client).

**Current Version**: 1.4.3 — MCP now available on Starter, Pro, and Agency plans

## Quick Start

### 1. Get an API Key

1. Sign in at [brandkity.com](https://brandkity.com)
2. Go to **Settings → API Keys**
3. Click **Generate New Key** and copy the key (`bk_live_...`)

> Available on **Starter**, **Pro**, and **Agency** plans. Sign up free to explore, then upgrade Starter or above to run tool calls.

### 2. Configure Your AI Client

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "brandkity": {
      "command": "npx",
      "args": ["-y", "@brandkity/mcp"],
      "env": {
        "BRANDKITY_API_KEY": "bk_live_your_key_here"
      }
    }
  }
}
```

#### Cursor

Edit `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "brandkity": {
      "command": "npx",
      "args": ["-y", "@brandkity/mcp"],
      "env": {
        "BRANDKITY_API_KEY": "bk_live_your_key_here"
      }
    }
  }
}
```

#### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "brandkity": {
      "command": "npx",
      "args": ["-y", "@brandkity/mcp"],
      "env": {
        "BRANDKITY_API_KEY": "bk_live_your_key_here"
      }
    }
  }
}
```

### 3. Use It

Once configured, ask your AI agent to create a brand kit:

> "Create a brand kit for Acme Corp with the accent color #E55B00. Add a Colors block with the primary palette (Orange Flame #E55B00, Midnight #1A1A2E, Canvas #FAF9F7) and a Typography block with Inter for headings and DM Sans for body. Upload the logos from /Users/me/acme/logos/."

## Available Tools (22)

| Tool | Description |
|------|-------------|
| **Workspace** | |
| `get_workspace` | Get workspace info (plan, kit count, storage) |
| **Files** | |
| `upload_file` | Upload any local file to workspace storage → returns a public URL |
| `list_files` | List workspace files with type filter and pagination |
| **Kits** | |
| `list_kits` | List all brand kits (filter by draft/published/all) |
| `create_kit` | Create a new kit → returns kit_id |
| `get_kit` | Get a kit with all blocks and content |
| `update_kit` | Update kit settings (name, color, template, logo_url, cover_image_url, **white-label fields**) |
| `publish_kit` | Publish a kit → returns public URL |
| `unpublish_kit` | Unpublish a kit (reverts to draft) |
| **Blocks** | |
| `list_blocks` | List all blocks in a kit with IDs and types |
| `ensure_block` | **Idempotent** — returns existing block_id or creates a new block (preferred over add_block) |
| `add_block` | Add a block unconditionally (use ensure_block instead to prevent duplicates) |
| `update_block` | Update block name/visibility |
| `delete_block` | Permanently delete a block and all its content |
| **Content** | |
| `add_colors` | Add color swatches to a Colors block |
| `add_typography` | Add font entries to a Typography block |
| `set_brand_story` | Set rich text content (brand story, tone of voice) |
| `set_block_note` | Set the editorial note displayed above any block |
| **Upload** | |
| `upload_asset` | Upload a local file into a block (logos, visuals, videos, etc.) with auto-retry |
| `upload_assets_batch` | Upload multiple local files into the same block; deduplicates by file path |
| `upload_kit_logo` | Upload and set the kit's header logo |
| `upload_cover_image` | Upload and set the kit's cover image |

## White-Label Branding (Pro+ Feature)

Customize your portal with custom favicon, social share image, and SEO metadata:

```typescript
// Upload custom assets
const faviconUrl = await client.uploadFile('favicon.ico', faviconBuffer);
const ogImageUrl = await client.uploadFile('og-image.png', ogImageBuffer);

// Apply white-label branding
await client.updateKit('kit-id', {
  og_title: 'Acme Corp Brand Guidelines',
  og_description: 'Official brand assets and standards',
  custom_favicon_url: faviconUrl,
  og_image_url: ogImageUrl,
});
```

**Fields**:
- `og_title` (string, max 100 chars) — SEO title for social share
- `og_description` (string, max 300 chars) — SEO description
- `custom_favicon_url` (string) — CDN URL to favicon (ICO/PNG/SVG)
- `og_image_url` (string) — CDN URL to social share image (1200×630 px recommended)

**Plan Requirements**:
- Free: White-label fields are read-only; MCP tool calls return 403
- Starter/Pro/Agency: Full MCP access; white-label fields are read-write on Pro/Agency

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BRANDKITY_API_KEY` | Yes | — | Personal Access Token (`bk_live_...`) |
| `BRANDKITY_API_URL` | No | `https://brandkity.com` | API base URL (for local dev) |

## Typical Workflow

```
1. get_workspace       → verify connection, check plan and storage
2. list_kits           → confirm kit doesn't already exist
3. create_kit          → returns kit_id
4. ensure_block        → idempotent: returns existing block_id or creates a new one (for each block type)
5. add_colors          → populate the Colors block
6. add_typography      → populate the Typography block
7. upload_file         → upload font/logo/cover files to workspace storage
8. upload_asset        → upload logos, images, videos into blocks
9. set_brand_story     → write the brand story in a rich_text block
10. set_block_note     → add usage guidance to any block
11. publish_kit        → make the portal live
```

## Reliability Notes (v1.4.0)

- **No duplicate blocks** — `ensure_block` is idempotent. Re-running a workflow never creates duplicate blocks.
- **Auto-retry on uploads** — `upload_asset` and `upload_file` retry up to 3 times on network errors with exponential backoff.
- **Size-aware timeouts** — Upload timeout scales with file size (60 s base + 20 s per 10 MB, max 10 min). Large files like 64 MB video assets are handled reliably.
- **Batch deduplication** — `upload_assets_batch` silently skips duplicate `file_path` entries so the same file is never uploaded twice in one batch.
- **Agent instructions** — The server now provides operating rules to AI clients at connection time, reducing duplicate operations from AI agents automatically.
- **White-label URL resolution** — CDN URLs in white-label fields are automatically resolved to asset IDs server-side; agents don't need to manage asset IDs directly.
- **Storage tracking** — All file uploads are tracked per workspace for accurate quota enforcement.

## License

MIT
