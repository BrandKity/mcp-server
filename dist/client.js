/**
 * BrandKity API Client
 *
 * Authenticated HTTP client for the BrandKity public API.
 * Used by all MCP tools to communicate with the platform.
 */
import { readFileSync, statSync } from 'fs';
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
    /**
     * Calculate a proportional upload timeout based on file size.
     * Base: 60 s. Adds 20 s per 10 MB. Capped at 10 minutes.
     */
    static uploadTimeout(fileSizeBytes) {
        const sizeMb = fileSizeBytes / (1024 * 1024);
        return Math.max(60_000, Math.min(600_000, 60_000 + Math.ceil(sizeMb / 10) * 20_000));
    }
    /**
     * Upload helper with automatic retry on transient network failures and 5xx errors.
     * Rebuilds the FormData each attempt (the file is already in memory as a Buffer).
     * Does NOT retry on 4xx — those indicate bad input and should surface immediately.
     */
    async doUpload(buildFormData, uploadUrl, timeoutMs, maxAttempts = 3) {
        let lastError = new Error('Upload failed');
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const formData = buildFormData();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'User-Agent': 'brandkity-mcp/1.3.2',
                    },
                    body: formData,
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                // 4xx = input error — no point retrying, return immediately
                if (response.status >= 400 && response.status < 500)
                    return response;
                if (response.ok)
                    return response;
                // 5xx — retry after exponential backoff
                lastError = new Error(`Server error (HTTP ${response.status})`);
                if (attempt < maxAttempts) {
                    await new Promise((r) => setTimeout(r, 1_000 * Math.pow(2, attempt - 1)));
                }
            }
            catch (err) {
                clearTimeout(timeoutId);
                const isTimeout = err instanceof Error && err.name === 'AbortError';
                const errMsg = isTimeout
                    ? 'upload timed out'
                    : err instanceof Error
                        ? err.message
                        : 'Unknown error';
                const isRetryable = err instanceof Error &&
                    (err.name === 'AbortError' ||
                        err.message.includes('network') ||
                        err.message.includes('socket') ||
                        err.message.includes('ECONNRESET') ||
                        err.message.includes('ECONNREFUSED') ||
                        err.message.includes('fetch'));
                lastError = new Error(errMsg);
                if (isRetryable && attempt < maxAttempts) {
                    await new Promise((r) => setTimeout(r, 1_000 * Math.pow(2, attempt - 1)));
                    continue;
                }
                throw new Error(attempt > 1 ? `Failed after ${attempt} attempts: ${errMsg}` : errMsg);
            }
        }
        throw lastError;
    }
    get headers() {
        return {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'brandkity-mcp/1.3.2',
        };
    }
    /**
     * Map common file extensions to MIME types for presigned upload requests.
     */
    static guessContentType(fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
        const map = {
            mp4: 'video/mp4',
            webm: 'video/webm',
            mov: 'video/quicktime',
            m4v: 'video/mp4',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            webp: 'image/webp',
            svg: 'image/svg+xml',
            gif: 'image/gif',
            pdf: 'application/pdf',
            ttf: 'font/ttf',
            otf: 'font/otf',
            woff: 'font/woff',
            woff2: 'font/woff2',
            zip: 'application/zip',
            txt: 'text/plain',
        };
        return map[ext] ?? 'application/octet-stream';
    }
    /**
     * Safely parse JSON from a Response — falls back to plain text for error bodies
     * (e.g. "Request Entity Too Large" from Vercel's edge when body > 4.5 MB).
     */
    static async safeJsonOrText(response) {
        const text = await response.text().catch(() => '');
        try {
            return { json: JSON.parse(text), text };
        }
        catch {
            return { json: null, text };
        }
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
     * Retries up to 3 times on transient network errors. Timeout scales with file size.
     */
    async uploadFile(filePath, tags) {
        const fileBuffer = readFileSync(filePath);
        const fileName = basename(filePath);
        const fileSizeBytes = statSync(filePath).size;
        const timeoutMs = BrandKityClient.uploadTimeout(fileSizeBytes);
        const uploadUrl = `${this.baseUrl}/api/v1/files`;
        const buildFormData = () => {
            const fd = new FormData();
            fd.append('file', new Blob([fileBuffer]), fileName);
            if (tags)
                fd.append('tags', tags);
            return fd;
        };
        let response;
        try {
            response = await this.doUpload(buildFormData, uploadUrl, timeoutMs);
        }
        catch (err) {
            const sizeMb = (fileSizeBytes / (1024 * 1024)).toFixed(1);
            throw new Error(`${err instanceof Error ? err.message : 'Upload failed'} (file: ${fileName}, size: ${sizeMb} MB)`);
        }
        const { json: jsonRaw, text: textRaw } = await BrandKityClient.safeJsonOrText(response);
        const json = jsonRaw;
        if (!response.ok) {
            throw new Error((json?.error?.message ?? textRaw.slice(0, 200)) ||
                `Upload failed with status ${response.status}`);
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
     * Files ≥ 4 MB use a presigned R2 URL (3-step: presign → PUT → complete) to bypass
     * Vercel's ~4.5 MB serverless request body limit. Smaller files use multipart upload.
     *
     * R2 key path: prod/brandkits/{kitId}/{blockType}/{uuid}-{filename}
     */
    async uploadAsset(kitId, blockId, filePath, blockType, metadata) {
        const fileBuffer = readFileSync(filePath);
        const fileName = basename(filePath);
        const fileSizeBytes = statSync(filePath).size;
        const uploadUrl = `${this.baseUrl}/api/v1/kits/${kitId}/blocks/${blockId}/upload`;
        // Large files: use presigned URL to avoid Vercel's ~4.5 MB body limit
        const LARGE_FILE_THRESHOLD = 4 * 1024 * 1024; // 4 MB
        if (fileSizeBytes >= LARGE_FILE_THRESHOLD) {
            const contentType = BrandKityClient.guessContentType(fileName);
            const sizeMb = (fileSizeBytes / (1024 * 1024)).toFixed(1);
            // Step 1: request a presigned PUT URL
            let presignData;
            try {
                const presignRes = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify({
                        action: 'presign',
                        block_type: blockType,
                        file_name: fileName,
                        content_type: contentType,
                        file_size_bytes: fileSizeBytes,
                        ...(metadata ?? {}),
                    }),
                    signal: AbortSignal.timeout(BrandKityClient.REQUEST_TIMEOUT_MS),
                });
                const { json, text } = await BrandKityClient.safeJsonOrText(presignRes);
                const parsed = json;
                if (!presignRes.ok) {
                    throw new Error((parsed?.error?.message ?? text.slice(0, 200)) || `HTTP ${presignRes.status}`);
                }
                presignData = parsed.data;
            }
            catch (err) {
                throw new Error(`Presign failed for ${fileName} (${sizeMb} MB, block_type: ${blockType}): ${err instanceof Error ? err.message : String(err)}`);
            }
            // Step 2: PUT file directly to R2 (bypasses Vercel)
            const timeoutMs = BrandKityClient.uploadTimeout(fileSizeBytes);
            const putController = new AbortController();
            const putTimeout = setTimeout(() => putController.abort(), timeoutMs);
            try {
                const putRes = await fetch(presignData.upload_url, {
                    method: 'PUT',
                    headers: { 'Content-Type': contentType },
                    body: fileBuffer,
                    signal: putController.signal,
                });
                clearTimeout(putTimeout);
                if (!putRes.ok) {
                    const txt = await putRes.text().catch(() => '');
                    throw new Error(`R2 PUT returned HTTP ${putRes.status}: ${txt.slice(0, 200)}`);
                }
            }
            catch (err) {
                clearTimeout(putTimeout);
                throw new Error(`R2 upload failed for ${fileName} (${sizeMb} MB): ${err instanceof Error ? err.message : String(err)}`);
            }
            // Step 3: register asset in block + workspace_assets
            try {
                const completeRes = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify({
                        action: 'complete',
                        block_type: blockType,
                        file_name: fileName,
                        content_type: contentType,
                        file_size_bytes: fileSizeBytes,
                        asset_id: presignData.asset_id,
                        storage_key: presignData.storage_key,
                        ...(metadata ?? {}),
                    }),
                    signal: AbortSignal.timeout(BrandKityClient.REQUEST_TIMEOUT_MS),
                });
                const { json, text } = await BrandKityClient.safeJsonOrText(completeRes);
                const parsed = json;
                if (!completeRes.ok) {
                    throw new Error((parsed?.error?.message ?? text.slice(0, 200)) || `HTTP ${completeRes.status}`);
                }
                return parsed.data;
            }
            catch (err) {
                throw new Error(`Asset registration failed for ${fileName}: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
        // Small file: existing multipart path
        const timeoutMs = BrandKityClient.uploadTimeout(fileSizeBytes);
        const buildFormData = () => {
            const fd = new FormData();
            fd.append('file', new Blob([fileBuffer]), fileName);
            fd.append('block_type', blockType);
            if (metadata?.variant_name)
                fd.append('variant_name', metadata.variant_name);
            if (metadata?.resource_label)
                fd.append('resource_label', metadata.resource_label);
            if (metadata?.resource_category)
                fd.append('resource_category', metadata.resource_category);
            if (metadata?.collateral_title)
                fd.append('collateral_title', metadata.collateral_title);
            if (metadata?.collateral_description)
                fd.append('collateral_description', metadata.collateral_description);
            return fd;
        };
        let response;
        try {
            response = await this.doUpload(buildFormData, uploadUrl, timeoutMs);
        }
        catch (err) {
            const sizeMb = (fileSizeBytes / (1024 * 1024)).toFixed(1);
            throw new Error(`${err instanceof Error ? err.message : 'Upload failed'} (file: ${fileName}, size: ${sizeMb} MB, block_type: ${blockType})`);
        }
        const { json, text } = await BrandKityClient.safeJsonOrText(response);
        const parsed = json;
        if (!response.ok) {
            throw new Error((parsed?.error?.message ?? text.slice(0, 200)) ||
                `Upload failed with status ${response.status}`);
        }
        return parsed.data;
    }
}
//# sourceMappingURL=client.js.map