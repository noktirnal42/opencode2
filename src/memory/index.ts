// Memory System - Export all memory modules
export * from './types'
export * from './rag'
export * from './vector'

// Re-export vector store
export { VectorStore, createVectorStore, hybridSearch } from './vector'
export type { VectorStoreConfig, VectorMemoryEntry, VectorSearchResult } from './vector'

// Quick initialization
export async function initMemorySystem(workspacePath: string): Promise<void> {
  const { initMemory } = await import('./rag')
  await initMemory(workspacePath)
}

// Export all functions
export { memory } from './rag'