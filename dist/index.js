#!/usr/bin/env node
/**
 * BrandKity MCP Server
 *
 * Model Context Protocol server that connects AI agents to the BrandKity
 * brand kit platform. Programmatically create, populate, and publish brand
 * kits from local assets — including fonts, images, videos, and documents.
 *
 * Tools registered (22 total):
 *   Workspace:  get_workspace
 *   Files:      upload_file, list_files
 *   Kits:       list_kits, create_kit, get_kit, update_kit, publish_kit, unpublish_kit
 *   Blocks:     list_blocks, ensure_block, add_block, update_block, delete_block
 *   Content:    add_colors, add_typography, set_brand_story, set_block_note
 *   Upload:     upload_asset, upload_assets_batch, upload_kit_logo, upload_cover_image
 *
 * Usage:
 *   BRANDKITY_API_KEY=bk_live_... node dist/index.js
 *
 * Configuration:
 *   BRANDKITY_API_KEY  (required) Personal Access Token from BrandKity dashboard Settings → API Keys
 *   BRANDKITY_API_URL  (optional) API base URL (default: https://brandkity.com)
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BrandKityClient } from './client.js';
import { registerBlockTools } from './tools/blocks.js';
import { registerContentTools } from './tools/content.js';
import { registerFileTools } from './tools/files.js';
import { registerKitTools } from './tools/kits.js';
import { registerUploadTools } from './tools/upload.js';
import { registerWorkspaceTools } from './tools/workspace.js';
// ── Configuration ──────────────────────────────────────────────────────────────
const API_KEY = process.env.BRANDKITY_API_KEY;
const API_URL = process.env.BRANDKITY_API_URL ?? 'https://brandkity.com';
if (!API_KEY) {
    console.error('❌ BRANDKITY_API_KEY environment variable is required.\n' +
        '   Generate one at: https://brandkity.com/dashboard/settings → API Keys tab');
    process.exit(1);
}
if (!API_KEY.startsWith('bk_live_')) {
    console.error('❌ Invalid API key format. Expected a key starting with "bk_live_".\n' +
        '   Generate one at: https://brandkity.com/dashboard/settings → API Keys tab');
    process.exit(1);
}
// ── Initialize ─────────────────────────────────────────────────────────────────
const client = new BrandKityClient(API_KEY, API_URL);
/**
 * Agent operating instructions — surfaced to AI clients as system-level
 * context so agents understand how to use BrandKity tools without creating
 * duplicates, retrying incorrectly, or uploading the same files twice.
 */
const AGENT_INSTRUCTIONS = `
BRANDKITY MCP — OPERATING RULES (v1.3.0)
Read these rules before calling any tool. They prevent duplicate data,
failed uploads, and wasted API calls.

BLOCK CREATION
- Use ensure_block instead of add_block in all normal workflows.
  ensure_block is idempotent: it returns the existing block_id if a block
  of that type already exists, and only creates a new block if none exists.
- Each kit supports exactly one block per type
  (one colors block, one typography block, etc.).
- NEVER call add_block if list_blocks already shows a block of that type.
- After any error during block creation, call list_blocks BEFORE retrying —
  the block may have been created despite the error response.

KIT CREATION
- Before calling create_kit, call list_kits to confirm no kit with the same
  name already exists. If it exists, use its ID instead of creating another.

FILE UPLOADS
- Never pass the same file_path more than once in upload_assets_batch.
  Duplicates are filtered out automatically, but avoid them in the plan.
- If an upload fails with a 4xx error (400, 403, 413, 415…), do NOT retry.
  The error is in the input: wrong path, unsupported format, or plan limit reached.
- If an upload fails with a network or timeout error, retry once.
  The file may not have been stored — call list_files to check first.
- Large files (> 50 MB) should be uploaded individually with upload_asset,
  not in large batches, to avoid batch-level timeout failures.
- upload_asset and upload_file both auto-retry on transient network errors.

SAFE WORKFLOW ORDER (recommended for every new kit)
1. get_workspace         — verify auth, check plan and storage
2. list_kits             — find existing kit or confirm name is available
3. create_kit            — only if kit does not already exist
4. ensure_block          — for each block type needed (idempotent, safe to re-run)
5. add_colors            — populate colors block
6. add_typography        — populate typography block
7. set_brand_story       — populate rich_text block
8. upload_asset / upload_assets_batch  — upload files into file-based blocks
9. set_block_note        — add editorial notes to each block
10. upload_kit_logo      — optional: set the kit header logo
11. publish_kit          — only when the kit is complete
`.trim();
const server = new McpServer({
    name: 'brandkity',
    version: '1.3.0',
}, {
    instructions: AGENT_INSTRUCTIONS,
});
// ── Register all tools ─────────────────────────────────────────────────────────
registerWorkspaceTools(server, client); // get_workspace
registerFileTools(server, client); // upload_file, list_files
registerKitTools(server, client); // list_kits, create_kit, get_kit, update_kit, publish_kit, unpublish_kit
registerBlockTools(server, client); // list_blocks, add_block, update_block, delete_block
registerContentTools(server, client); // add_colors, add_typography, set_brand_story, set_block_note
registerUploadTools(server, client); // upload_asset, upload_assets_batch, upload_kit_logo, upload_cover_image
// ── Start server ───────────────────────────────────────────────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    console.error('Failed to start BrandKity MCP server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map