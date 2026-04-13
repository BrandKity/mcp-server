/**
 * Content tools — add_colors, add_typography, set_brand_story, set_block_note
 *
 * These tools target dedicated per-block-type API endpoints.
 * File-based blocks (logos, visuals, videos, icons, collaterals, resources)
 * are handled by the upload tools (upload_asset).
 */
import { z } from 'zod';
export function registerContentTools(server, client) {
    // ── add_colors ──────────────────────────────────────────────────────────────
    server.tool('add_colors', [
        'Add color swatches to a Colors block.',
        'Valid fields per swatch: name (required), hex (required, #rrggbb), rgb ("R, G, B"), cmyk ("C, M, Y, K"), pantone.',
        'There is NO usage field on color swatches — put usage guidance in the block note via set_block_note instead.',
    ].join(' '), {
        kit_id: z.string().describe('Kit UUID'),
        block_id: z.string().describe('Block UUID (must be a colors block)'),
        colors: z
            .array(z.object({
            name: z.string().describe("Color name, e.g. 'Electric Blue'"),
            hex: z.string().describe("Hex value in #rrggbb format, e.g. '#0066FF'"),
            rgb: z
                .string()
                .optional()
                .describe("RGB as comma-separated string, e.g. '0, 102, 255'"),
            cmyk: z
                .string()
                .optional()
                .describe("CMYK as comma-separated string, e.g. '100, 60, 0, 0'"),
            pantone: z.string().optional().describe("Pantone name, e.g. '2728 C'"),
        }))
            .describe('Array of color swatches to add (max 50)'),
    }, async ({ kit_id, block_id, colors }) => {
        try {
            const result = await client.addColors(kit_id, block_id, colors);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
        catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
                isError: true,
            };
        }
    });
    // ── add_typography ──────────────────────────────────────────────────────────
    server.tool('add_typography', [
        'Add font entries to a Typography block.',
        'Four sources are supported:',
        '(1) "Google Fonts" — provide font_family, weights, usage. Fully automated.',
        '(2) "Adobe Fonts" — provide font_family + asset_url (Typekit CSS URL from fonts.adobe.com → Web Projects → Get embed code).',
        '(3) "Custom" — first upload the font file using upload_file tool, then pass asset_url (the returned URL) here.',
        '(4) "System" — provide font_family only (font must be available on the OS).',
    ].join(' '), {
        kit_id: z.string().describe('Kit UUID'),
        block_id: z.string().describe('Block UUID (must be a typography block)'),
        fonts: z
            .array(z.object({
            font_family: z.string().describe("Font family name, e.g. 'Inter'"),
            source: z
                .enum(['Google Fonts', 'Adobe Fonts', 'Custom', 'System'])
                .describe('Font source'),
            weights: z
                .array(z.number())
                .optional()
                .describe('Font weights, e.g. [400, 500, 700]. Defaults to [400].'),
            usage: z
                .string()
                .optional()
                .describe("Role of this font. One of: 'Headings', 'Body text', 'Display', 'Caption', 'UI'"),
            preview_text: z.string().optional().describe('Custom preview text'),
            asset_url: z
                .string()
                .url()
                .optional()
                .describe('For Custom source: URL from upload_file tool. For Adobe Fonts: Typekit CSS URL (https://use.typekit.net/xxx.css).'),
        }))
            .describe('Array of font entries to add (max 20)'),
    }, async ({ kit_id, block_id, fonts }) => {
        try {
            const result = await client.addTypography(kit_id, block_id, fonts);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
        catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
                isError: true,
            };
        }
    });
    // ── set_brand_story ─────────────────────────────────────────────────────────
    server.tool('set_brand_story', "Set the content of a Rich Text block. Use for brand story, tone of voice, brand values, do's & don'ts extracted from guidelines documents. Accepts plain text or basic HTML.", {
        kit_id: z.string().describe('Kit UUID'),
        block_id: z.string().describe('Block UUID (must be a rich_text block)'),
        content: z
            .string()
            .describe('The text or HTML content. Plain text and <p>, <b>, <i>, <ul>, <li> tags are supported.'),
    }, async ({ kit_id, block_id, content }) => {
        try {
            const result = await client.setBrandStory(kit_id, block_id, content);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
        catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
                isError: true,
            };
        }
    });
    // ── set_block_note ──────────────────────────────────────────────────────────
    server.tool('set_block_note', [
        'Set the sticky editorial note on any block (the "Block note" editor visible at the top of every block in the dashboard).',
        'Use this for usage guidance, rules, or context that applies to the whole block.',
        'For colors: "Electric Blue is always the primary CTA colour."',
        'For typography: "Never use Outfit below 600 weight."',
        'For logos: "Always use the SVG version on digital. Use reversed on dark backgrounds."',
    ].join(' '), {
        kit_id: z.string().describe('Kit UUID'),
        block_id: z.string().describe('Block UUID (any block type)'),
        note: z.string().describe('The note text to display above the block content.'),
    }, async ({ kit_id, block_id, note }) => {
        try {
            const result = await client.setBlockNote(kit_id, block_id, note);
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
//# sourceMappingURL=content.js.map