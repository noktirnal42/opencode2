// Plugin System Types for OpenCode2
import type { z } from 'zod'

// Plugin manifest
export interface PluginManifest {
  name: string
  version: string
  description?: string
  author?: string
  homepage?: string
  main: string
  enabled?: boolean
}

// Plugin configuration
export interface PluginConfig {
  enabled: boolean
  settings?: Record<string, unknown>
}

// Tool contributed by a plugin
export interface PluginTool {
  name: string
  description: string
  inputSchema: z.ZodSchema<unknown>
  execute(input: unknown): Promise<{ content: string; data?: unknown; error?: string }>
}

// Agent contributed by a plugin
export interface PluginAgent {
  name: string
  description: string
  systemPrompt: string
  permission?: {
    allow?: string[]
    deny?: string[]
    ask?: string[]
  }
}

// Skill contributed by a plugin
export interface PluginSkill {
  name: string
  description: string
  parameters?: z.ZodSchema<unknown>
  execute(params: unknown, context: PluginExecutionContext): Promise<PluginResult>
}

// Execution context for plugin skills
export interface PluginExecutionContext {
  cwd: string
  sessionId: string
  agent: string
  tools: {
    read(path: string, options?: { offset?: number; limit?: number }): Promise<string>
    write(path: string, content: string): Promise<void>
    bash(command: string): Promise<string>
    grep(pattern: string, path?: string): Promise<string[]>
    glob(pattern: string, path?: string): Promise<string[]>
  }
}

// Result from plugin skill execution
export interface PluginResult {
  success: boolean
  content?: string
  data?: unknown
  error?: string
}

// Plugin instance (after loading)
export interface Plugin {
  manifest: PluginManifest
  tools: PluginTool[]
  agents: PluginAgent[]
  skills: PluginSkill[]
  onLoad?: () => Promise<void> | void
  onUnload?: () => Promise<void> | void
}

// Plugin lifecycle hooks
export interface PluginHooks {
  beforeToolCall?: (toolName: string, input: unknown) => void
  afterToolCall?: (toolName: string, input: unknown, result: unknown) => void
  beforeMessage?: (message: unknown) => void
  afterMessage?: (message: unknown) => void
  onError?: (error: Error) => void
}

// Plugin loader options
export interface PluginLoaderOptions {
  pluginDir: string
  autoLoad?: boolean
}

// Plugin store (loaded plugins)
export interface PluginStore {
  plugins: Map<string, Plugin>
  tools: Map<string, PluginTool>
  agents: Map<string, PluginAgent>
  skills: Map<string, PluginSkill>
}
