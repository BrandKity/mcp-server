# BrandKity MCP Server — API Reference

## Authentication

All requests require an API key in the `Authorization` header:

```
Authorization: Bearer your-api-key-here
```

## Base URL

```
https://brandkity.com/api/mcp
```

## Tools

### Kit Management

#### `create_kit`

Create a new brand kit.

**Parameters**:
- `name` (string, required) — Kit name
- `accent_color` (string, required) — Hex color code (e.g., '#E55B00')
- `template` (string, optional) — Template type ('minimal', 'editorial', 'corporate', 'dark_studio', 'glass', 'bento', 'presentation', 'slider')
- `tagline` (string, optional) — Short subtitle for portal header

**Returns**:
```typescript
{
  id: string;
  name: string;
  slug: string;
  workspace_id: string;
  created_at: string;
}
```

**Example**:
```typescript
const kit = await client.createKit({
  name: 'Acme Corp Brand Kit',
  accent_color: '#FF6B35',
  template: 'corporate',
  tagline: 'Official brand guidelines',
});
```

---

#### `update_kit`

Update kit settings and white-label branding.

**Parameters**:
- `kit_id` (string, required) — Kit ID
- `name` (string, optional) — Kit name
- `accent_color` (string, optional) — Hex color code
- `template` (string, optional) — Template type
- `tagline` (string, optional) — Portal subtitle
- `logo_url` (string, optional) — CDN URL for kit header logo
- `cover_image_url` (string, optional) — CDN URL for kit cover image
- `og_title` (string, optional, Pro+ only) — SEO title (max 100 chars)
- `og_description` (string, optional, Pro+ only) — SEO description (max 300 chars)
- `og_image_url` (string, optional, Pro+ only) — CDN URL for social share image
- `custom_favicon_url` (string, optional, Pro+ only) — CDN URL for favicon

**Returns**:
```typescript
{
  id: string;
  name: string;
  og_title: string | null;
  og_description: string | null;
  custom_favicon_asset_id: string | null;
  og_image_asset_id: string | null;
  updated_at: string;
}
```

**Example**:
```typescript
const updated = await client.updateKit('kit-id', {
  og_title: 'Acme Corp Brand Guidelines',
  og_description: 'Official brand assets and standards',
  custom_favicon_url: 'https://cdn.example.com/favicon.ico',
  og_image_url: 'https://cdn.example.com/og-image.png',
});
```

**Errors**:
- `403 PLAN_LIMIT_EXCEEDED` — White-label requires Pro plan
- `404 NOT_FOUND` — Kit not found
- `400 VALIDATION_ERROR` — Invalid field values

---

#### `get_kit`

Fetch a kit by ID.

**Parameters**:
- `kit_id` (string, required) — Kit ID

**Returns**:
```typescript
{
  id: string;
  name: string;
  slug: string;
  description: string | null;
  accent_color: string;
  og_title: string | null;
  og_description: string | null;
  custom_favicon_asset_id: string | null;
  og_image_asset_id: string | null;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}
```

---

#### `list_kits`

List all kits in the workspace.

**Parameters**:
- `status` (string, optional) — Filter by 'draft', 'published', or 'all' (default: 'all')

**Returns**:
```typescript
{
  kits: Array<{
    id: string;
    name: string;
    slug: string;
    is_published: boolean;
    view_count: number;
    created_at: string;
  }>;
  total: number;
}
```

---

#### `publish_kit`

Publish a kit to make it public.

**Parameters**:
- `kit_id` (string, required) — Kit ID

**Returns**:
```typescript
{
  id: string;
  is_published: true;
  published_at: string;
  public_url: string;
}
```

---

#### `unpublish_kit`

Unpublish a kit to make it private.

**Parameters**:
- `kit_id` (string, required) — Kit ID

**Returns**:
```typescript
{
  id: string;
  is_published: false;
}
```

---

### Block Management

#### `list_blocks`

List all blocks in a kit.

**Parameters**:
- `kit_id` (string, required) — Kit ID

**Returns**:
```typescript
{
  blocks: Array<{
    id: string;
    kit_id: string;
    type: string;
    name: string;
    order: number;
  }>;
}
```

---

#### `ensure_block`

Idempotent block creation — returns existing block if it exists, otherwise creates a new one.

**Parameters**:
- `kit_id` (string, required) — Kit ID
- `type` (string, required) — Block type
- `name` (string, required) — Block name

**Returns**:
```typescript
{
  id: string;
  kit_id: string;
  type: string;
  name: string;
  order: number;
  created: boolean; // true if newly created, false if already existed
}
```

---

#### `add_block`

Add a new block unconditionally (use `ensure_block` to prevent duplicates).

