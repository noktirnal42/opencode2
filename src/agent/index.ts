// Agent System - Built-in agents
import { type AgentInfo, type PermissionSet } from '@/types/tool'

// Re-export full agent definitions with system prompts
export { 
  jeevesAgent, apexAgent, jewlAgent, cypherAgent,
  buildAgent, planAgent, exploreAgent,
  type Agent 
} from './agents'

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

// Re-export helper functions from agents
export { getAgent, listAgents, toAgentInfo, allAgents, getSubAgents } from './agents'
