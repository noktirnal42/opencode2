// Memory Types
export interface MemoryFile {
  path: string
  name: string
  description?: string
  modifiedAt: number
  content?: string
}

// Memory entry in durable memory
export interface MemoryEntry {
  id: string
  type: 'fact' | 'pattern' | 'warning' | 'context'
  content: string
  source?: string
  createdAt: number
  updatedAt: number
}

// Auto-memory config
export interface AutoMemoryConfig {
  enabled: boolean
  minHours?: number       // Default: 24
  minSessions?: number    // Default: 5
}

// Memory consolidation result
export interface ConsolidationResult {
  added: number
  updated: number
  pruned: number
  errors: string[]
}

// Relevant memory for RAG
export interface RelevantMemory {
  path: string
  content: string
  relevance: number
}