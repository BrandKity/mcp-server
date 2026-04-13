/**
 * Shared TypeScript types for the BrandKity MCP Server.
 */
export interface Workspace {
    id: string;
    name: string;
    slug: string;
    plan: string;
    kit_count: number;
    storage_used_bytes: number;
    storage_limit_bytes: number;
}
export interface Kit {
    id: string;
    name: string;
    slug: string;
    status: 'draft' | 'published';
    template: string;
    accent_color: string;
    public_url: string | null;
    created_at: string;
}
export interface Block {
    block_id: string;
    type: string;
    name: string;
}
export interface UploadResult {
    asset_id: string;
    public_url: string;
    file_name: string;
    file_size_bytes: number;
}
export type BlockType = 'colors' | 'typography' | 'logos' | 'visuals' | 'videos' | 'icons' | 'collaterals' | 'resources' | 'rich_text';
export type TemplateType = 'minimal' | 'editorial' | 'corporate' | 'dark_studio' | 'glass' | 'bento' | 'presentation' | 'slider';
//# sourceMappingURL=types.d.ts.map