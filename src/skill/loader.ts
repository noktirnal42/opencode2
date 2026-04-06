// Skill Loader - Load and parse skills from files
import * as fs from 'fs/promises'
import * as path from 'path'
import matter from 'gray-matter'
import type { Skill, SkillFrontmatter } from './types'

// Parse frontmatter from skill file
function parseFrontmatter(content: string): { frontmatter: SkillFrontmatter; content: string } {
  const parsed = matter(content)
  return {
    frontmatter: parsed.data as SkillFrontmatter,
    content: parsed.content
  }
}

// Load skill from file
async function loadSkillFile(filePath: string, source: Skill['source']): Promise<Skill> {
  const content = await fs.readFile(filePath, 'utf-8')
  const { frontmatter, content: skillContent } = parseFrontmatter(content)
  
  // Use filename as trigger if not specified
  const trigger = frontmatter.when ?? `/${path.basename(filePath, '.md')}`
  
  return {
    name: frontmatter.name,
    description: frontmatter.description,
    trigger,
    tools: frontmatter.tools ?? [],
    content: skillContent.trim(),
    env: frontmatter.env ?? {},
    source
  }
}

// Scan directory for skill files
async function scanSkillDirectory(dirPath: string, source: Skill['source']): Promise<Skill[]> {
  const skills: Skill[] = []
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      
      const fullPath = path.join(dirPath, entry.name)
      
      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subSkills = await scanSkillDirectory(fullPath, source)
        skills.push(...subSkills)
      } else if (entry.name.endsWith('.md')) {
        try {
          const skill = await loadSkillFile(fullPath, source)
          skills.push(skill)
        } catch (error) {
          console.error(`Failed to load skill from ${fullPath}:`, error)
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist, return empty
  }
  
  return skills
}

// Skill Registry - holds all loaded skills
export class SkillRegistry {
  private skills: Map<string, Skill> = new Map()
  
  // Load skills from directory
  async loadFromDirectory(dirPath: string, source: Skill['source']): Promise<void> {
    const skills = await scanSkillDirectory(dirPath, source)
    
    for (const skill of skills) {
      this.skills.set(skill.trigger, skill)
    }
  }
  
  // Get skill by trigger
  get(trigger: string): Skill | undefined {
    return this.skills.get(trigger)
  }
  
  // List all skills
  list(): Skill[] {
    return Array.from(this.skills.values())
  }
  
  // List skills by source
  listBySource(source: Skill['source']): Skill[] {
    return this.list().filter(s => s.source === source)
  }
  
  // Check if skill exists
  has(trigger: string): boolean {
    return this.skills.has(trigger)
  }
  
  // Clear all skills
  clear(): void {
    this.skills.clear()
  }
}

// Global skill registry
export const skillRegistry = new SkillRegistry()

// Load bundled skills (built-in)
const BUNDLED_SKILLS_DIR = path.join(process.cwd(), 'skills', 'bundled')

// User skills directory
export function getUserSkillsDir(): string {
  return path.join(process.env.HOME ?? '.', '.opencode', 'skills')
}

// Project skills directory
export function getProjectSkillsDir(cwd: string): string {
  return path.join(cwd, '.opencode', 'skills')
}