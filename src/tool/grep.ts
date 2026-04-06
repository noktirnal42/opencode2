// Grep Tool - Search for text in files
import { z } from 'zod'
import { BaseTool, type ToolContext, type ToolResult } from '@/types/tool'
import * as fs from 'fs/promises'
import * as path from 'path'
import { glob } from 'glob'

export const GrepInputSchema = z.object({
  pattern: z.string().describe('Pattern to search for'),
  path: z.string().optional().describe('Directory to search in (default: cwd)'),
  include: z.string().optional().describe('File patterns to include (e.g., "*.ts,*.js")'),
  exclude: z.string().optional().describe('File patterns to exclude'),
  count: z.boolean().optional().describe('Show only count of matches'),
  ignoreCase: z.boolean().optional().describe('Case insensitive search (default: false)')
})

export type GrepInput = z.infer<typeof GrepInputSchema>

interface GrepMatch {
  file: string
  line: number
  content: string
}

export class GrepTool extends BaseTool<GrepInput, GrepMatch[]> {
  readonly name = 'grep'
  readonly description = 'Search for text patterns in files'
  readonly inputSchema = GrepInputSchema

  async execute(context: ToolContext, input: GrepInput): Promise<ToolResult<GrepMatch[]>> {
    try {
      const searchPath = input.path 
        ? path.join(context.cwd, input.path) 
        : context.cwd
      
      // Build glob pattern for files to search
      const includePattern = input.include ?? '**/*'
      const excludePatterns = input.exclude?.split(',').map(p => p.trim()) ?? []
      
      const files = await glob(includePattern, {
        cwd: searchPath,
        ignore: excludePatterns,
        absolute: false
      })
      
      const matches: GrepMatch[] = []
      const searchRegex = input.ignoreCase 
        ? new RegExp(input.pattern, 'gi') 
        : new RegExp(input.pattern, 'g')
      
      // Search each file
      for (const file of files.slice(0, 100)) {  // Limit to 100 files
        try {
          const filePath = path.join(searchPath, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const lines = content.split('\n')
          
          for (let i = 0; i < lines.length; i++) {
            if (searchRegex.test(lines[i])) {
              matches.push({
                file: file,
                line: i + 1,
                content: lines[i].trim()
              })
              
              if (matches.length >= 100) break  // Limit total matches
            }
          }
        } catch {
          // Skip files we can't read
        }
      }
      
      if (matches.length === 0) {
        return {
          content: `No matches found for "${input.pattern}"`,
          data: []
        }
      }
      
      // Format output
      const output = input.count 
        ? `Found ${matches.length} matches`
        : matches.map(m => `${m.file}:${m.line}: ${m.content}`).join('\n')
      
      return {
        content: output,
        data: matches
      }
    } catch (error) {
      return {
        content: `Error searching: ${error instanceof Error ? error.message : String(error)}`,
        error: 'SEARCH_ERROR',
        data: []
      }
    }
  }
}

export const grepTool = new GrepTool()