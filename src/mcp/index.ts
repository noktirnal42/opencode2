// MCP Index - Export all MCP modules
export * from './types'
export * from './client'

import { getMCPServerManager } from './client'

// Quick initialization
export async function initMCP(servers: import('./types').MCPServer[]): Promise<void> {
  const manager = getMCPServerManager()
  for (const server of servers) {
    await manager.addServer(server)
  }
}

// Export manager getter
export { getMCPServerManager } from './client'
