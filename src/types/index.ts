// Core types - import from tool.ts and re-export
import type {
  ToolDefinition,
  ProviderConfig,
  ModelConfig,
  PermissionSet,
  Permission,
  PermissionBehavior,
  MCPClient,
  MCPTool,
  MCPResource,
  Message,
  ToolCall,
  ToolContext,
  ToolResult,
  AgentInfo,
} from './tool'

import { BaseTool } from './tool'

// Re-export
export type {
  ToolDefinition,
  ProviderConfig,
  ModelConfig,
  PermissionSet,
  Permission,
  PermissionBehavior,
  MCPClient,
  MCPTool,
  MCPResource,
  Message,
  ToolCall,
  ToolContext,
  ToolResult,
  AgentInfo,
}

export { BaseTool }

// Additional types for the application
export interface Session {
  id: string
  agent: string
  model: string
  createdAt: number
  updatedAt: number
  workspace?: string
}

export interface Workspace {
  id: string
  name: string
  path: string
  createdAt: number
}

export interface Config {
  version: string
  providers: Record<string, ProviderConfig>
  agents: Record<string, AgentConfig>
  memory?: MemoryConfig
  compaction?: CompactionConfig
  mcp?: MCPConfig
  permissions?: PermissionConfig
  localModels?: LocalModelsConfig
  desktop?: DesktopConfig
}

export interface AgentConfig {
  model?: string
  permission?: PermissionSet
  tools?: string[]
  mcpServers?: string[]
}

export interface MemoryConfig {
  autoMemory: boolean
  autoDream?: {
    enabled: boolean
    minHours: number
    minSessions: number
  }
}

export interface CompactionConfig {
  enabled: boolean
  maxTokens: number
  warningThreshold: number
  autoCompact: boolean
}

export interface MCPConfig {
  servers: MCPServerConfig[]
  autoApprove?: boolean
}

export interface MCPServerConfig {
  name: string
  type: 'stdio' | 'sse' | 'http' | 'ws'
  command?: string
  args?: string[]
  url?: string
}

export interface PermissionConfig {
  defaultMode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'dontAsk' | 'plan' | 'ask'
}

export interface LocalModelsConfig {
  ollama?: OllamaConfig
  lmstudio?: LMStudioConfig
}

export interface OllamaConfig {
  enabled: boolean
  baseUrl?: string
  timeout?: number
}

export interface LMStudioConfig {
  enabled: boolean
  baseUrl?: string
  timeout?: number
}

export interface DesktopConfig {
  transparency?: TransparencyConfig
}

export interface TransparencyConfig {
  enabled: boolean
  defaultOpacity: number
  minOpacity: number
  maxOpacity: number
  blur?: boolean
  vibrancy?: boolean
}