**Parameters**:
- `kit_id` (string, required) — Kit ID
- `type` (string, required) — Block type
- `name` (string, required) — Block name

**Returns**:
```typescript
{
  id: string;
  kit_id: string;
  type: string;
  name: string;
  order: number;
}
```

---

#### `update_block`

Update a block's name or visibility.

**Parameters**:
- `block_id` (string, required) — Block ID
- `name` (string, optional) — New block name
- `visible` (boolean, optional) — Show/hide block

**Returns**:
```typescript
{
  id: string;
  updated_at: string;
}
```

---

#### `delete_block`

Delete a block and all its content.

**Parameters**:
- `block_id` (string, required) — Block ID

**Returns**:
```typescript
{
  id: string;
  deleted_at: string;
}
```

---

### File Management

#### `upload_file`

Upload a file to workspace storage.

**Parameters**:
- `filename` (string, required) — File name
- `file` (Buffer, required) — File content
- `contentType` (string, optional) — MIME type

**Returns**:
```typescript
{
  id: string;
  filename: string;
  url: string; // CDN URL
  size_bytes: number;
  uploaded_at: string;
}
```

**Example**:
```typescript
const result = await client.uploadFile('favicon.ico', faviconBuffer, 'image/x-icon');
console.log(result.url); // https://cdn.brandkity.com/...
```

---

#### `list_files`

List all files in the workspace.

**Parameters**:
- `type` (string, optional) — Filter by file type (e.g., 'image', 'video', 'font')
- `limit` (number, optional) — Max results (default: 50)
- `offset` (number, optional) — Pagination offset (default: 0)

**Returns**:
```typescript
{
  files: Array<{
    id: string;
    filename: string;
    file_size_bytes: number;
    r2_url: string;
    uploaded_at: string;
  }>;
  total: number;
}
```

---

### Content Management

#### `add_colors`

Add color swatches to a Colors block.

**Parameters**:
- `block_id` (string, required) — Block ID
- `colors` (array, required) — Array of color objects:
  - `name` (string) — Color name
  - `hex` (string) — Hex color code
  - `description` (string, optional) — Usage description

**Returns**:
```typescript
{
  block_id: string;
  colors_added: number;
}
```

---

#### `add_typography`

Add font entries to a Typography block.

**Parameters**:
- `block_id` (string, required) — Block ID
- `fonts` (array, required) — Array of font objects:
  - `name` (string) — Font name
  - `family` (string) — Font family
  - `weight` (string) — Font weight (e.g., '400', '700')
  - `usage` (string, optional) — Usage context (e.g., 'Headings', 'Body')

**Returns**:
```typescript
{
  block_id: string;
  fonts_added: number;
}
```

---

#### `set_brand_story`

Set rich text content for a block.

**Parameters**:
- `block_id` (string, required) — Block ID
- `content` (string, required) — HTML or markdown content

**Returns**:
```typescript
{
  block_id: string;
  content_length: number;
}
```

---

#### `set_block_note`

Set the editorial note displayed above a block.

**Parameters**:
- `block_id` (string, required) — Block ID
- `note` (string, required) — Note text

**Returns**:
```typescript
{
  block_id: string;
  note_set: true;
}
```

---

### Analytics

#### `get_portal_stats`

Fetch portal analytics for a kit.

**Parameters**:
- `kit_id` (string, required) — Kit ID
- `days` (number, optional) — Days to look back (default: 30)

**Returns**:
```typescript
{
  kit_id: string;
  total_views: number;
  unique_visitors: number;
  total_downloads: number;
  daily_stats: Array<{
    date: string;
    views: number;
    unique_visitors: number;
    downloads: number;
  }>;
}
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `PLAN_LIMIT_EXCEEDED` | 403 | Feature requires higher plan |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input parameters |
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

All endpoints are rate-limited:

- **Default**: 100 requests per minute per API key
- **Burst**: Up to 200 requests per minute for short bursts

Response headers include:
- `X-RateLimit-Limit` — Requests per minute
- `X-RateLimit-Remaining` — Requests remaining
- `X-RateLimit-Reset` — Unix timestamp when limit resets

---

## Idempotency

Write operations support idempotency keys to safely retry failed requests:

```typescript
await client.updateKit('kit-id', {
  name: 'Updated Kit',
}, {
  idempotencyKey: 'unique-request-id',
});
```

If the same key is used within 24 hours, the server returns the cached response.

---

## Pagination

List endpoints support pagination:

```typescript
const page1 = await client.listFiles({ limit: 50, offset: 0 });
const page2 = await client.listFiles({ limit: 50, offset: 50 });
```

---

## Support

For issues or questions, contact support@brandkity.com or open an issue on GitHub.
