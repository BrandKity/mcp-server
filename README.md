# @brandkity/mcp — BrandKity MCP Server

Model Context Protocol server for **BrandKity** — create and manage brand kits from any AI agent (Claude Desktop, Cursor, Windsurf, or any MCP-compatible client).

## Quick Start

### 1. Get an API Key

1. Sign in at [brandkity.com](https://brandkity.com)
2. Go to **Settings → API Keys**
3. Click **Generate New Key** and copy the key (`bk_live_...`)

> Requires a **Pro** or **Agency** plan for tool execution.

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

## Available Tools (18)

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
| `update_kit` | Update kit settings (name, color, template, logo_url, cover_image_url) |
| `publish_kit` | Publish a kit → returns public URL |
| `unpublish_kit` | Unpublish a kit (reverts to draft) |
| **Blocks** | |
| `list_blocks` | List all blocks in a kit with IDs and types |
| `add_block` | Add a content block (colors, typography, logos, etc.) |
| `update_block` | Update block name/visibility |
| `delete_block` | Permanently delete a block and all its content |
| **Content** | |
| `add_colors` | Add color swatches to a Colors block |
| `add_typography` | Add font entries to a Typography block |
| `set_brand_story` | Set rich text content (brand story, tone of voice) |
| `set_block_note` | Set the editorial note displayed above any block |
| **Upload** | |
| `upload_asset` | Upload a local file into a block (logos, visuals, videos, etc.) |
| `upload_kit_logo` | Upload and set the kit's header logo |
| `upload_cover_image` | Upload and set the kit's cover image |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BRANDKITY_API_KEY` | Yes | — | Personal Access Token (`bk_live_...`) |
| `BRANDKITY_API_URL` | No | `https://brandkity.com` | API base URL (for local dev) |

## Typical Workflow

```
1. get_workspace       → verify connection, check plan and storage
2. create_kit          → returns kit_id
3. add_block           → returns block_id (for each block type needed)
4. add_colors          → populate the Colors block
5. add_typography      → populate the Typography block
6. upload_file         → upload font/logo/cover files to workspace storage
7. upload_asset        → upload logos, images, videos into blocks
8. set_brand_story     → write the brand story in a rich_text block
9. set_block_note      → add usage guidance to any block
10. publish_kit        → make the portal live
```

## License

MIT
