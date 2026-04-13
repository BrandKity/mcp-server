/**
 * Upload tools — upload_asset, upload_kit_logo, upload_cover_image
 *
 * upload_asset: Upload files directly into kit blocks (logos, visuals, videos, icons, collaterals, resources).
 * upload_kit_logo & upload_cover_image: Upload to workspace storage, then set the URL on the kit.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BrandKityClient } from '../client.js';
export declare function registerUploadTools(server: McpServer, client: BrandKityClient): void;
//# sourceMappingURL=upload.d.ts.map