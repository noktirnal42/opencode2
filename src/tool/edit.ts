// Edit Tool - Edit files with find/replace
import { z } from 'zod'
import { BaseTool, type ToolContext, type ToolResult } from '@/types/tool'
import * as fs from 'fs/promises'
import * as path from 'path'

export const EditInputSchema = z.object({
  path: z.string().describe('Path to file to edit'),
  oldString: z.string().describe('The exact text to find and replace'),
  newString: z.string().describe('The replacement text')
})

export type EditInput = z.infer<typeof EditInputSchema>

export class EditTool extends BaseTool<EditInput, { success: boolean; diff: string }> {
  readonly name = 'edit'
  readonly description = 'Make precise, targeted edits to existing files by replacing specific text'
  readonly inputSchema = EditInputSchema

  async execute(context: ToolContext, input: EditInput): Promise<ToolResult<{ success: boolean; diff: string }>> {
    try {
      // Resolve path relative to cwd
      const filePath = path.isAbsolute(input.path) 
        ? input.path 
        : path.join(context.cwd, input.path)
      
      // Read current file content
      let content: string
      try {
        content = await fs.readFile(filePath, 'utf-8')
      } catch {
        return {
          content: `Error: File not found: ${input.path}`,
          error: 'FILE_NOT_FOUND'
        }
      }

      // Check if oldString exists
      if (!content.includes(input.oldString)) {
        return {
          content: `Error: Could not find the specified text in ${input.path}.\nThe oldString was not found in the file.`,
          error: 'STRING_NOT_FOUND'
        }
      }

      // Replace text
      const newContent = content.replace(input.oldString, input.newString)
      
      // Write updated content
      await fs.writeFile(filePath, newContent, 'utf-8')
      
      // Generate simple diff
      const diff = `--- ${input.path}\n+++ ${input.path}\n@@ -1 +1 @@\n-${input.oldString}\n+${input.newString}`
      
      return {
        content: `File edited: ${input.path}`,
        data: { success: true, diff }
      }
    } catch (error) {
      return {
        content: `Error editing file: ${error instanceof Error ? error.message : String(error)}`,
        error: 'EDIT_ERROR'
      }
    }
  }
}

export const editTool = new EditTool()