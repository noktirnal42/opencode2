// Read Tool - Read file contents
import { z } from 'zod'
import { BaseTool, type ToolContext, type ToolResult } from '@/types/tool'
import * as fs from 'fs/promises'
import * as path from 'path'

export const ReadInputSchema = z.object({
  path: z.string().describe('Path to file to read'),
  offset: z.number().optional().describe('Line offset to start reading from'),
  limit: z.number().optional().describe('Maximum number of lines to read')
})

export type ReadInput = z.infer<typeof ReadInputSchema>

export class ReadTool extends BaseTool<ReadInput, string> {
  readonly name = 'read'
  readonly description = 'Read the contents of a file'
  readonly inputSchema = ReadInputSchema

  async execute(context: ToolContext, input: ReadInput): Promise<ToolResult<string>> {
    try {
      // Resolve path relative to cwd
      const filePath = path.isAbsolute(input.path) 
        ? input.path 
        : path.join(context.cwd, input.path)
      
      // Check if file exists
      try {
        await fs.access(filePath)
      } catch {
        return {
          content: `Error: File not found: ${input.path}`,
          error: 'FILE_NOT_FOUND'
        }
      }

      // Read file content
      let content = await fs.readFile(filePath, 'utf-8')
      
      // Handle offset and limit
      const lines = content.split('\n')
      
      if (input.offset !== undefined || input.limit !== undefined) {
        const start = input.offset ?? 0
        const count = input.limit ?? lines.length
        const selectedLines = lines.slice(start, start + count)
        content = selectedLines.join('\n')
        
        if (input.offset !== undefined || input.limit !== undefined) {
          content = `// File: ${input.path} (lines ${input.offset ?? 0}-${input.offset! + selectedLines.length})\n\n${content}`
        }
      }
      
      return {
        content,
        data: content
      }
    } catch (error) {
      return {
        content: `Error reading file: ${error instanceof Error ? error.message : String(error)}`,
        error: 'READ_ERROR'
      }
    }
  }
}

export const readTool = new ReadTool()