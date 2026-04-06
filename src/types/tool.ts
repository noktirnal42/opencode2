// Tool types and interfaces for OpenCode2
import { z } from 'zod'

export interface ToolContext {
  cwd: string
  sessionId: string
  agent: AgentInfo
  permissions: Permission[]
  mcpClients?: MCPClient[]
}

export interface ToolResult<T = unknown> {
  content: string
  data?: T
  error?: string
}

export interface AgentInfo {
  name: string
  mode: 'primary' | 'subagent'
  permission: PermissionSet
}

// Permission types
export type PermissionBehavior = 'allow' | 'deny' | 'ask'

export interface Permission {
  tool: string
  behavior: PermissionBehavior
  content?: string  // Optional content filter
}

export interface PermissionSet {
  allow: string[]
  deny: string[]
  ask: string[]
}

// MCP types
export interface MCPClient {
  name: string
  tools: MCPTool[]
  resources: MCPResource[]
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: z.ZodSchema
}

export interface MCPResource {
  uri: string
  name: string
  mimeType?: string
}

// Message types
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'

export interface Message {
  id: string
  role: MessageRole
  content: string
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
  timestamp: number
}

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

// Provider types
export interface ProviderConfig {
  type: 'anthropic' | 'openai' | 'google' | 'azure' | 'ollama' | 'lmstudio'
  apiKey?: string
  baseUrl?: string
  models?: ModelConfig[]
}

export interface ModelConfig {
  name: string
  contextLength?: number
  supportsThinking?: boolean
}

// Tool input schemas
export const ReadSchema = z.object({
  path: z.string(),
  offset: z.number().optional(),
  limit: z.number().optional()
})

export const WriteSchema = z.object({
  path: z.string(),
  content: z.string()
})

export const EditSchema = z.object({
  path: z.string(),
  oldString: z.string(),
  newString: z.string(),
  replaceAll: z.boolean().optional()
})

export const BashSchema = z.object({
  command: z.string(),
  timeout: z.number().optional(),
  workdir: z.string().optional()
})

export const GrepSchema = z.object({
  pattern: z.string(),
  path: z.string().optional(),
  include: z.string().optional(),
  exclude: z.string().optional()
})

export const GlobSchema = z.object({
  pattern: z.string(),
  path: z.string().optional()
})

export const WebFetchSchema = z.object({
  url: z.string().url(),
  format: z.enum(['text', 'markdown', 'html']).optional(),
  timeout: z.number().optional()
})

export const WebSearchSchema = z.object({
  query: z.string(),
  numResults: z.number().optional(),
  livecrawl: z.enum(['fallback', 'preferred']).optional(),
  type: z.enum(['auto', 'fast', 'deep']).optional(),
  contextMaxCharacters: z.number().optional()
})

// Tool definition
export interface ToolDefinition<T = unknown, R = unknown> {
  name: string
  description: string
  inputSchema: z.ZodSchema<T>
  execute(context: ToolContext, input: T): Promise<ToolResult<R>>
  aliases?: string[]
}

// Base tool class
export abstract class BaseTool<TInput = unknown, TResult = unknown> {
  abstract readonly name: string
  abstract readonly description: string
  abstract readonly inputSchema: z.ZodSchema<TInput>
  
  abstract execute(context: ToolContext, input: TInput): Promise<ToolResult<TResult>>
  
  aliases: string[] = []
}
