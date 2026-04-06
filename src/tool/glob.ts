// Glob Tool - Find files by pattern
// Cherry-picked enhancements from OpenCode:
// - Sort results by modification time
// - Better truncation handling

import { z } from 'zod'
import { BaseTool, type ToolContext, type ToolResult } from '@/types/tool'
import * as fs from 'fs/promises'
import * as path from 'path'

const MAX_RESULTS = 100

export const GlobInputSchema = z.object({
  pattern: z.string().describe('The glob pattern to match (e.g., "**/*.ts", "src/**/*.js")'),
  path: z.string().optional().describe('Directory to search in (defaults to cwd)')
})

export type GlobInput = z.infer<typeof GlobInputSchema>

// Simple glob implementation
async function glob(pattern: string, root: string): Promise<string[]> {
  const results: string[] = []
  
  // Normalize pattern
  const normalizedPattern = pattern.replace(/\\/g, '/')
  
  // Get parts of the pattern
  const parts = normalizedPattern.split('/')
  const isRecursive = parts.includes('**')
  
  async function walk(dir: string, patternParts: string[], depth: number): Promise<void> {
    if (results.length >= MAX_RESULTS * 2) return // Early exit for performance
    
    const [current, ...rest] = patternParts
    
    if (!current) {
      // No more pattern parts - this is a match
      results.push(dir)
      return
    }
    
    if (current === '**') {
      // Recursive wildcard - walk all directories
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const fullPath = path.join(dir, entry.name)
            await walk(fullPath, patternParts, depth + 1)
            // Also recurse into rest of pattern
            if (rest.length > 0) {
              await walk(fullPath, rest, depth + 1)
            }
          }
        }
      } catch { /* ignore */ }
      return
    }
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      // Convert glob pattern to regex
      const regex = patternToRegex(current)
      
      for (const entry of entries) {
        if (regex.test(entry.name)) {
          const fullPath = path.join(dir, entry.name)
          
          // Check if we should continue recursing
          if (entry.isDirectory() && rest.length > 0) {
            await walk(fullPath, rest, depth + 1)
          } else if (entry.isFile()) {
            if (rest.length === 0) {
              results.push(fullPath)
            }
          }
        }
      }
    } catch { /* ignore */ }
  }
  
  // Start from root
  try {
    await walk(root, parts, 0)
  } catch { /* ignore */ }
  
  return results.slice(0, MAX_RESULTS * 2)
}

function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
  return new RegExp(`^${escaped}$`, 'i')
}

export class GlobTool extends BaseTool<GlobInput, { files: string[]; count: number; truncated: boolean }> {
  readonly name = 'glob'
  readonly description = 'Find files matching a glob pattern'
  readonly inputSchema = GlobInputSchema

  async execute(context: ToolContext, input: GlobInput): Promise<ToolResult<{ files: string[]; count: number; truncated: boolean }>> {
    if (!input.pattern) {
      return {
        content: 'Pattern is required',
        error: 'MISSING_PATTERN'
      }
    }

    const searchPath = input.path 
      ? path.resolve(context.cwd, input.path)
      : context.cwd

    try {
      // Check if directory exists
      const stats = await fs.stat(searchPath)
      if (!stats.isDirectory()) {
        return {
          content: `Path is not a directory: ${input.path}`,
          error: 'NOT_A_DIRECTORY'
        }
      }

      const matchedFiles = await glob(input.pattern, searchPath)

      // Get mtime for each file and sort by newest first
      const filesWithTime: Array<{ path: string; mtime: number }> = []
      for (const file of matchedFiles) {
        try {
          const stat = await fs.stat(file)
          filesWithTime.push({ path: file, mtime: stat.mtimeMs })
        } catch {
          // Skip files that can't be stat'd
        }
      }

      filesWithTime.sort((a, b) => b.mtime - a.mtime)
      const truncated = filesWithTime.length > MAX_RESULTS
      const files = filesWithTime.slice(0, MAX_RESULTS).map(f => f.path)

      const output: string[] = []
      if (files.length === 0) {
        output.push('No files found')
      } else {
        output.push(...files)
        if (truncated) {
          output.push('')
          output.push(`(Results truncated: showing first ${MAX_RESULTS} of ${filesWithTime.length} files)`)
        }
      }

      return {
        content: output.join('\n'),
        data: { 
          files, 
          count: filesWithTime.length,
          truncated
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        return {
          content: `Glob error: ${error.message}`,
          error: 'GLOB_ERROR'
        }
      }
      return {
        content: 'Unknown glob error',
        error: 'GLOB_ERROR'
      }
    }
  }
}

export const globTool = new GlobTool()
