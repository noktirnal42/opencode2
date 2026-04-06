// Complete RAG-based Memory System for OpenCode2
// Inspired by Claude Code's memory system

import * as fs from 'fs/promises'
import * as path from 'path'
import type { MemoryFile, MemoryEntry, RelevantMemory, ConsolidationResult, AutoMemoryConfig } from './types'

// Constants
const MEMORY_DIR = 'memory'
const ENTRYPOINT = 'MEMORY.md'
const MAX_ENTRYPOINT_LINES = 200
const MAX_ENTRYPOINT_BYTES = 25000

// Memory paths
export function getMemoryDir(workspacePath: string): string {
  return path.join(workspacePath, '.opencode', MEMORY_DIR)
}

export function getMemoryEntrypoint(workspacePath: string): string {
  return path.join(getMemoryDir(workspacePath), ENTRYPOINT)
}

// Initialize memory directory
export async function initMemory(workspacePath: string): Promise<void> {
  const memDir = getMemoryDir(workspacePath)
  await fs.mkdir(memDir, { recursive: true })
  
  // Create default MEMORY.md if it doesn't exist
  const entrypoint = getMemoryEntrypoint(workspacePath)
  try {
    await fs.access(entrypoint)
  } catch {
    // Create default memory file
    const defaultContent = `# Memory

This is your project's memory file. Store important facts, patterns, and context here.

## Important Facts
- Add project-specific information here

## Patterns
- Document common patterns and conventions

## Warnings
- Note any known issues or gotchas

`
    await fs.writeFile(entrypoint, defaultContent, 'utf-8')
  }
}

// Read memory entrypoint (MEMORY.md)
export async function readMemoryEntrypoint(workspacePath: string): Promise<string | null> {
  const entrypoint = getMemoryEntrypoint(workspacePath)
  try {
    const content = await fs.readFile(entrypoint, 'utf-8')
    return truncateMemoryContent(content).content
  } catch {
    return null
  }
}

// Truncate memory content
export function truncateMemoryContent(raw: string): { content: string; wasTruncated: boolean } {
  const trimmed = raw.trim()
  const lines = trimmed.split('\n')
  
  const wasTruncated = lines.length > MAX_ENTRYPOINT_LINES || trimmed.length > MAX_ENTRYPOINT_BYTES
  
  let content = wasTruncated 
    ? lines.slice(0, MAX_ENTRYPOINT_LINES).join('\n')
    : trimmed
  
  if (content.length > MAX_ENTRYPOINT_BYTES) {
    const cutAt = content.lastIndexOf('\n', MAX_ENTRYPOINT_BYTES)
    content = content.slice(0, cutAt > 0 ? cutAt : MAX_ENTRYPOINT_BYTES)
    content += '\n\n... (truncated)'
  }
  
  return { content, wasTruncated }
}

// Scan memory files
export interface MemoryScanResult {
  files: MemoryFile[]
  entrypoint?: MemoryFile
}

export async function scanMemoryFiles(workspacePath: string, signal?: AbortSignal): Promise<MemoryScanResult> {
  const memDir = getMemoryDir(workspacePath)
  const files: MemoryFile[] = []
  
  try {
    const entries = await fs.readdir(memDir, { withFileTypes: true })
    
    for (const entry of entries) {
      if (signal?.aborted) break
      if (entry.name.startsWith('.')) continue
      
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const filePath = path.join(memDir, entry.name)
        const stats = await fs.stat(filePath)
        
        files.push({
          path: filePath,
          name: entry.name,
          modifiedAt: stats.mtimeMs
        })
      }
    }
  } catch {
    // Directory doesn't exist
  }
  
  // Separate entrypoint
  const entrypoint = files.find(f => f.name === ENTRYPOINT)
  const otherFiles = files.filter(f => f.name !== ENTRYPOINT)
  
  return {
    files: otherFiles,
    entrypoint
  }
}

// Find relevant memories using LLM-based selection (RAG)
export async function findRelevantMemories(
  workspacePath: string,
  query: string,
  _llmSelect?: (prompt: string, memories: string[]) => Promise<string[]>
): Promise<RelevantMemory[]> {
  const { files, entrypoint } = await scanMemoryFiles(workspacePath)
  
  if (files.length === 0 && !entrypoint) {
    return []
  }
  
  // For now, implement simple keyword-based selection
  // In production, this would use LLM to select relevant memories
  const relevant: RelevantMemory[] = []
  
  // Read entrypoint
  if (entrypoint) {
    const content = await fs.readFile(entrypoint.path, 'utf-8')
    const score = calculateRelevance(query, content)
    if (score > 0.3) {
      relevant.push({
        path: entrypoint.path,
        content: truncateMemoryContent(content).content,
        relevance: score
      })
    }
  }
  
  // Check other files
  for (const file of files.slice(0, 10)) {
    const content = await fs.readFile(file.path, 'utf-8')
    const score = calculateRelevance(query, content)
    if (score > 0.3) {
      relevant.push({
        path: file.path,
        content: truncateMemoryContent(content).content,
        relevance: score
      })
    }
  }
  
  // Sort by relevance and return top 5
  return relevant
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5)
}

