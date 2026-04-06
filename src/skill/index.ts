// Skill System - Export all modules
export * from './types'
export * from './loader'
export * from './executor'

import { initSkills, listSkills, hasSkill, getSkill, executeSkill } from './executor'

// Quick initialization for CLI
export async function initializeSkills(cwd: string = process.cwd()): Promise<void> {
  await initSkills(cwd)
}

// Export for convenience
export const skills = {
  list: listSkills,
  has: hasSkill,
  get,
  execute: executeSkill
}