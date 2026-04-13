/**
 * Upload tools — upload_asset, upload_kit_logo, upload_cover_image
 *
 * upload_asset: Upload files directly into kit blocks (logos, visuals, videos, icons, collaterals, resources).
 * upload_kit_logo & upload_cover_image: Upload to workspace storage, then set the URL on the kit.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { BrandKityClient } from '../client.js'

export function registerUploadTools(
  server: McpServer,
  client: BrandKityClient
): void {
  // ── upload_asset ──
  server.tool(
    'upload_asset',
    [
      'Upload a file from the local filesystem into a block in BrandKity.',
      'Use for: logos (SVG/PNG/JPG), visuals (brand photos), videos (MP4/WebM),',
      'icons (SVG only), collaterals (PDF/images), and resources (ZIPs, source files).',
      'For custom font files, use upload_file → add_typography(asset_url) instead.',
    ].join(' '),
    {
      kit_id: z.string().describe('Kit UUID'),
      block_id: z.string().describe('Block UUID'),
      file_path: z
        .string()
        .describe(
          "Absolute path to the local file, e.g. '/Users/jane/Projects/AcmeCorp/logos/acme-primary.svg'"
        ),
      block_type: z
        .enum(['logos', 'visuals', 'videos', 'collaterals', 'resources', 'icons'])
        .describe('Target block type (used for MIME validation and storage path)'),
      variant_name: z
        .string()
        .optional()
        .describe(
          'For logos blocks only — the logo variant slot name, e.g. "Primary", "Horizontal", "Icon Mark", "Mono", "Reversed". Defaults to first empty slot.'
        ),
      collateral_title: z
        .string()
        .optional()
        .describe('For collaterals blocks only — the display title'),
      collateral_description: z
        .string()
        .optional()
        .describe('Optional description for collateral items'),
      resource_label: z
        .string()
        .optional()
        .describe('For resources blocks only — the display label, e.g. "Figma Source File"'),
      resource_category: z
        .string()
        .optional()
        .describe('Category grouping for the resource, e.g. "Source Files"'),
    },
    async ({
      kit_id,
      block_id,
      file_path,
      block_type,
      variant_name,
      collateral_title,
      collateral_description,
      resource_label,
      resource_category,
    }) => {
      try {
        const result = await client.uploadAsset(kit_id, block_id, file_path, block_type, {
          variant_name,
          resource_label,
          resource_category,
          collateral_title,
          collateral_description,
        })
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error uploading ${file_path}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    }
  )

  // ── upload_kit_logo ──
  server.tool(
    'upload_kit_logo',
    [
      "Upload an image to set as the kit's main logo (shown in the portal header).",
      'This is different from the Logos block — this is the kit branding logo.',
      'Uploads the file to workspace storage and then sets logo_url on the kit.',
    ].join(' '),
    {
      kit_id: z.string().describe('Kit UUID'),
      file_path: z
        .string()
        .describe('Absolute path to the image file (SVG, PNG, JPG, WEBP)'),
    },
    async ({ kit_id, file_path }) => {
      try {
        // Step 1: Upload to workspace storage to get a CDN URL
        const uploaded = await client.uploadFile(file_path, 'logo,kit-branding')

        // Step 2: Set the kit's logo_url to the uploaded file's public URL
        await client.updateKit(kit_id, { logo_url: uploaded.url })

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  asset_id: uploaded.id,
                  public_url: uploaded.url,
                  file_name: uploaded.original_name,
                  file_size_bytes: uploaded.file_size_bytes,
                  message: 'Kit logo uploaded and set successfully',
                },
                null,
                2
              ),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    }
  )

  // ── upload_cover_image ──
  server.tool(
    'upload_cover_image',
    [
      "Upload an image to set as the kit's hero/cover image",
      '(shown at the top of the portal for supported templates).',
      'Uploads the file to workspace storage and then sets cover_image_url on the kit.',
    ].join(' '),
    {
      kit_id: z.string().describe('Kit UUID'),
      file_path: z
        .string()
        .describe('Absolute path to the image file'),
    },
    async ({ kit_id, file_path }) => {
      try {
        // Step 1: Upload to workspace storage to get a CDN URL
        const uploaded = await client.uploadFile(file_path, 'cover,kit-branding')

        // Step 2: Set the kit's cover_image_url to the uploaded file's public URL
        await client.updateKit(kit_id, { cover_image_url: uploaded.url })

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  asset_id: uploaded.id,
                  public_url: uploaded.url,
                  file_name: uploaded.original_name,
                  file_size_bytes: uploaded.file_size_bytes,
                  message: 'Cover image uploaded and set successfully',
                },
                null,
                2
              ),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    }
  )
}
