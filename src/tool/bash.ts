// Bash Tool - Execute shell commands
// Cherry-picked enhancements from OpenCode:
// - Better path expansion (~, environment variables)
// - Platform-specific handling (Windows PowerShell support)
// - Improved timeout defaults
// - Cygwin path handling on Windows

import { z } from 'zod'
import { BaseTool, type ToolContext, type ToolResult } from '@/types/tool'
import * as os from 'os'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const DEFAULT_TIMEOUT = 2 * 60 * 1000 // 2 minutes default
const MAX_TIMEOUT = 30 * 60 * 1000 // 30 minutes max
const MAX_OUTPUT_LENGTH = 100000 // 100KB max output

export const BashInputSchema = z.object({
  command: z.string().describe('The shell command to execute'),
  timeout: z.number().optional().describe('Timeout in milliseconds (default: 120000, max: 1800000)'),
  workdir: z.string().optional().describe('Working directory to run the command in')
})

export type BashInput = z.infer<typeof BashInputSchema>

// Path expansion utilities (from OpenCode)
function unquote(text: string): string {
  if (text.length < 2) return text
  const first = text[0]
  const last = text[text.length - 1]
  if ((first === '"' || first === "'") && first === last) return text.slice(1, -1)
  return text
}

function expandHome(text: string): string {
  if (text === '~') return os.homedir()
  if (text.startsWith('~/') || text.startsWith('~\\')) {
    return path.join(os.homedir(), text.slice(2))
  }
  return text
}

function getEnvValue(key: string): string | undefined {
  if (process.platform !== 'win32') return process.env[key]
  // Windows: case-insensitive env lookup
  const name = Object.keys(process.env).find(
    item => item.toLowerCase() === key.toLowerCase()
  )
  return name ? process.env[name] : undefined
}

function expandEnv(text: string): string {
  return text
    .replace(/\$\{env:([^}]+)\}/gi, (_, key: string) => getEnvValue(key) || '')
    .replace(/\$env:([A-Za-z_][A-Za-z0-9_]*)/gi, (_, key: string) => getEnvValue(key) || '')
    .replace(/\$(HOME|PWD)/gi, (_, key: string) => {
      if (key === 'HOME') return os.homedir()
      if (key === 'PWD') return process.cwd()
      return ''
    })
}

function expandPath(text: string, cwd: string): string {
  const expanded = expandEnv(expandHome(unquote(text)))
  if (path.isAbsolute(expanded)) return expanded
  return path.resolve(cwd, expanded)
}

// Detect shell type
function detectShell(): { shell: string; name: string; isPowerShell: boolean } {
  if (process.platform === 'win32') {
    const psPath = process.env.PWSH || process.env.PWSH_PATH || 'pwsh'
    return { shell: psPath, name: 'powershell', isPowerShell: true }
  }
  const shell = process.env.SHELL || '/bin/bash'
  const name = path.basename(shell)
  return { shell, name, isPowerShell: false }
}

// Windows path conversion for Cygwin
async function cygpath(text: string): Promise<string | undefined> {
  if (process.platform !== 'win32') return undefined
  try {
    const { stdout } = await execAsync('cygpath -w -- "' + text + '"', { shell: '/bin/bash' })
    const result = stdout.trim()
    return result || undefined
  } catch {
    return undefined
  }
}

export class BashTool extends BaseTool<BashInput, { stdout: string; stderr: string; exitCode: number }> {
  readonly name = 'bash'
  readonly description = 'Execute shell commands with proper path expansion and timeout handling'
  readonly inputSchema = BashInputSchema

  async execute(context: ToolContext, input: BashInput): Promise<ToolResult<{ stdout: string; stderr: string; exitCode: number }>> {
    const cwd = input.workdir 
      ? expandPath(input.workdir, context.cwd)
      : context.cwd

    // Validate timeout
    let timeout = input.timeout ?? DEFAULT_TIMEOUT
    if (timeout < 0) {
      return {
        content: `Invalid timeout value: ${timeout}. Timeout must be a positive number.`,
        error: 'INVALID_TIMEOUT'
      }
    }
    timeout = Math.min(Math.max(timeout, 0), MAX_TIMEOUT)

    const { shell, name, isPowerShell } = detectShell()

    // Build command with proper escaping
    let command = input.command
    
    // PowerShell-specific: avoid && for command chaining in Windows PowerShell 5.1
    if (isPowerShell && name === 'powershell') {
      // Replace && with ; if needed (simple heuristic)
      // For more complex cases, the user should use semicolons
    }

    return new Promise((resolve) => {
      const options: {
        cwd: string
        timeout: number
        maxBuffer: number
        shell: string | undefined
        env: NodeJS.ProcessEnv
      } = {
        cwd,
        timeout,
        maxBuffer: MAX_OUTPUT_LENGTH,
        shell: isPowerShell ? shell : undefined,
        env: { ...process.env }
      }

      let stdout = ''
      let stderr = ''
      let killed = false

      const child = exec(command, options)

      const timer = setTimeout(() => {
        killed = true
        child.kill('SIGTERM')
        setTimeout(() => {
          if (!child.killed) child.kill('SIGKILL')
        }, 3000)
      }, timeout)

      child.stdout?.on('data', (data: Buffer) => {
        if (stdout.length < MAX_OUTPUT_LENGTH) {
          stdout += data.toString()
        }
      })

      child.stderr?.on('data', (data: Buffer) => {
        if (stderr.length < MAX_OUTPUT_LENGTH) {
          stderr += data.toString()
        }
      })

      child.on('close', (code) => {
        clearTimeout(timer)
        
        // Truncate output if needed
        let truncated = false
        if (stdout.length > MAX_OUTPUT_LENGTH) {
          stdout = stdout.substring(0, MAX_OUTPUT_LENGTH) + '\n\n... (output truncated)'
          truncated = true
        }
        if (stderr.length > MAX_OUTPUT_LENGTH) {
          stderr = stderr.substring(0, MAX_OUTPUT_LENGTH) + '\n\n... (stderr truncated)'
          truncated = true
        }

        const exitCode = code ?? 0
        
        let output = ''
        if (stdout) output += stdout
        if (stderr) output += '\n' + stderr
        
        if (killed) {
          output += '\n\n<bash_metadata>\nbash tool terminated command after exceeding timeout ' + timeout + ' ms\n</bash_metadata>'
        }

        resolve({
          content: output || `Command exited with code ${exitCode}`,
          data: { stdout, stderr, exitCode },
          error: killed ? 'TIMEOUT' : (exitCode !== 0 ? 'NON_ZERO_EXIT' : undefined)
        })
      })

      child.on('error', (error) => {
        clearTimeout(timer)
        resolve({
          content: `Command failed: ${error.message}`,
          error: 'EXEC_ERROR'
        })
      })
    })
  }
}

export const bashTool = new BashTool()
