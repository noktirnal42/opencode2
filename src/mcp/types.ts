// MCP Types - Model Context Protocol type definitions

import { z } from 'zod'

// Transport types
export type TransportType = 'stdio' | 'sse' | 'http' | 'ws' | 'sdk'

// Config scope (where MCP server is defined)
export type ConfigScope = 'local' | 'user' | 'project' | 'dynamic' | 'enterprise' | 'managed'

// STDIO Server Config
export const McpStdioServerConfigSchema = z.object({
  type: z.literal('stdio').optional(),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  env: z.record(z.string()).optional()
})

// SSE Server Config  
export const McpSSEServerConfigSchema = z.object({
  type: z.literal('sse'),
  url: z.string(),
  headers: z.record(z.string()).optional()
})

// HTTP Server Config
export const McpHTTPServerConfigSchema = z.object({
  type: z.literal('http'),
  url: z.string(),
  headers: z.record(z.string()).optional()
})

// WebSocket Server Config
export const McpWebSocketServerConfigSchema = z.object({
  type: z.literal('ws'),
  url: z.string(),
  headers: z.record(z.string()).optional()
})

// OAuth Config
export const McpOAuthConfigSchema = z.object({
  clientId: z.string().optional(),
  callbackPort: z.number().positive().optional(),
  authServerMetadataUrl: z.string().url().optional(),
  xaa: z.boolean().optional()
})

// Server Config Schema (union of all transport types)
export const McpServerConfigSchema = z.discriminatedUnion('type', [
  McpStdioServerConfigSchema,
  McpSSEServerConfigSchema,
  McpHTTPServerConfigSchema,
  McpWebSocketServerConfigSchema
])

// MCP Server definition
export interface MCPServer {
  name: string
  config: z.infer<typeof McpServerConfigSchema>
  scope: ConfigScope
  enabled: boolean
}

// MCP Tool
export interface MCPTool {
  name: string
  description: string
  inputSchema: z.ZodSchema
}

// MCP Resource
export interface MCPResource {
  uri: string
  name: string
  mimeType?: string
  description?: string
}

// MCP Capability
export interface MCPCapability {
  tools?: boolean
  resources?: boolean
  prompts?: boolean
}

// MCP Server Info
export interface MCPServerInfo {
  name: string
  version?: string
  capabilities: MCPCapability
}

// MCP Request/Response types
export interface MCPToolCallRequest {
  name: string
  arguments: Record<string, unknown>
}

export interface MCPToolCallResponse {
  content: Array<{ type: string; text?: string }>
  isError?: boolean
}

export interface MCPResourceReadRequest {
  uri: string
}

export interface MCPResourceReadResponse {
  contents: Array<{
    uri: string
    mimeType?: string
    text?: string
    blob?: string
  }>
}