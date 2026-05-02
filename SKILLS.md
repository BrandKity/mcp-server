# BrandKity MCP Server — Skills & Capabilities

This document describes the skills and capabilities of the BrandKity MCP Server for use by AI agents and LLMs.

## Core Capabilities

### 1. Brand Kit Management

**Skill**: Create, read, update, and delete brand kits

**Tools**:
- `create_kit` — Create a new kit with initial settings
- `get_kit` — Fetch a kit by ID
- `list_kits` — List all kits in the workspace
- `update_kit` — Modify kit settings
- `delete_kit` — Soft-delete a kit
- `publish_kit` — Make a kit public
- `unpublish_kit` — Make a kit private

**Use Cases**:
- Programmatically create brand kits from design specifications
- Update kit metadata and branding in bulk
- Manage kit lifecycle (draft → published → archived)

### 2. Block Management

**Skill**: Create, read, update, and delete content blocks within kits

**Tools**:
- `create_block` — Add a new block to a kit
- `get_block` — Fetch a block by ID
- `list_blocks` — List all blocks in a kit
- `update_block` — Modify block content and settings
- `delete_block` — Remove a block from a kit
- `reorder_blocks` — Change block order in the kit

**Supported Block Types**:
- `colors` — Color palette
- `typography` — Font definitions
- `icons` — Icon library
- `images` — Image gallery
- `videos` — Video gallery
- `links` — Link collection
- `rich_text` — Formatted text content
- `presentation_slider` — Carousel/slider
- `template` — Reusable template

**Use Cases**:
- Populate a kit with design system blocks
- Update color palettes or typography definitions
- Add media galleries or documentation

### 3. White-Label Branding (Pro+ Feature)

**Skill**: Customize portal appearance with custom favicon, social share image, and SEO metadata

**Tools**:
- `update_kit` with white-label fields:
  - `og_title` — Custom SEO title (max 100 chars)
  - `og_description` — Custom SEO description (max 300 chars)
  - `custom_favicon_url` — Custom favicon URL
  - `og_image_url` — Custom social share image URL

**Features**:
- **URL-to-Asset Resolution**: Pass CDN URLs directly; server automatically resolves to asset IDs
- **Plan Gating**: Enforced at API level; Free plans receive 403 error with upgrade guidance
- **Public Portal Rendering**: Favicon and OG image render on public portal pages

**Use Cases**:
- Brand a portal with custom favicon for client presentations
- Set SEO metadata for better social sharing
- Customize portal appearance per workspace/client

**Example**:
```typescript
await client.updateKit('kit-id', {
  og_title: 'Acme Corp Brand Guidelines',
  og_description: 'Official brand assets and standards',
  custom_favicon_url: 'https://cdn.example.com/favicon.ico',
  og_image_url: 'https://cdn.example.com/og-image.png',
});
```

### 4. File Management

**Skill**: Upload and manage files with presigned URLs

**Tools**:
- `get_presigned_upload_url` — Get a presigned R2 URL for direct upload
- `list_files` — List all files in the workspace
- `delete_file` — Remove a file
- `upload_file` — Upload a file directly

**Features**:
- **Presigned URLs**: Upload directly to R2 without exposing credentials
- **Storage Tracking**: All uploads tracked per workspace for quota enforcement
- **Workspace Scoping**: Files are scoped to workspace; no cross-workspace access

**Use Cases**:
- Upload large design files without server-side processing
- Manage workspace storage quota
- Reference files in white-label branding

### 5. Portal Settings & Access Control

**Skill**: Configure portal access modes, privacy rules, and analytics

**Tools**:
- `update_kit` with access fields:
  - `access_mode` — 'public', 'password', or 'email_otp'
  - `access_password` — Password for password-protected portals
  - `email_allowlist` — Array of allowed email addresses
- `get_portal_stats` — Fetch portal analytics (views, downloads, etc.)
- `get_portal_access_logs` — View access attempt logs

**Use Cases**:
- Restrict portal access to specific users
- Set up password-protected brand portals
- Monitor portal traffic and access patterns

### 6. Analytics & Reporting

**Skill**: Retrieve portal analytics and usage data

**Tools**:
- `get_portal_stats` — Portal views, downloads, unique visitors
- `get_portal_access_logs` — Access attempt history
- `list_kits` — Includes view counts per kit

**Use Cases**:
- Generate usage reports
- Track portal engagement
- Monitor access patterns

## Authentication & Authorization

### API Key Scopes

API keys support the following scopes:
- `read` — Read-only access to kits, blocks, and analytics
- `write` — Full read-write access

### Plan-Based Feature Gating

Some features are restricted by workspace plan:

| Feature | Free | Starter | Pro | Agency |
|---------|------|---------|-----|--------|
| Kits | 1 | 5 | Unlimited | Unlimited |
| White-Label | ✗ | ✗ | ✓ | ✓ |
| Custom Domains | ✗ | ✗ | 1 | 5 |
| Portal Privacy | ✗ | ✓ | ✓ | ✓ |
| Storage | 500 MB | 2 GB | 10 GB | 50 GB |

## Error Handling

All tools return structured errors:

```typescript
{
  error: {
    code: 'PLAN_LIMIT_EXCEEDED',
    message: 'White-label requires Pro plan',
    status: 403,
    details: {
      feature: 'white_label',
      required_plan: 'pro',
      current_plan: 'free',
    },
  },
}
```

## Rate Limiting

- **Default**: 100 requests per minute per API key
- **Burst**: Up to 200 requests per minute for short bursts
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Idempotency

All write operations support idempotency keys:

```typescript
await client.updateKit('kit-id', {
  name: 'Updated Kit',
}, {
  idempotencyKey: 'unique-request-id',
});
```

If the same idempotency key is used within 24 hours, the server returns the cached response.

## Best Practices

1. **Use Presigned URLs for Large Files**: Don't upload files through the API; use presigned URLs for direct R2 uploads
2. **Batch Operations**: Use `list_kits` and `list_blocks` to fetch data in bulk rather than individual requests
3. **Handle Plan Limits Gracefully**: Check plan limits before attempting Pro+ features; provide upgrade guidance
4. **Implement Retry Logic**: Use idempotency keys for safe retries on network failures
5. **Monitor Rate Limits**: Check `X-RateLimit-Remaining` header and implement backoff

## Troubleshooting

### "White-label requires Pro plan"

The workspace is on a Free or Starter plan. Upgrade to Pro or Agency to use white-label features.

### "Asset not found"

The URL provided in `custom_favicon_url` or `og_image_url` doesn't exist in workspace storage. Ensure the file was uploaded successfully and the URL is correct.

### "Rate limit exceeded"

Too many requests in a short time. Implement exponential backoff and retry after the time specified in `X-RateLimit-Reset` header.

## Support

For issues or questions, contact support@brandkity.com or open an issue on GitHub.
