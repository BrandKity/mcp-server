/**
 * Kit tools — list_kits, create_kit, get_kit, update_kit, publish_kit, unpublish_kit
 */
import { z } from 'zod';
export function registerKitTools(server, client) {
    // ── list_kits ──
    server.tool('list_kits', 'List all brand kits in the workspace. Optionally filter by status (draft, published, or all).', {
        status: z
            .enum(['draft', 'published', 'all'])
            .optional()
            .describe('Filter kits by status. Default: all'),
    }, async ({ status }) => {
        try {
            const kits = await client.listKits(status);
            return {
                content: [{ type: 'text', text: JSON.stringify(kits, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [
                    { type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
                ],
                isError: true,
            };
        }
    });
    // ── create_kit ──
    server.tool('create_kit', 'Create a new brand kit. Returns the kit ID needed for subsequent operations like adding blocks and uploading assets.', {
        name: z.string().describe("The brand's name, e.g. 'Acme Corp'"),
        accent_color: z.string().describe("Primary brand color as hex, e.g. '#E55B00'"),
        template: z
            .enum([
            'minimal',
            'editorial',
            'corporate',
            'dark_studio',
            'glass',
            'bento',
            'presentation',
            'slider',
        ])
            .optional()
            .describe("Portal template. Default: 'minimal'"),
        tagline: z
            .string()
            .optional()
            .describe("Short subtitle shown in the portal header, e.g. 'Modern solutions for modern businesses'"),
    }, async ({ name, accent_color, template, tagline }) => {
        try {
            const kit = await client.createKit({
                name,
                accent_color,
                ...(template ? { template } : {}),
                ...(tagline ? { tagline } : {}),
            });
            return {
                content: [{ type: 'text', text: JSON.stringify(kit, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [
                    { type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
                ],
                isError: true,
            };
        }
    });
    // ── get_kit ──
    server.tool('get_kit', "Fetch a kit's full data including all blocks and their content.", {
        kit_id: z.string().describe('Kit UUID'),
    }, async ({ kit_id }) => {
        try {
            const data = await client.getKit(kit_id);
            return {
                content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [
                    { type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
                ],
                isError: true,
            };
        }
    });
    // ── update_kit ──
    server.tool('update_kit', "Update a kit's top-level settings like name, accent color, template, tagline, logo, cover image, or white-label meta/favicon (Pro+). For logo_url and cover_image_url, pass CDN URLs returned by upload_file or upload_asset. For og_image_url and custom_favicon_url, pass CDN URLs from upload_file.", {
        kit_id: z.string().describe('Kit UUID'),
        name: z.string().optional().describe('New kit name'),
        accent_color: z.string().optional().describe('New accent color as hex'),
        template: z
            .enum([
            'minimal',
            'editorial',
            'corporate',
            'dark_studio',
            'glass',
            'bento',
            'presentation',
            'slider',
        ])
            .optional()
            .describe('New template'),
        tagline: z.string().optional().describe('New tagline'),
        logo_url: z
            .string()
            .optional()
            .describe('CDN URL for the kit header logo (from upload_file or upload_asset). Set to empty string to remove.'),
        cover_image_url: z
            .string()
            .optional()
            .describe('CDN URL for the kit cover/hero image (from upload_file or upload_asset). Set to empty string to remove.'),
        // White-label fields (Pro+ only)
        og_title: z
            .string()
            .nullable()
            .optional()
            .describe('(Pro+) Custom page title used in browser tab and social sharing. Pass null to reset to kit name.'),
        og_description: z
            .string()
            .nullable()
            .optional()
            .describe('(Pro+) Custom meta description for search results and social sharing. Pass null to reset.'),
        og_image_url: z
            .string()
            .optional()
            .describe('(Pro+) CDN URL for the custom social share / OG image (from upload_file). Set to empty string to remove.'),
        custom_favicon_url: z
            .string()
            .optional()
            .describe('(Pro+) CDN URL for a custom browser tab favicon (from upload_file). Accepts ICO, PNG, or SVG. Set to empty string to remove.'),
    }, async ({ kit_id, name, accent_color, template, tagline, logo_url, cover_image_url, og_title, og_description, og_image_url, custom_favicon_url }) => {
        try {
            const updateData = {};
            if (name)
                updateData.name = name;
            if (accent_color)
                updateData.accent_color = accent_color;
            if (template)
                updateData.template = template;
            if (tagline !== undefined)
                updateData.tagline = tagline;
            if (logo_url !== undefined)
                updateData.logo_url = logo_url || null;
            if (cover_image_url !== undefined)
                updateData.cover_image_url = cover_image_url || null;
            // White-label fields
            if (og_title !== undefined)
                updateData.og_title = og_title;
            if (og_description !== undefined)
                updateData.og_description = og_description;
            if (og_image_url !== undefined)
                updateData.og_image_url = og_image_url;
            if (custom_favicon_url !== undefined)
                updateData.custom_favicon_url = custom_favicon_url;
            const result = await client.updateKit(kit_id, updateData);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [
                    { type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
                ],
                isError: true,
            };
        }
    });
    // ── publish_kit ──
    server.tool('publish_kit', 'Publish a kit, making its portal publicly accessible. Returns the public URL.', {
        kit_id: z.string().describe('Kit UUID'),
    }, async ({ kit_id }) => {
        try {
            const result = await client.publishKit(kit_id);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [
                    { type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
                ],
                isError: true,
            };
        }
    });
    // ── unpublish_kit ──
    server.tool('unpublish_kit', 'Unpublish a kit, taking it offline. The kit remains in draft and can be re-published later.', {
        kit_id: z.string().describe('Kit UUID'),
    }, async ({ kit_id }) => {
        try {
            const result = await client.unpublishKit(kit_id);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [
                    { type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
                ],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=kits.js.map