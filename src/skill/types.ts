// Skill Types
export interface SkillFrontmatter {
  name: string
  description: string
  when?: string        // Trigger pattern (e.g., "/project-prompt")
  tools?: string[]     // Tools allowed in this skill
  env?: Record<string, string>
}

export interface Skill {
  name: string
  description: string
  trigger: string       // Command to invoke skill
  tools: string[]      // Allowed tools
  content: string      // Skill prompt/instructions
  env: Record<string, string>
  source: 'bundled' | 'user' | 'project' | 'mcp'
}

// Skill execution context
export interface SkillContext {
  cwd: string
  trigger: string
  args: string[]
  sessionId: string
}

// Skill result
export interface SkillResult {
  success: boolean
  output: string
  toolCalls?: string[]
  error?: string
}