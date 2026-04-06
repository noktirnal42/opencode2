// Agent System - Built-in agents
import { type AgentInfo, type PermissionSet } from '@/types/tool'

// Default permission sets
export const defaultPermissions: PermissionSet = {
  allow: ['read', 'write', 'edit', 'bash', 'grep', 'glob', 'webfetch', 'websearch'],
  deny: [],
  ask: []
}

export const planPermissions: PermissionSet = {
  allow: ['read', 'grep', 'glob', 'webfetch', 'websearch'],
  deny: ['write', 'edit', 'bash'],
  ask: []
}

export const explorePermissions: PermissionSet = {
  allow: ['read', 'grep', 'glob'],
  deny: [],
  ask: ['bash', 'write', 'edit']
}

// Built-in agents
export interface Agent {
  name: string
  description: string
  mode: 'primary' | 'subagent'
  model?: string
  permission: PermissionSet
  systemPrompt?: string
}

export const builtInAgents: Agent[] = [
  {
    name: 'build',
    description: 'Default full-access development agent',
    mode: 'primary',
    model: 'claude-sonnet-4-20250514',
    permission: defaultPermissions,
    systemPrompt: `You are OpenCode, an expert coding assistant. Your goal is to help the user complete their task.

When writing or modifying code:
- Follow the project's existing patterns and conventions
- Use clear, readable variable and function names
- Add comments for complex logic
- Write tests when appropriate

When using tools:
- Use multiple tools in parallel when appropriate
- Prefer read before edit - understand the code first
- Be careful with destructive operations

When unsure:
- Ask the user for clarification
- Suggest alternatives instead of assuming`
  },
  {
    name: 'plan',
    description: 'Read-only agent for analysis and exploration',
    mode: 'primary',
    model: 'claude-haiku-3-5',
    permission: planPermissions,
    systemPrompt: `You are OpenCode in plan mode. Your role is to analyze and explore the codebase to understand its structure, patterns, and potential approaches.

Guidelines:
- Focus on reading and understanding code
- Use grep and glob to explore the codebase
- Do NOT modify any files
- Do NOT run commands that modify the system
- Ask permission before running any bash commands
- Provide thorough analysis and recommendations`
  },
  {
    name: 'explore',
    description: 'Fast code exploration subagent',
    mode: 'subagent',
    model: 'claude-haiku-3-5',
    permission: explorePermissions,
    systemPrompt: `You are a fast code exploration agent. Your role is to quickly find and summarize relevant code.

Guidelines:
- Be quick and efficient
- Use grep and glob to find relevant files
- Summarize findings concisely
- Do NOT modify any code
- Do NOT run any bash commands`
  },
  {
    name: 'general',
    description: 'Subagent for complex multi-step tasks',
    mode: 'subagent',
    model: 'claude-sonnet-4-20250514',
    permission: defaultPermissions,
    systemPrompt: `You are a general-purpose subagent. Your role is to handle complex multi-step tasks that require reasoning and multiple tool calls.

Guidelines:
- Break down complex tasks into steps
- Use appropriate tools to complete each step
- Keep the user informed of progress
- Ask for clarification when needed`
  }
]

// Get agent by name
export function getAgent(name: string): Agent | undefined {
  return builtInAgents.find(a => a.name === name)
}

// List all agent names
export function listAgents(): string[] {
  return builtInAgents.map(a => a.name)
}

// Convert to AgentInfo
export function toAgentInfo(agent: Agent): AgentInfo {
  return {
    name: agent.name,
    mode: agent.mode,
    permission: agent.permission
  }
}