// Memory System - Export all memory modules
export * from './types'
export * from './rag'

// Quick initialization
export async function initMemorySystem(workspacePath: string): Promise<void> {
  const { initMemory } = await import('./rag')
  await initMemory(workspacePath)
}

// Export all functions
export { memory } from './rag'