// MCP Client - Connect to MCP servers and call tools
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { MCPServer, MCPTool, MCPResource, MCPServerInfo } from './types'
import type { ToolContext, ToolResult } from '@/types/tool'

// MCP Client wrapper
export class MCPClientWrapper {
  private client: Client
  private serverName: string
  private connected: boolean = false
  
  constructor(serverName: string, client: Client) {
    this.client = client
    this.serverName = serverName
  }
  
  async connect(): Promise<void> {
    try {
      await this.client.connect(new StdioClientTransport({
        command: 'true', // dummy command, will be replaced
        args: []
      }))
      this.connected = true
    } catch (error) {
      console.error(`Failed to connect to MCP server ${this.serverName}:`, error)
      throw error
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      await this.client.close()
      this.connected = false
    } catch (error) {
      console.error(`Failed to disconnect from MCP server ${this.serverName}:`, error)
    }
  }
  
  isConnected(): boolean {
    return this.connected
  }
  
  async listTools(): Promise<MCPTool[]> {
    const response = await this.client.listTools()
    return response.tools.map(tool => ({
      name: tool.name,
      description: tool.description ?? '',
      inputSchema: tool.inputSchema as any
    }))
  }
  
  async listResources(): Promise<MCPResource[]> {
    const response = await this.client.listResources()
    return response.resources.map(resource => ({
      uri: resource.uri,
      name: resource.name ?? resource.uri,
      mimeType: resource.mimeType
    }))
  }
  
  async callTool(name: string, args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text?: string }> }> {
    // Using any to bypass strict typing from the SDK
    const response = await (this.client as any).callTool({
      name,
      arguments: args
    })
    return response
  }
  
  async readResource(uri: string): Promise<{ contents: Array<{ text?: string; blob?: string }> }> {
    return (this.client as any).readResource({ uri })
  }
  
  async getInfo(): Promise<MCPServerInfo> {
    return {
      name: this.serverName,
      capabilities: {
        tools: true,
        resources: true
      }
    }
  }
}

// MCP Server Manager - manages multiple MCP servers
export class MCPServerManager {
  private servers: Map<string, { wrapper: MCPClientWrapper; transport: StdioClientTransport }> = new Map()
  
  // Add and connect to an MCP server
  async addServer(server: MCPServer): Promise<void> {
    if (!server.enabled) return
    
    const config = server.config as { command: string; args: string[]; env?: Record<string, string> }
    
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: config.env
    })
    
    const client = new Client({
      name: server.name,
      version: '1.0.0'
    }, {
      capabilities: {}
    })
    
    const wrapper = new MCPClientWrapper(server.name, client)
    
    try {
      await client.connect(transport)
      wrapper.connect = async () => { /* Already connected */ }
      this.servers.set(server.name, { wrapper, transport })
      console.log(`Connected to MCP server: ${server.name}`)
    } catch (error) {
      console.error(`Failed to add MCP server ${server.name}:`, error)
    }
  }
  
  // Remove and disconnect from an MCP server
  async removeServer(name: string): Promise<void> {
    const server = this.servers.get(name)
    if (server) {
      await server.wrapper.disconnect()
      this.servers.delete(name)
    }
  }
  
  // Get server by name
  getServer(name: string): MCPClientWrapper | undefined {
    return this.servers.get(name)?.wrapper
  }
  
  // List all connected servers
  listServers(): string[] {
    return Array.from(this.servers.keys())
  }
  
  // List all tools from all servers
  async listAllTools(): Promise<{ server: string; tools: MCPTool[] }[]> {
    const results: { server: string; tools: MCPTool[] }[] = []
    
    for (const [name, server] of this.servers.entries()) {
      try {
        const tools = await server.wrapper.listTools()
        results.push({ server: name, tools })
      } catch (error) {
        console.error(`Failed to list tools from ${name}:`, error)
      }
    }
    
    return results
  }
  
  // Call tool on specific server
  async callToolOnServer(serverName: string, toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
    const server = this.servers.get(serverName)
    if (!server) {
      return {
        content: `MCP server not found: ${serverName}`,
        error: 'SERVER_NOT_FOUND'
      }
    }
    
    try {
      const response = await server.wrapper.callTool(toolName, args)
      
      // Format response content
      const content = response.content
        .map(c => c.text ?? JSON.stringify(c))
        .join('\n')
      
      return {
        content,
        data: response
      }
    } catch (error) {
      return {
        content: `Error calling MCP tool: ${error instanceof Error ? error.message : String(error)}`,
        error: 'TOOL_CALL_ERROR'
      }
    }
  }
  
  // Disconnect all servers
  async disconnectAll(): Promise<void> {
    for (const server of this.servers.values()) {
      await server.wrapper.disconnect()
    }
    this.servers.clear()
  }
}

// Global server manager instance
let globalServerManager: MCPServerManager | null = null

export function getMCPServerManager(): MCPServerManager {
  if (!globalServerManager) {
    globalServerManager = new MCPServerManager()
  }
  return globalServerManager
}
