/**
 * BrandKity API Client
 *
 * Authenticated HTTP client for the BrandKity public API.
 * Used by all MCP tools to communicate with the platform.
 */

import { readFileSync } from 'fs'
import { basename } from 'path'

export class BrandKityClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  /** 30-second timeout prevents AI agents from hanging on slow/unresponsive API. */
  private static readonly REQUEST_TIMEOUT_MS = 30_000

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'brandkity-mcp/1.1.0',
    }
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), BrandKityClient.REQUEST_TIMEOUT_MS)

    const requestHeaders = { ...this.headers }
    if (method === 'GET') delete requestHeaders['Content-Type']

    const options: RequestInit = { method, headers: requestHeaders, signal: controller.signal }
    if (body && method !== 'GET') options.body = JSON.stringify(body)

    let response: Response
    try {
      response = await fetch(url, options)
    } finally {
      clearTimeout(timeoutId)
    }
    const json = (await response.json()) as { data?: T; error?: { message: string } }

    if (!response.ok) {
      const message = json.error?.message ?? `API request failed with status ${response.status}`
      throw new Error(message)
    }

    return json.data as T
  }

  // ── Workspace ───────────────────────────────────────────────────────────────

  async getWorkspace() {
    return this.request<{
      name: string
      slug: string
      plan: string
      kit_count: number
      storage_used_bytes: number
      storage_limit_bytes: number
    }>('GET', '/api/v1/workspace')
  }

  // ── Files (workspace storage) ───────────────────────────────────────────────

  /**
   * Upload any local file to workspace R2 storage.
   * Returns a public URL immediately usable in other API calls.
   */
  async uploadFile(
    filePath: string,
    tags?: string
  ): Promise<{
    id: string
    url: string
    file_type: string
    mime_type: string
    original_name: string
    file_size_bytes: number
    tags: string[]
    r2_key: string
  }> {
    const fileBuffer = readFileSync(filePath)
    const fileName = basename(filePath)

    const formData = new FormData()
    formData.append('file', new Blob([fileBuffer]), fileName)
    if (tags) formData.append('tags', tags)

    const url = `${this.baseUrl}/api/v1/files`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60_000) // 5 min for large uploads
    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'User-Agent': 'brandkity-mcp/1.1.0',
        },
        body: formData,
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    const json = (await response.json()) as {
      data?: {
        id: string
        url: string
        file_type: string
        mime_type: string
        original_name: string
        file_size_bytes: number
        tags: string[]
        r2_key: string
      }
      error?: { message: string }
    }

    if (!response.ok) {
      throw new Error(json.error?.message ?? `Upload failed with status ${response.status}`)
    }

    return json.data!
  }

  async listFiles(type?: string, page?: number) {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (page) params.set('page', String(page))
    const q = params.toString() ? `?${params.toString()}` : ''
    return this.request<{
      files: Array<{
        id: string
        original_name: string
        file_type: string
        mime_type: string
        r2_url: string
        file_size_bytes: number
        tags: string[]
        uploaded_at: string
      }>
      meta: { total: number; page: number; per_page: number; total_pages: number }
    }>('GET', `/api/v1/files${q}`)
  }

  // ── Kits ────────────────────────────────────────────────────────────────────

  async listKits(status?: 'draft' | 'published' | 'all') {
    const query = status && status !== 'all' ? `?status=${status}` : ''
    return this.request<
      Array<{
        id: string
        name: string
        slug: string
        status: string
        template: string
        accent_color: string
        created_at: string
        public_url: string | null
      }>
    >('GET', `/api/v1/kits${query}`)
  }

  async createKit(data: {
    name: string
    accent_color: string
    template?: string
    tagline?: string
  }) {
    return this.request<{
      id: string
      name: string
      slug: string
      status: string
      public_url: string
    }>('POST', '/api/v1/kits', data)
  }

  async getKit(kitId: string) {
    return this.request<{
      kit: Record<string, unknown>
      blocks: Array<Record<string, unknown>>
    }>('GET', `/api/v1/kits/${kitId}`)
  }

  async updateKit(
    kitId: string,
    data: {
      name?: string
      accent_color?: string
      template?: string
      tagline?: string | null
      logo_url?: string | null
      cover_image_url?: string | null
    }
  ) {
    return this.request<Record<string, unknown>>('PATCH', `/api/v1/kits/${kitId}`, data)
  }

  async publishKit(kitId: string) {
    return this.request<{ status: string; public_url: string }>(
      'POST',
      `/api/v1/kits/${kitId}/publish`
    )
  }

  async unpublishKit(kitId: string) {
    return this.request<{ status: string }>('POST', `/api/v1/kits/${kitId}/unpublish`)
  }

  // ── Blocks ──────────────────────────────────────────────────────────────────

  async listBlocks(kitId: string) {
    return this.request<Array<Record<string, unknown>>>('GET', `/api/v1/kits/${kitId}/blocks`)
  }

  async addBlock(kitId: string, type: string, name?: string) {
    return this.request<{
      block_id: string
      type: string
      name: string
    }>('POST', `/api/v1/kits/${kitId}/blocks`, { type, ...(name ? { name } : {}) })
  }

  async updateBlock(
    kitId: string,
    blockId: string,
    data: { name?: string; is_visible?: boolean; settings?: Record<string, unknown> }
  ) {
    return this.request<Record<string, unknown>>(
      'PATCH',
      `/api/v1/kits/${kitId}/blocks/${blockId}`,
      data
    )
  }

  async deleteBlock(kitId: string, blockId: string) {
    return this.request<{ deleted: boolean }>('DELETE', `/api/v1/kits/${kitId}/blocks/${blockId}`)
  }

  // ── Content ──────────────────────────────────────────────────────────────────

  async addColors(
    kitId: string,
    blockId: string,
    colors: Array<{
      name: string
      hex: string
      rgb?: string
      cmyk?: string
      pantone?: string
    }>
  ) {
    // Note: colors have NO usage field — usage guidance belongs in the block note
    return this.request<{ added: number }>(
      'POST',
      `/api/v1/kits/${kitId}/blocks/${blockId}/colors`,
      {
        colors,
      }
    )
  }

  async addTypography(
    kitId: string,
    blockId: string,
    fonts: Array<{
      font_family: string
      source: 'Google Fonts' | 'Adobe Fonts' | 'Custom' | 'System'
      weights?: number[]
      usage?: string
      preview_text?: string
      /**
       * For source "Custom": URL returned by uploadFile() for the font file.
       * For source "Adobe Fonts": Typekit CSS URL (https://use.typekit.net/xxx.css).
       */
      asset_url?: string
    }>
  ) {
    return this.request<{ added: number }>(
      'POST',
      `/api/v1/kits/${kitId}/blocks/${blockId}/typography`,
      { fonts }
    )
  }

  async setBrandStory(kitId: string, blockId: string, content: string) {
    return this.request<{ updated: boolean }>(
      'PATCH',
      `/api/v1/kits/${kitId}/blocks/${blockId}/richtext`,
      { content }
    )
  }

  /**
   * Set the block note (the "Block note" rich text editor visible above each block in the dashboard).
   * This is stored in data.settings.notes via the generic PATCH block endpoint.
   */
  async setBlockNote(kitId: string, blockId: string, note: string) {
    return this.request<Record<string, unknown>>(
      'PATCH',
      `/api/v1/kits/${kitId}/blocks/${blockId}`,
      { settings: { notes: note } }
    )
  }

  // ── Upload (block-level file assets) ────────────────────────────────────────

  /**
   * Upload a local file directly into a block (logo, visual, video, icon, collateral, resource).
   * Use upload_file for workspace-level uploads and typography font files.
   * Use upload_asset for block-embedded assets.
   *
   * R2 key path: prod/brandkits/{kitId}/{blockType}/{uuid}-{filename}
   */
  async uploadAsset(
    kitId: string,
    blockId: string,
    filePath: string,
    blockType: string,
    metadata?: {
      variant_name?: string
      resource_label?: string
      resource_category?: string
      collateral_title?: string
      collateral_description?: string
    }
  ): Promise<{
    asset_id: string
    public_url: string
    file_name: string
    file_size_bytes: number
  }> {
    const fileBuffer = readFileSync(filePath)
    const fileName = basename(filePath)

    const formData = new FormData()
    formData.append('file', new Blob([fileBuffer]), fileName)
    formData.append('block_type', blockType)

    if (metadata?.variant_name) formData.append('variant_name', metadata.variant_name)
    if (metadata?.resource_label) formData.append('resource_label', metadata.resource_label)
    if (metadata?.resource_category)
      formData.append('resource_category', metadata.resource_category)
    if (metadata?.collateral_title) formData.append('collateral_title', metadata.collateral_title)
    if (metadata?.collateral_description)
      formData.append('collateral_description', metadata.collateral_description)

    const url = `${this.baseUrl}/api/v1/kits/${kitId}/blocks/${blockId}/upload`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60_000) // 5 min for large uploads
    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'User-Agent': 'brandkity-mcp/1.1.0',
        },
        body: formData,
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    const json = (await response.json()) as {
      data?: { asset_id: string; public_url: string; file_name: string; file_size_bytes: number }
      error?: { message: string }
    }

    if (!response.ok) {
      throw new Error(json.error?.message ?? `Upload failed with status ${response.status}`)
    }

    return json.data!
  }
}
