// Skill Executor - Execute skills
import { skillRegistry, getUserSkillsDir, getProjectSkillsDir } from './loader'
import type { Skill, SkillContext, SkillResult } from './types'

// Initialize skills from all sources
export async function initSkills(cwd: string): Promise<void> {
  // Load bundled skills
  const bundledDir = process.cwd() + '/skills/bundled'
  await skillRegistry.loadFromDirectory(bundledDir, 'bundled')
  
  // Load user skills
  const userDir = getUserSkillsDir()
  await skillRegistry.loadFromDirectory(userDir, 'user')
  
  // Load project skills
  const projectDir = getProjectSkillsDir(cwd)
  await skillRegistry.loadFromDirectory(projectDir, 'project')
}

// Execute a skill by trigger
export async function executeSkill(trigger: string, context: SkillContext): Promise<SkillResult> {
  const skill = skillRegistry.get(trigger)
  
  if (!skill) {
    return {
      success: false,
      output: `Skill not found: ${trigger}`,
      error: 'SKILL_NOT_FOUND'
    }
  }
  
  // Build the skill prompt
  const prompt = buildSkillPrompt(skill, context)
  
  return {
    success: true,
    output: prompt,
    toolCalls: skill.tools
  }
}

// Build prompt from skill
function buildSkillPrompt(skill: Skill, context: SkillContext): string {
  let prompt = skill.content
  
  // Add arguments if provided
  if (context.args.length > 0) {
    prompt += `\n\nUser arguments: ${context.args.join(' ')}`
  }
  
  return prompt
}

// List all available skills
export function listSkills(): { trigger: string; name: string; description: string; source: string }[] {
  return skillRegistry.list().map(s => ({
    trigger: s.trigger,
    name: s.name,
    description: s.description,
    source: s.source
  }))
}

// Check if skill exists
export function hasSkill(trigger: string): boolean {
  return skillRegistry.has(trigger)
}

// Get skill info
export function getSkill(trigger: string): Skill | undefined {
  return skillRegistry.get(trigger)
}