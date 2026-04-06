// Glob Tool - Find files by pattern
import { z } from 'zod'
import { BaseTool, type ToolContext, type ToolResult } from '@/types/tool'
import { glob } from 'glob'
import * as path from 'path'

export const GlobInputSchema = z.object({
  pattern: z.string().describe('Glob pattern to match (e.g., "src/**/*.ts")'),
  path: z.string().optional().describe('Directory to search in (default: cwd)'),
  ignore: z.string().optional().describe('Patterns to ignore (comma-separated)'),
  absolute: z.boolean().optional().describe('Return absolute paths (default: false)')
})

export type GlobInput = z.infer<typeof GlobInputSchema>

export class GlobTool extends BaseTool<GlobInput, string[]> {
  readonly name = 'glob'
  readonly description = 'Find files matching a glob pattern'
  readonly inputSchema = GlobInputSchema

  async execute(context: ToolContext, input: GlobInput): Promise<ToolResult<string[]>> {
    try {
      const searchPath = input.path 
        ? path.join(context.cwd, input.path) 
        : context.cwd
      
      const ignorePatterns = input.ignore?.split(',').map(p => p.trim()) ?? []
      
      const files = await glob(input.pattern, {
        cwd: searchPath,
        ignore: ignorePatterns,
        absolute: input.absolute ?? false,
        nodir: true
      })
      
      // Sort by name
      files.sort()
      
      return {
        content: files.length > 0 
          ? files.join('\n')
          : `No files found matching "${input.pattern}"`,
        data: files
      }
    } catch (error) {
      return {
        content: `Error finding files: ${error instanceof Error ? error.message : String(error)}`,
        error: 'GLOB_ERROR',
        data: []
      }
    }
  }
}

export const globTool = new GlobTool()