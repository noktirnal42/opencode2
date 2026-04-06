// Tool Registry - Export all tools
export { readTool, ReadTool, ReadInputSchema } from './read'
export { writeTool, WriteTool, WriteInputSchema } from './write'
export { editTool, EditTool, EditInputSchema } from './edit'
export { bashTool, BashTool, BashInputSchema } from './bash'
export { grepTool, GrepTool, GrepInputSchema } from './grep'
export { globTool, GlobTool, GlobInputSchema } from './glob'
export { webFetchTool, WebFetchTool, WebFetchInputSchema } from './webfetch'
export { webSearchTool, WebSearchTool, WebSearchInputSchema } from './websearch'

import { readTool } from './read'
import { writeTool } from './write'
import { editTool } from './edit'
import { bashTool } from './bash'
import { grepTool } from './grep'
import { globTool } from './glob'
import { webFetchTool } from './webfetch'
import { webSearchTool } from './websearch'
import type { BaseTool } from '@/types/tool'

// Registry of all available tools
export const tools: Record<string, BaseTool> = {
  read: readTool,
  write: writeTool,
  edit: editTool,
  bash: bashTool,
  grep: grepTool,
  glob: globTool,
  webfetch: webFetchTool,
  websearch: webSearchTool
}

// Get tool by name
export function getTool(name: string): BaseTool | undefined {
  return tools[name]
}

// List all tool names
export function listTools(): string[] {
  return Object.keys(tools)
}

// Check if tool exists
export function hasTool(name: string): boolean {
  return name in tools
}