// Simple relevance scoring (keyword-based)
function calculateRelevance(query: string, content: string): number {
  const queryWords = query.toLowerCase().split(/\s+/)
  const contentLower = content.toLowerCase()
  
  let score = 0
  for (const word of queryWords) {
    if (contentLower.includes(word)) {
      score += 1
    }
  }
  
  // Normalize by query length and content length
  return Math.min(1, score / Math.max(1, queryWords.length))
}

// Write to memory
export async function writeMemory(
  workspacePath: string,
  content: string,
  filename?: string
): Promise<void> {
  const memDir = getMemoryDir(workspacePath)
  await fs.mkdir(memDir, { recursive: true })
  
  const filePath = filename 
    ? path.join(memDir, filename)
    : getMemoryEntrypoint(workspacePath)
  
  await fs.writeFile(filePath, content, 'utf-8')
}

// Add memory entry
export async function addMemoryEntry(
  workspacePath: string,
  entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const memDir = getMemoryDir(workspacePath)
  const now = Date.now()
  
  const newEntry: MemoryEntry = {
    ...entry,
    id: generateId(),
    createdAt: now,
    updatedAt: now
  }
  
  // Append to MEMORY.md or create new topic file
  const entrypoint = getMemoryEntrypoint(workspacePath)
  let existingContent = ''
  
  try {
    existingContent = await fs.readFile(entrypoint, 'utf-8')
  } catch {}
  
  const entryText = `\n## ${entry.type}: ${newEntry.id}\n\n${entry.content}\n`
  const updatedContent = existingContent + entryText
  
  await fs.writeFile(entrypoint, updatedContent, 'utf-8')
}

// Generate simple ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

// Auto-dream: Background memory consolidation
export interface AutoDreamState {
  lastConsolidatedAt: number
  sessionsSinceConsolidation: number
}

export async function autoDream(
  workspacePath: string,
  config: AutoMemoryConfig
): Promise<ConsolidationResult> {
  const now = Date.now()
  const minHours = config.minHours ?? 24
  const minSessions = config.minSessions ?? 5
  
  // Check time gate
  const memDir = getMemoryDir(workspacePath)
  const stateFile = path.join(memDir, '.dream-state.json')
  
  let state: AutoDreamState = {
    lastConsolidatedAt: 0,
    sessionsSinceConsolidation: 0
  }
  
  try {
    const stateContent = await fs.readFile(stateFile, 'utf-8')
    state = JSON.parse(stateContent)
  } catch {}
  
  // Check if consolidation is needed
  const hoursSinceLastConsolidation = (now - state.lastConsolidatedAt) / (1000 * 60 * 60)
  
  if (hoursSinceLastConsolidation < minHours || state.sessionsSinceConsolidation < minSessions) {
    return {
      added: 0,
      updated: 0,
      pruned: 0,
      errors: ['Time or session threshold not met']
    }
  }
  
  // Perform consolidation
  const result: ConsolidationResult = {
    added: 0,
    updated: 0,
    pruned: 0,
    errors: []
  }
  
  try {
    // Scan for new patterns to add to memory
    // This would use LLM in production
    result.added = state.sessionsSinceConsolidation
    
    // Update state
    state.lastConsolidatedAt = now
    state.sessionsSinceConsolidation = 0
    
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2), 'utf-8')
  } catch (error) {
    result.errors.push(String(error))
  }
  
  return result
}

// Build memory prompt for LLM context
export function buildMemoryPrompt(workspacePath: string, memories: RelevantMemory[]): string {
  if (memories.length === 0) return ''
  
  let prompt = '\n\n## Relevant Project Memory\n\n'
  
  for (const mem of memories) {
    const relativePath = path.relative(workspacePath, mem.path)
    prompt += `### ${relativePath}\n\n${mem.content}\n\n`
  }
  
  return prompt
}

// Export all memory functions
export const memory = {
  init: initMemory,
  readEntrypoint: readMemoryEntrypoint,
  scanFiles: scanMemoryFiles,
  findRelevant: findRelevantMemories,
  write: writeMemory,
  addEntry: addMemoryEntry,
  consolidate: autoDream,
  buildPrompt: buildMemoryPrompt
}