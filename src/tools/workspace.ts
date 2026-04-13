/**
 * Workspace tool — get_workspace
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { BrandKityClient } from '../client.js'

export function registerWorkspaceTools(
  server: McpServer,
  client: BrandKityClient
): void {
  server.tool(
    'get_workspace',
    'Returns the workspace associated with the API key. Use this to verify the connection and check workspace details like plan, kit count, and storage usage.',
    {},
    async () => {
      try {
        const workspace = await client.getWorkspace()
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(workspace, null, 2),
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
