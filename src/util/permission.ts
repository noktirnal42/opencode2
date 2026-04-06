// Permission System - Modes, Rules, and Evaluation

export type PermissionMode = 'default' | 'acceptEdits' | 'bypassPermissions' | 'dontAsk' | 'plan'
export type PermissionBehavior = 'allow' | 'deny' | 'ask'

export interface PermissionRule {
  tool: string
  behavior: PermissionBehavior
  content?: string  // Optional content filter (e.g., pattern match)
}

export interface PermissionConfig {
  mode: PermissionMode
  rules: PermissionRule[]
}

export interface PermissionResult {
  allowed: boolean
  requiresConfirmation: boolean
  reason?: string
}

// Default dangerous commands that need confirmation
const DANGEROUS_PATTERNS = [
  /^rm\s+-rf\s+\//,           // Root delete
  /^rm\s+-rf\s+~\//,          // Home delete
  /^sudo\s+/,                  // Sudo
  /^chmod\s+777/,              // Wild permissions
  /^dd\s+if=/,                // Disk write
  /^mkfs/,                    // Format
  /^>+\s*\/dev\//,           // Write to device
]

// Default dangerous tool patterns
const DANGEROUS_TOOLS = ['bash', 'write', 'edit']

// Get default rules based on tool
function getDefaultRule(tool: string): PermissionBehavior {
  if (DANGEROUS_TOOLS.includes(tool)) {
    return 'ask'
  }
  return 'allow'
}

// Check if content matches dangerous patterns
function matchesDangerousPattern(command: string): boolean {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return true
    }
  }
  return false
}

// Permission Evaluator
export class PermissionEvaluator {
  private config: PermissionConfig
  
  constructor(config?: Partial<PermissionConfig>) {
    this.config = {
      mode: config?.mode ?? 'default',
      rules: config?.rules ?? []
    }
  }
  
  setMode(mode: PermissionMode): void {
    this.config.mode = mode
  }
  
  getMode(): PermissionMode {
    return this.config.mode
  }
  
  addRule(rule: PermissionRule): void {
    this.config.rules.push(rule)
  }
  
  clearRules(): void {
    this.config.rules = []
  }
  
  // Evaluate permission for a tool
  evaluate(tool: string, content?: string): PermissionResult {
    // Bypass mode - allow everything
    if (this.config.mode === 'bypassPermissions') {
      return { allowed: true, requiresConfirmation: false }
    }
    
    // Plan mode - read only
    if (this.config.mode === 'plan') {
      const readOnlyTools = ['read', 'grep', 'glob', 'webfetch', 'websearch']
      if (readOnlyTools.includes(tool)) {
        return { allowed: true, requiresConfirmation: false }
      }
      return { allowed: false, requiresConfirmation: false, reason: 'Plan mode: only read operations allowed' }
    }
    
    // Check explicit rules first
    for (const rule of this.config.rules) {
      if (rule.tool === tool) {
        if (rule.content && content) {
          // Content-specific rule
          if (content.includes(rule.content)) {
            return {
              allowed: rule.behavior !== 'deny',
              requiresConfirmation: rule.behavior === 'ask',
              reason: `Rule matched: ${rule.behavior} for "${rule.content}"`
            }
          }
        } else if (!rule.content) {
          // Tool-level rule
          return {
            allowed: rule.behavior !== 'deny',
            requiresConfirmation: rule.behavior === 'ask',
            reason: `Rule matched: ${rule.behavior} for ${tool}`
          }
        }
      }
    }
    
    // Default mode behavior
    if (this.config.mode === 'acceptEdits') {
      // Auto-accept edits, ask for dangerous commands
      if (tool === 'bash' && content && matchesDangerousPattern(content)) {
        return { allowed: true, requiresConfirmation: true, reason: 'Dangerous command detected' }
      }
      return { allowed: true, requiresConfirmation: false }
    }
    
    if (this.config.mode === 'dontAsk') {
      // Allow but don't ask - use defaults
      const defaultBehavior = getDefaultRule(tool)
      return { allowed: defaultBehavior !== 'deny', requiresConfirmation: false }
    }
    
    // Default mode - ask for dangerous
    if (tool === 'bash' && content && matchesDangerousPattern(content)) {
      return { allowed: true, requiresConfirmation: true, reason: 'Dangerous command requires confirmation' }
    }
    
    if (tool === 'bash' || tool === 'write' || tool === 'edit') {
      return { allowed: true, requiresConfirmation: true, reason: 'Write operation requires confirmation' }
    }
    
    return { allowed: true, requiresConfirmation: false }
  }
  
  // Batch evaluate multiple tools
  evaluateMany(requests: Array<{ tool: string; content?: string }>): PermissionResult[] {
    return requests.map(r => this.evaluate(r.tool, r.content))
  }
}

// Dangerous command warning
export function getDangerousWarning(command: string): string | null {
  if (matchesDangerousPattern(command)) {
    return `⚠️  Warning: This command appears dangerous!\n\nCommand: ${command}\n\nAre you sure you want to proceed?`
  }
  return null
}

// Parse permission string to rules
export function parsePermissionString(perm: string): PermissionRule[] {
  const rules: PermissionRule[] = []
  
  // Format: "allow:read,write deny:bash ask:edit"
  const parts = perm.split(/\s+/)
  
  for (const part of parts) {
    const [behavior, tools] = part.split(':')
    if (!behavior || !tools) continue
    
    const b = behavior.toLowerCase() as PermissionBehavior
    if (!['allow', 'deny', 'ask'].includes(b)) continue
    
    for (const tool of tools.split(',')) {
      rules.push({ tool: tool.trim(), behavior: b })
    }
  }
  
  return rules
}

// Export singleton
export const defaultPermissionEvaluator = new PermissionEvaluator()