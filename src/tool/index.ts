// Tool Registry - Export all tools
export { readTool, ReadTool, ReadInputSchema } from './read'
export { writeTool, WriteTool, WriteInputSchema } from './write'
export { editTool, EditTool, EditInputSchema, replace, SimpleReplacer, LineTrimmedReplacer, BlockAnchorReplacer, WhitespaceNormalizedReplacer, IndentationFlexibleReplacer, TrimmedBoundaryReplacer, ContextAwareReplacer, type Replacer } from './edit'
export { bashTool, BashTool, BashInputSchema } from './bash'
export { grepTool, GrepTool, GrepInputSchema } from './grep'
export { globTool, GlobTool, GlobInputSchema } from './glob'
export { webFetchTool, WebFetchTool, WebFetchInputSchema } from './webfetch'
export { webSearchTool, WebSearchTool, WebSearchInputSchema } from './websearch'

// Task tools
export { 
  todoWriteTool, todoListTool, todoGetTool, todoUpdateTool, todoStopTool,
  TodoWriteInputSchema, TodoListInputSchema, TodoGetInputSchema, 
  TodoUpdateInputSchema, TodoStopInputSchema,
  type Task, type TaskStatus, type TaskPriority
} from './task'

// Team tools
export {
  teamCreateTool, teamDeleteTool, teamSendMessageTool, teamListTool,
  teamInfoTool, teamAddMemberTool, teamRemoveMemberTool, teamGetMessagesTool,
  TeamCreateInputSchema, TeamDeleteInputSchema, TeamSendMessageInputSchema,
  TeamListInputSchema, TeamInfoInputSchema, TeamAddMemberInputSchema,
  TeamRemoveMemberInputSchema, TeamGetMessagesInputSchema,
  type Team, type TeamMessage
} from './team'

// Re-export types for convenience
export type { ToolContext } from '@/types/tool'

import { readTool } from './read'
import { writeTool } from './write'
import { editTool } from './edit'
import { bashTool } from './bash'
import { grepTool } from './grep'
import { globTool } from './glob'
import { webFetchTool } from './webfetch'
import { webSearchTool } from './websearch'
import { todoWriteTool, todoListTool, todoGetTool, todoUpdateTool, todoStopTool } from './task'
import { teamCreateTool, teamDeleteTool, teamSendMessageTool, teamListTool, teamInfoTool, teamAddMemberTool, teamRemoveMemberTool, teamGetMessagesTool } from './team'
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
  websearch: webSearchTool,
  // Task tools
  todo_write: todoWriteTool,
  todo_list: todoListTool,
  todo_get: todoGetTool,
  todo_update: todoUpdateTool,
  todo_stop: todoStopTool,
  // Team tools
  team_create: teamCreateTool,
  team_delete: teamDeleteTool,
  team_sendmessage: teamSendMessageTool,
  team_list: teamListTool,
  team_info: teamInfoTool,
  team_addmember: teamAddMemberTool,
  team_removemember: teamRemoveMemberTool,
  team_getmessages: teamGetMessagesTool
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