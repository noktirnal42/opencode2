// Grep Tool - Search file contents
// Cherry-picked enhancements from OpenCode:
// - Sort results by modification time
// - Better truncation handling
// - Hidden files support

import { z } from 'zod'
import { BaseTool, type ToolContext, type ToolResult } from '@/types/tool'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'

const execAsync = promisify(exec)

const MAX_LINE_LENGTH = 2000
const MAX_RESULTS = 100

export const GrepInputSchema = z.object({
  pattern: z.string().describe('The regex pattern to search for'),
  path: z.string().optional().describe('Directory to search in (defaults to cwd)'),
  include: z.string().optional().describe('File pattern to include (e.g., "*.ts", "*.{js,ts}")'),
  exclude: z.string().optional().describe('File pattern to exclude')
})

export type GrepInput = z.infer<typeof GrepInputSchema>

export class GrepTool extends BaseTool<GrepInput, { matches: number; results: string }> {
  readonly name = 'grep'
  readonly description = 'Search for patterns in file contents using ripgrep'
  readonly inputSchema = GrepInputSchema

  async execute(context: ToolContext, input: GrepInput): Promise<ToolResult<{ matches: number; results: string }>> {
    if (!input.pattern) {
      return {
        content: 'Pattern is required',
        error: 'MISSING_PATTERN'
      }
    }

    const searchPath = input.path ? path.resolve(context.cwd, input.path) : context.cwd

    // Build ripgrep command
    const args = [
      '-nH',           // Show line numbers
      '--hidden',      // Include hidden files
      '--no-messages', // Suppress error messages
      '--field-match-separator=|',
      '--regexp', input.pattern
    ]

    if (input.include) {
      args.push('--glob', input.include)
    }

    if (input.exclude) {
      args.push('--glob', '!' + input.exclude)
    }

    args.push(searchPath)

    try {
      const { stdout, stderr, code } = await execAsync(
        'rg ' + args.map(a => `"${a}"`).join(' '),
        { 
          cwd: context.cwd,
          maxBuffer: 10 * 1024 * 1024 // 10MB
        }
      )

      // Exit codes: 0 = matches, 1 = no matches, 2 = errors
      if (code === 1) {
        return {
          content: 'No files found',
          data: { matches: 0, results: '' }
        }
      }

      if (code === 2 && !stdout.trim()) {
        return {
          content: `Search error: ${stderr || 'Unknown error'}`,
          error: 'GREP_ERROR'
        }
      }

      // Parse output: "filepath|lineNum|content"
      const lines = stdout.trim().split(/\r?\n/)
      const results: Array<{
        file: string
        line: number
        text: string
        mtime: number
      }> = []

      for (const line of lines) {
        if (!line) continue
        const parts = line.split('|')
        if (parts.length < 3) continue

        const [filePath, lineNumStr, ...textParts] = parts
        const lineNum = parseInt(lineNumStr, 10)
        const text = textParts.join('|')

        // Get file mtime
        let mtime = 0
        try {
          const fs = await import('fs/promises')
          const stat = await fs.stat(filePath)
          mtime = stat.mtimeMs
        } catch { /* ignore */ }

        results.push({ file: filePath, line: lineNum, text, mtime })
      }

      // Sort by modification time (newest first)
      results.sort((a, b) => b.mtime - a.mtime)

      const totalMatches = results.length
      const truncated = results.length > MAX_RESULTS
      const limited = truncated ? results.slice(0, MAX_RESULTS) : results

      // Format output
      const output: string[] = []
      let currentFile = ''

      for (const match of limited) {
        if (currentFile !== match.file) {
          if (currentFile !== '') output.push('')
          currentFile = match.file
          output.push(`${match.file}:`)
        }

        // Truncate long lines
        let lineText = match.text
        if (lineText.length > MAX_LINE_LENGTH) {
          lineText = lineText.substring(0, MAX_LINE_LENGTH) + '...'
        }

        output.push(`  Line ${match.line}: ${lineText}`)
      }

      if (truncated) {
        output.push('')
        output.push(`(Results truncated: showing ${MAX_RESULTS} of ${totalMatches} matches)`)
      }

      const outputStr = output.join('\n')

      return {
        content: `Found ${totalMatches} matches${truncated ? ` (showing first ${MAX_RESULTS})` : ''}`,
        data: { matches: totalMatches, results: outputStr }
      }
    } catch (error) {
      if (error instanceof Error) {
        return {
          content: `Grep error: ${error.message}`,
          error: 'GREP_ERROR'
        }
      }
      return {
        content: 'Unknown grep error',
        error: 'GREP_ERROR'
      }
    }
  }
}

export const grepTool = new GrepTool()
