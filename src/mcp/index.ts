// MCP Index - Export all MCP modules
export * from './types'
export * from './client'

// Quick initialization
export async function initMCP(servers: import('./types').MCPServer[]): Promise<void> {
  for (const server of servers) {
    await mcpServerManager.addServer(server)
  }
}

// Export manager
export { mcpServerManager } from './client'