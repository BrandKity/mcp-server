/**
 * BrandKity API Client
 *
 * Authenticated HTTP client for the BrandKity public API.
 * Used by all MCP tools to communicate with the platform.
 */
import { readFileSync } from 'fs';
import { basename } from 'path';
export class BrandKityClient {
    apiKey;
    baseUrl;
    constructor(apiKey, baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.replace(/\/+$/, '');
    }
    /** 30-second timeout prevents AI agents from hanging on slow/unresponsive API. */
    static REQUEST_TIMEOUT_MS = 30_000;
    get headers() {
        return {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'brandkity-mcp/1.1.0',
        };
    }
    async request(method, path, body) {
        const url = `${this.baseUrl}${path}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), BrandKityClient.REQUEST_TIMEOUT_MS);
        const requestHeaders = { ...this.headers };
        if (method === 'GET')
            delete requestHeaders['Content-Type'];
        const options = { method, headers: requestHeaders, signal: controller.signal };
        if (body && method !== 'GET')
            options.body = JSON.stringify(body);
        let response;
        try {
            response = await fetch(url, options);
        }
        finally {
            clearTimeout(timeoutId);
        }
        const json = (await response.json());
        if (!response.ok) {
            const message = json.error?.message ?? `API request failed with status ${response.status}`;
            throw new Error(message);
        }
        return json.data;
    }
    // ── Workspace ───────────────────────────────────────────────────────────────
    async getWorkspace() {
        return this.request('GET', '/api/v1/workspace');
    }
    // ── Files (workspace storage) ───────────────────────────────────────────────
    /**
     * Upload any local file to workspace R2 storage.
     * Returns a public URL immediately usable in other API calls.
     */
    async uploadFile(filePath, tags) {
        const fileBuffer = readFileSync(filePath);
        const fileName = basename(filePath);
        const formData = new FormData();
        formData.append('file', new Blob([fileBuffer]), fileName);
        if (tags)
            formData.append('tags', tags);
        const url = `${this.baseUrl}/api/v1/files`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5 * 60_000); // 5 min for large uploads
        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'User-Agent': 'brandkity-mcp/1.1.0',
                },
                body: formData,
                signal: controller.signal,
            });
        }
        finally {
            clearTimeout(timeoutId);
        }
        const json = (await response.json());
        if (!response.ok) {
            throw new Error(json.error?.message ?? `Upload failed with status ${response.status}`);
        }
        return json.data;
    }
    async listFiles(type, page) {
        const params = new URLSearchParams();
        if (type)
            params.set('type', type);
        if (page)
            params.set('page', String(page));
        const q = params.toString() ? `?${params.toString()}` : '';
        return this.request('GET', `/api/v1/files${q}`);
    }
    // ── Kits ────────────────────────────────────────────────────────────────────
    async listKits(status) {
        const query = status && status !== 'all' ? `?status=${status}` : '';
        return this.request('GET', `/api/v1/kits${query}`);
    }
    async createKit(data) {
        return this.request('POST', '/api/v1/kits', data);
    }
    async getKit(kitId) {
        return this.request('GET', `/api/v1/kits/${kitId}`);
    }
    async updateKit(kitId, data) {
        return this.request('PATCH', `/api/v1/kits/${kitId}`, data);
    }
    async publishKit(kitId) {
        return this.request('POST', `/api/v1/kits/${kitId}/publish`);
    }
    async unpublishKit(kitId) {
        return this.request('POST', `/api/v1/kits/${kitId}/unpublish`);
    }
    // ── Blocks ──────────────────────────────────────────────────────────────────
    async listBlocks(kitId) {
        return this.request('GET', `/api/v1/kits/${kitId}/blocks`);
    }
    async addBlock(kitId, type, name) {
        return this.request('POST', `/api/v1/kits/${kitId}/blocks`, { type, ...(name ? { name } : {}) });
    }
    async updateBlock(kitId, blockId, data) {
        return this.request('PATCH', `/api/v1/kits/${kitId}/blocks/${blockId}`, data);
    }
    async deleteBlock(kitId, blockId) {
        return this.request('DELETE', `/api/v1/kits/${kitId}/blocks/${blockId}`);
    }
    // ── Content ──────────────────────────────────────────────────────────────────
    async addColors(kitId, blockId, colors) {
        // Note: colors have NO usage field — usage guidance belongs in the block note
        return this.request('POST', `/api/v1/kits/${kitId}/blocks/${blockId}/colors`, {
            colors,
        });
    }
    async addTypography(kitId, blockId, fonts) {
        return this.request('POST', `/api/v1/kits/${kitId}/blocks/${blockId}/typography`, { fonts });
    }
    async setBrandStory(kitId, blockId, content) {
        return this.request('PATCH', `/api/v1/kits/${kitId}/blocks/${blockId}/richtext`, { content });
    }
    /**
     * Set the block note (the "Block note" rich text editor visible above each block in the dashboard).
     * This is stored in data.settings.notes via the generic PATCH block endpoint.
     */
    async setBlockNote(kitId, blockId, note) {
        return this.request('PATCH', `/api/v1/kits/${kitId}/blocks/${blockId}`, { settings: { notes: note } });
    }
    // ── Upload (block-level file assets) ────────────────────────────────────────
    /**
     * Upload a local file directly into a block (logo, visual, video, icon, collateral, resource).
     * Use upload_file for workspace-level uploads and typography font files.
     * Use upload_asset for block-embedded assets.
     *
     * R2 key path: prod/brandkits/{kitId}/{blockType}/{uuid}-{filename}
     */
    async uploadAsset(kitId, blockId, filePath, blockType, metadata) {
        const fileBuffer = readFileSync(filePath);
        const fileName = basename(filePath);
        const formData = new FormData();
        formData.append('file', new Blob([fileBuffer]), fileName);
        formData.append('block_type', blockType);
        if (metadata?.variant_name)
            formData.append('variant_name', metadata.variant_name);
        if (metadata?.resource_label)
            formData.append('resource_label', metadata.resource_label);
        if (metadata?.resource_category)
            formData.append('resource_category', metadata.resource_category);
        if (metadata?.collateral_title)
            formData.append('collateral_title', metadata.collateral_title);
        if (metadata?.collateral_description)
            formData.append('collateral_description', metadata.collateral_description);
        const url = `${this.baseUrl}/api/v1/kits/${kitId}/blocks/${blockId}/upload`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5 * 60_000); // 5 min for large uploads
        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'User-Agent': 'brandkity-mcp/1.1.0',
                },
                body: formData,
                signal: controller.signal,
            });
        }
        finally {
            clearTimeout(timeoutId);
        }
        const json = (await response.json());
        if (!response.ok) {
            throw new Error(json.error?.message ?? `Upload failed with status ${response.status}`);
        }
        return json.data;
    }
}
//# sourceMappingURL=client.js.map