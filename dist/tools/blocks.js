/**
 * Block tools — add_block, update_block, delete_block, list_blocks
 */
import { z } from 'zod';
export function registerBlockTools(server, client) {
    // ── list_blocks ──────────────────────────────────────────────────────────────
    server.tool('list_blocks', 'List all blocks in a kit with their IDs, types, names, and visibility. Use to find block_ids before adding content.', {
        kit_id: z.string().describe('Kit UUID'),
    }, async ({ kit_id }) => {
        try {
            const blocks = await client.listBlocks(kit_id);
            return { content: [{ type: 'text', text: JSON.stringify(blocks, null, 2) }] };
        }
        catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
                isError: true,
            };
        }
    });
    // ── add_block ────────────────────────────────────────────────────────────────
    server.tool('add_block', [
        'Add a new content block to a kit. Returns the block_id needed for adding content.',
        'Block types:',
        '• colors — brand palette swatches (use add_colors)',
        '• typography — font entries (use add_typography)',
        '• rich_text — brand story / guidelines text (use set_brand_story)',
        '• logos — logo variants uploaded as SVG/PNG (use upload_asset with block_type=logos)',
        '• visuals — brand photography / illustrations (use upload_asset with block_type=visuals)',
        '• videos — brand video assets (use upload_asset with block_type=videos)',
        '• icons — SVG icon library (use upload_asset with block_type=icons)',
        '• collaterals — downloadable files like PDFs (use upload_asset with block_type=collaterals)',
        '• resources — source files, Figma, ZIPs (use upload_asset with block_type=resources)',
    ].join(' '), {
        kit_id: z.string().describe('Kit UUID'),
        type: z
            .enum([
            'colors',
            'typography',
            'logos',
            'visuals',
            'videos',
            'icons',
            'collaterals',
            'resources',
            'rich_text',
        ])
            .describe('Block type'),
        name: z
            .string()
            .optional()
            .describe('Custom display name for the block. Defaults to the type label.'),
    }, async ({ kit_id, type, name }) => {
        try {
            const block = await client.addBlock(kit_id, type, name);
            return { content: [{ type: 'text', text: JSON.stringify(block, null, 2) }] };
        }
        catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
                isError: true,
            };
        }
    });
    // ── update_block ─────────────────────────────────────────────────────────────
    server.tool('update_block', "Update a block's name or visibility. To set the block note, use set_block_note instead.", {
        kit_id: z.string().describe('Kit UUID'),
        block_id: z.string().describe('Block UUID'),
        name: z.string().optional().describe('New display name for the block'),
        is_visible: z.boolean().optional().describe('Whether the block is visible in the portal'),
    }, async ({ kit_id, block_id, name, is_visible }) => {
        try {
            const data = {};
            if (name !== undefined)
                data.name = name;
            if (is_visible !== undefined)
                data.is_visible = is_visible;
            const result = await client.updateBlock(kit_id, block_id, data);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
        catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
                isError: true,
            };
        }
    });
    // ── delete_block ─────────────────────────────────────────────────────────────
    server.tool('delete_block', 'Permanently delete a block and all its content from a kit. This cannot be undone.', {
        kit_id: z.string().describe('Kit UUID'),
        block_id: z.string().describe('Block UUID to delete'),
    }, async ({ kit_id, block_id }) => {
        try {
            const result = await client.deleteBlock(kit_id, block_id);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
        catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=blocks.js.map