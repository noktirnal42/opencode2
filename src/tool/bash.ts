// Bash Tool - Execute shell commands
import { z } from 'zod'
import { BaseTool, type ToolContext, type ToolResult } from '@/types/tool'
import { spawn } from 'child_process'
import * as path from 'path'

export const BashInputSchema = z.object({
  command: z.string().describe('The shell command to execute'),
  description: z.string().optional().describe('Description of what the command does'),
  timeout: z.number().optional().describe('Timeout in milliseconds (default: 60000)')
})

export type BashInput = z.infer<typeof BashInputSchema>

export class BashTool extends BaseTool<BashInput, { stdout: string; stderr: string; exitCode: number }> {
  readonly name = 'bash'
  readonly description = 'Execute shell commands in the terminal'
  readonly inputSchema = BashInputSchema

  async execute(
    context: ToolContext, 
    input: BashInput
  ): Promise<ToolResult<{ stdout: string; stderr: string; exitCode: number }>> {
    return new Promise((resolve) => {
      const timeout = input.timeout ?? 60000
      const startTime = Date.now()
      
      // Determine shell based on platform
      const isWindows = process.platform === 'win32'
      const shell = isWindows ? 'cmd.exe' : '/bin/bash'
      const shellArgs = isWindows ? ['/c', input.command] : ['-c', input.command]
      
      const proc = spawn(shell, shellArgs, {
        cwd: context.cwd,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let stdout = ''
      let stderr = ''

      proc.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      proc.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      // Timeout handler
      const timeoutId = setTimeout(() => {
        proc.kill('SIGTERM')
        resolve({
          content: `Command timed out after ${timeout}ms: ${input.command}\n\nstdout: ${stdout}\nstderr: ${stderr}`,
          error: 'TIMEOUT',
          data: { stdout, stderr, exitCode: -1 }
        })
      }, timeout)

      proc.on('close', (exitCode) => {
        clearTimeout(timeoutId)
        const duration = Date.now() - startTime
        
        // Format output
        let output = ''
        if (stdout) output += stdout
        if (stderr) output += (output ? '\n' : '') + `stderr: ${stderr}`
        
        if (exitCode !== 0) {
          output += `\n\n(Command exited with code ${exitCode})`
        }
        
        resolve({
          content: output || `(Command completed with exit code ${exitCode} in ${duration}ms)`,
          data: { stdout, stderr, exitCode: exitCode ?? 0 }
        })
      })

      proc.on('error', (error) => {
        clearTimeout(timeoutId)
        resolve({
          content: `Error executing command: ${error.message}`,
          error: 'EXEC_ERROR',
          data: { stdout: '', stderr: error.message, exitCode: -1 }
        })
      })
    })
  }
}

export const bashTool = new BashTool()