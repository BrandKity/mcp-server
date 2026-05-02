# Changelog

All notable changes to the BrandKity MCP Server are documented here.

## [1.4.0] - 2026-05-02

### Added
- **White-Label Support (Pro+)**: New fields for `update_kit` tool:
  - `og_title` — Custom SEO title for social share (max 100 chars)
  - `og_description` — Custom SEO description (max 300 chars)
  - `og_image_url` — Custom social share image URL (resolved to asset ID server-side)
  - `custom_favicon_url` — Custom favicon URL for browser tab (resolved to asset ID server-side)
- **URL-to-Asset Resolution**: Both URL fields are automatically resolved to asset IDs on the server, so agents don't need to manage asset IDs directly
- **Storage Tracking**: All file uploads now register in workspace storage, enabling accurate quota enforcement
- **RPC Function**: New `sum_kit_views(kit_ids uuid[])` for efficient dashboard analytics

### Fixed
- White-label asset FK now correctly points to `workspace_assets` instead of legacy `files` table
- URL resolution queries now use correct table (`workspace_assets`) and columns (`r2_url`)
- Portal metadata generation now uses admin client to bypass RLS for public favicon/OG image resolution
- Dashboard performance: eliminated JS reduce over all rows; now uses `sum_kit_views` RPC

### Changed
- `update_kit` tool now accepts URL-based white-label fields for convenience (no need to upload separately)
- Agent operating instructions updated to document white-label fields and Pro+ plan requirement

## [1.3.2] - 2026-04-15

### Fixed
- Improved error handling for network timeouts
- Better retry logic for large file uploads

## [1.3.0] - 2026-03-01

### Added
- Initial MCP server implementation
- 22 tools for kit, block, and file management
- Presigned R2 upload URLs
- Idempotent block operations
- Batch file upload with deduplication
- Agent operating instructions

### Features
- Auto-retry on network errors
- Size-aware upload timeouts
- Comprehensive error messages
- Rate limiting support
