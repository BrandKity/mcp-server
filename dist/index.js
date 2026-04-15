#!/usr/bin/env node
/**
 * BrandKity MCP Server
 *
 * Model Context Protocol server that connects AI agents to the BrandKity
 * brand kit platform. Programmatically create, populate, and publish brand
 * kits from local assets — including fonts, images, videos, and documents.
 *
 * Tools registered (21 total):
 *   Workspace:  get_workspace
 *   Files:      upload_file, list_files
 *   Kits:       list_kits, create_kit, get_kit, update_kit, publish_kit, unpublish_kit
 *   Blocks:     list_blocks, add_block, update_block, delete_block
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
const server = new McpServer({
    name: 'brandkity',
    version: '1.2.0',
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