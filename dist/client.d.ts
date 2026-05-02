/**
 * BrandKity API Client
 *
 * Authenticated HTTP client for the BrandKity public API.
 * Used by all MCP tools to communicate with the platform.
 */
export declare class BrandKityClient {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string, baseUrl: string);
    /** 30-second timeout prevents AI agents from hanging on slow/unresponsive API. */
    private static readonly REQUEST_TIMEOUT_MS;
    /**
     * Calculate a proportional upload timeout based on file size.
     * Base: 60 s. Adds 20 s per 10 MB. Capped at 10 minutes.
     */
    private static uploadTimeout;
    /**
     * Upload helper with automatic retry on transient network failures and 5xx errors.
     * Rebuilds the FormData each attempt (the file is already in memory as a Buffer).
     * Does NOT retry on 4xx — those indicate bad input and should surface immediately.
     */
    private doUpload;
    private get headers();
    /**
     * Map common file extensions to MIME types for presigned upload requests.
     */
    private static guessContentType;
    /**
     * Safely parse JSON from a Response — falls back to plain text for error bodies
     * (e.g. "Request Entity Too Large" from Vercel's edge when body > 4.5 MB).
     */
    private static safeJsonOrText;
    private request;
    getWorkspace(): Promise<{
        name: string;
        slug: string;
        plan: string;
        kit_count: number;
        storage_used_bytes: number;
        storage_limit_bytes: number;
    }>;
    /**
     * Upload any local file to workspace R2 storage.
     * Returns a public URL immediately usable in other API calls.
     * Retries up to 3 times on transient network errors. Timeout scales with file size.
     */
    uploadFile(filePath: string, tags?: string): Promise<{
        id: string;
        url: string;
        file_type: string;
        mime_type: string;
        original_name: string;
        file_size_bytes: number;
        tags: string[];
        r2_key: string;
    }>;
    listFiles(type?: string, page?: number): Promise<{
        files: Array<{
            id: string;
            original_name: string;
            file_type: string;
            mime_type: string;
            r2_url: string;
            file_size_bytes: number;
            tags: string[];
            uploaded_at: string;
        }>;
        meta: {
            total: number;
            page: number;
            per_page: number;
            total_pages: number;
        };
    }>;
    listKits(status?: 'draft' | 'published' | 'all'): Promise<{
        id: string;
        name: string;
        slug: string;
        status: string;
        template: string;
        accent_color: string;
        created_at: string;
        public_url: string | null;
    }[]>;
    createKit(data: {
        name: string;
        accent_color: string;
        template?: string;
        tagline?: string;
    }): Promise<{
        id: string;
        name: string;
        slug: string;
        status: string;
        public_url: string;
    }>;
    getKit(kitId: string): Promise<{
        kit: Record<string, unknown>;
        blocks: Array<Record<string, unknown>>;
    }>;
    updateKit(kitId: string, data: {
        name?: string;
        accent_color?: string;
        template?: string;
        tagline?: string | null;
        logo_url?: string | null;
        cover_image_url?: string | null;
        og_title?: string | null;
        og_description?: string | null;
        og_image_url?: string | null;
        custom_favicon_url?: string | null;
    }): Promise<Record<string, unknown>>;
    publishKit(kitId: string): Promise<{
        status: string;
        public_url: string;
    }>;
    unpublishKit(kitId: string): Promise<{
        status: string;
    }>;
    listBlocks(kitId: string): Promise<Record<string, unknown>[]>;
    addBlock(kitId: string, type: string, name?: string): Promise<{
        block_id: string;
        type: string;
        name: string;
    }>;
    updateBlock(kitId: string, blockId: string, data: {
        name?: string;
        is_visible?: boolean;
        settings?: Record<string, unknown>;
    }): Promise<Record<string, unknown>>;
    deleteBlock(kitId: string, blockId: string): Promise<{
        deleted: boolean;
    }>;
    addColors(kitId: string, blockId: string, colors: Array<{
        name: string;
        hex: string;
        rgb?: string;
        cmyk?: string;
        pantone?: string;
    }>): Promise<{
        added: number;
    }>;
    addTypography(kitId: string, blockId: string, fonts: Array<{
        font_family: string;
        source: 'Google Fonts' | 'Adobe Fonts' | 'Custom' | 'System';
        weights?: number[];
        usage?: string;
        preview_text?: string;
        /**
         * For source "Custom": URL returned by uploadFile() for the font file.
         * For source "Adobe Fonts": Typekit CSS URL (https://use.typekit.net/xxx.css).
         */
        asset_url?: string;
    }>): Promise<{
        added: number;
    }>;
    setBrandStory(kitId: string, blockId: string, content: string): Promise<{
        updated: boolean;
    }>;
    /**
     * Set the block note (the "Block note" rich text editor visible above each block in the dashboard).
     * This is stored in data.settings.notes via the generic PATCH block endpoint.
     */
    setBlockNote(kitId: string, blockId: string, note: string): Promise<Record<string, unknown>>;
    /**
     * Upload a local file directly into a block (logo, visual, video, icon, collateral, resource).
     * Use upload_file for workspace-level uploads and typography font files.
     * Use upload_asset for block-embedded assets.
     *
     * Files ≥ 4 MB use a presigned R2 URL (3-step: presign → PUT → complete) to bypass
     * Vercel's ~4.5 MB serverless request body limit. Smaller files use multipart upload.
     *
     * R2 key path: prod/brandkits/{kitId}/{blockType}/{uuid}-{filename}
     */
    uploadAsset(kitId: string, blockId: string, filePath: string, blockType: string, metadata?: {
        variant_name?: string;
        resource_label?: string;
        resource_category?: string;
        collateral_title?: string;
        collateral_description?: string;
    }): Promise<{
        asset_id: string;
        public_url: string;
        file_name: string;
        file_size_bytes: number;
    }>;
}
//# sourceMappingURL=client.d.ts.map