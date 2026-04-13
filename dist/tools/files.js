/**
 * File tools — upload_file, list_files
 *
 * Workspace-level file management. Use upload_file to get a URL for any file,
 * then pass that URL to add_typography (asset_url) or use it as a kit logo/cover.
 */
import { z } from 'zod';
export function registerFileTools(server, client) {
    // ── upload_file ─────────────────────────────────────────────────────────────
    server.tool('upload_file', [
        'Upload any file from the local filesystem to your BrandKity workspace storage (R2).',
        'Returns a public URL you can use in other tools.',
        'Common use cases:',
        '• Font files (.ttf, .otf, .woff, .woff2) → use returned URL in add_typography asset_url',
        '• Kit logo or cover image → use returned URL in update_kit logo_url/cover_image_url',
        '• General brand assets → manage from your file library',
        'Supported: images (PNG, JPG, SVG, WebP), video (MP4, WebM), fonts (TTF/OTF/WOFF/WOFF2), documents (PDF, DOCX, PPTX), ZIP.',
    ].join(' '), {
        file_path: z
            .string()
            .describe("Absolute path to the local file, e.g. '/Users/jane/fonts/BrandFont-Regular.woff2'"),
        tags: z
            .string()
            .optional()
            .describe("Comma-separated tags to label this file, e.g. 'font,brand,primary'"),
    }, async ({ file_path, tags }) => {
        try {
            const result = await client.uploadFile(file_path, tags);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error uploading ${file_path}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // ── list_files ──────────────────────────────────────────────────────────────
    server.tool('list_files', "List files in your workspace storage. Filter by type to find fonts, images, documents, etc. Returns public URLs for each file.", {
        type: z
            .enum(['all', 'font', 'image', 'video', 'document', 'icon', 'archive', 'other'])
            .optional()
            .default('all')
            .describe("Filter by file type. Use 'font' to find previously uploaded font files."),
        page: z.number().int().min(1).optional().default(1).describe('Page number'),
    }, async ({ type, page }) => {
        try {
            const result = await client.listFiles(type === 'all' ? undefined : type, page);
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
//# sourceMappingURL=files.js.map