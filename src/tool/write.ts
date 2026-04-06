// Write Tool - Write/create files
import { z } from 'zod'
import { BaseTool, type ToolContext, type ToolResult } from '@/types/tool'
import * as fs from 'fs/promises'
import * as path from 'path'

export const WriteInputSchema = z.object({
  path: z.string().describe('Path to file to write'),
  content: z.string().describe('Content to write to file')
})

export type WriteInput = z.infer<typeof WriteInputSchema>

export class WriteTool extends BaseTool<WriteInput, { created: boolean }> {
  readonly name = 'write'
  readonly description = 'Write content to a file, creating it if necessary'
  readonly inputSchema = WriteInputSchema

  async execute(context: ToolContext, input: WriteInput): Promise<ToolResult<{ created: boolean }>> {
    try {
      // Resolve path relative to cwd
      const filePath = path.isAbsolute(input.path) 
        ? input.path 
        : path.join(context.cwd, input.path)
      
      // Get directory path and ensure it exists
      const dir = path.dirname(filePath)
      await fs.mkdir(dir, { recursive: true })
      
      // Check if file exists
      let created = false
      try {
        await fs.access(filePath)
      } catch {
        created = true
      }
      
      // Write file
      await fs.writeFile(filePath, input.content, 'utf-8')
      
      return {
        content: created 
          ? `File created: ${input.path}` 
          : `File updated: ${input.path}`,
        data: { created }
      }
    } catch (error) {
      return {
        content: `Error writing file: ${error instanceof Error ? error.message : String(error)}`,
        error: 'WRITE_ERROR'
      }
    }
  }
}

export const writeTool = new WriteTool()