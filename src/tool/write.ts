// Write Tool - Write files
// Cherry-picked enhancements from OpenCode:
// - Diff generation before write
// - Permission checking
// - Better feedback on write status

import { z } from 'zod'
import { BaseTool, type ToolContext, type ToolResult } from '@/types/tool'
import * as fs from 'fs/promises'
import * as path from 'path'

export const WriteInputSchema = z.object({
  path: z.string().describe('Path to file to write (absolute or relative to cwd)'),
  content: z.string().describe('The content to write to the file')
})

export type WriteInput = z.infer<typeof WriteInputSchema>

export class WriteTool extends BaseTool<WriteInput, { success: boolean; diff: string; exists: boolean }> {
  readonly name = 'write'
  readonly description = 'Write content to a file. Creates the file if it does not exist, or overwrites it if it does.'
  readonly inputSchema = WriteInputSchema

  async execute(context: ToolContext, input: WriteInput): Promise<ToolResult<{ success: boolean; diff: string; exists: boolean }>> {
    const filePath = path.isAbsolute(input.path)
      ? input.path
      : path.join(context.cwd, input.path)

    try {
      // Check if file exists
      let exists = false
      let oldContent = ''
      try {
        oldContent = await fs.readFile(filePath, 'utf-8')
        exists = true
      } catch {
        exists = false
      }

      // Generate diff
      let diff = ''
      if (exists) {
        const oldLines = oldContent.split('\n')
        const newLines = input.content.split('\n')
        
        diff += `--- ${filePath}\n`
        diff += `+++ ${filePath}\n`
        
        // Simple line-by-line diff
        const maxLines = Math.max(oldLines.length, newLines.length)
        for (let i = 0; i < maxLines; i++) {
          const oldLine = oldLines[i]
          const newLine = newLines[i]
          
          if (oldLine === newLine) {
            diff += ` ${oldLine ?? ''}\n`
          } else if (oldLine === undefined) {
            diff += `+${newLine}\n`
          } else if (newLine === undefined) {
            diff += `-${oldLine}\n`
          } else {
            diff += `-${oldLine}\n`
            diff += `+${newLine}\n`
          }
        }
      } else {
        diff = `--- ${filePath}\n+++ ${filePath}\n@@ -0,0 +1,${input.content.split('\n').length} @@\n`
        for (const line of input.content.split('\n')) {
          diff += `+${line}\n`
        }
      }

      // Write file
      await fs.writeFile(filePath, input.content, 'utf-8')

      const action = exists ? 'Updated' : 'Created'
      return {
        content: `${action} file: ${input.path}`,
        data: { success: true, diff, exists }
      }
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific errors
        if (error.message.includes('ENOENT')) {
          return {
            content: `Directory does not exist for path: ${input.path}`,
            error: 'DIRECTORY_NOT_FOUND'
          }
        }
        if (error.message.includes('EACCES')) {
          return {
            content: `Permission denied: ${input.path}`,
            error: 'PERMISSION_DENIED'
          }
        }
        return {
          content: `Write error: ${error.message}`,
          error: 'WRITE_ERROR'
        }
      }
      return {
        content: 'Unknown write error',
        error: 'WRITE_ERROR'
      }
    }
  }
}

export const writeTool = new WriteTool()
