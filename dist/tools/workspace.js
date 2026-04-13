/**
 * Workspace tool — get_workspace
 */
export function registerWorkspaceTools(server, client) {
    server.tool('get_workspace', 'Returns the workspace associated with the API key. Use this to verify the connection and check workspace details like plan, kit count, and storage usage.', {}, async () => {
        try {
            const workspace = await client.getWorkspace();
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(workspace, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    },
                ],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=workspace.js.map