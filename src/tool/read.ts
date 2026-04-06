// Read Tool - Read file contents
// Cherry-picked enhancements from OpenCode:
// - "Did you mean?" file suggestions for typos
// - Binary file detection with extension checking
// - Line truncation for very long lines
// - Better offset validation

import { z } from 'zod'
import { BaseTool, type ToolContext, type ToolResult } from '@/types/tool'
import * as fs from 'fs/promises'
import * as path from 'path'

const MAX_LINE_LENGTH = 2000
const MAX_LINE_SUFFIX = `... (line truncated to ${MAX_LINE_LENGTH} chars)`
const MAX_BYTES = 50 * 1024 // 50KB default max
const MAX_BYTES_LABEL = `${MAX_BYTES / 1024} KB`

export const ReadInputSchema = z.object({
  path: z.string().describe('Path to file to read'),
  offset: z.number().optional().describe('Line offset to start reading from (1-indexed)'),
  limit: z.number().optional().describe('Maximum number of lines to read')
})

export type ReadInput = z.infer<typeof ReadInputSchema>

// Binary file extensions (from OpenCode)
const BINARY_EXTENSIONS = new Set([
  '.zip', '.tar', '.gz', '.exe', '.dll', '.so', '.class', '.jar', '.war',
  '.7z', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp',
  '.bin', '.dat', '.obj', '.o', '.a', '.lib', '.wasm', '.pyc', '.pyo',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svg',
  '.mp3', '.mp4', '.wav', '.avi', '.mov', '.webm', '.ogg',
  '.pdf', '.ttf', '.woff', '.woff2', '.eot'
])

function isBinaryExtension(ext: string): boolean {
  return BINARY_EXTENSIONS.has(ext.toLowerCase())
}

async function isBinaryFile(filePath: string, fileSize: number): Promise<boolean> {
  const ext = path.extname(filePath).toLowerCase()
  if (isBinaryExtension(ext)) return true
  if (fileSize === 0) return false

  // Check first 4096 bytes for null bytes or non-printable chars
  const fh = await fs.open(filePath, 'r')
  try {
    const sampleSize = Math.min(4096, fileSize)
    const buffer = Buffer.alloc(sampleSize)
    const result = await fh.read(buffer, 0, sampleSize, 0)
    if (result.bytesRead === 0) return false

    let nonPrintableCount = 0
    for (let i = 0; i < result.bytesRead; i++) {
      if (buffer[i] === 0) return true
      if (buffer[i] < 9 || (buffer[i] > 13 && buffer[i] < 32)) {
        nonPrintableCount++
      }
    }
    return nonPrintableCount / result.bytesRead > 0.3
  } finally {
    await fh.close()
  }
}

// "Did you mean?" suggestions (from OpenCode)
async function suggestSimilarFiles(filePath: string): Promise<string[]> {
  try {
    const dir = path.dirname(filePath)
    const base = path.basename(filePath).toLowerCase()
    const items = await fs.readdir(dir)
    return items
      .filter(item => 
        item.toLowerCase().includes(base) || 
        base.includes(item.toLowerCase())
      )
      .slice(0, 3)
      .map(item => path.join(dir, item))
  } catch {
    return []
  }
}

async function listDirectory(dirPath: string, limit = 100): Promise<{ items: string[]; total: number }> {
  try {
    const items = await fs.readdir(dirPath)
    const sorted = items.sort((a, b) => a.localeCompare(b))
    return {
      items: sorted.slice(0, limit),
      total: sorted.length
    }
  } catch {
    return { items: [], total: 0 }
  }
}

export class ReadTool extends BaseTool<ReadInput, string> {
  readonly name = 'read'
  readonly description = 'Read the contents of a file or directory listing'
  readonly inputSchema = ReadInputSchema

  async execute(context: ToolContext, input: ReadInput): Promise<ToolResult<string>> {
    try {
      const filePath = path.isAbsolute(input.path) 
        ? input.path 
        : path.join(context.cwd, input.path)

      // Validate offset
      if (input.offset !== undefined && input.offset < 1) {
        return {
          content: 'Offset must be greater than or equal to 1',
          error: 'INVALID_OFFSET'
        }
      }

      // Check if file/directory exists
      let stats
      try {
        stats = await fs.stat(filePath)
      } catch {
        // File not found - suggest similar files
        const suggestions = await suggestSimilarFiles(filePath)
        if (suggestions.length > 0) {
          return {
            content: `File not found: ${input.path}\n\nDid you mean one of these?\n${suggestions.join('\n')}`,
            error: 'FILE_NOT_FOUND'
          }
        }
        return {
          content: `File not found: ${input.path}`,
          error: 'FILE_NOT_FOUND'
        }
      }

      // Handle directory listing
      if (stats.isDirectory()) {
        const { items, total } = await listDirectory(filePath, input.limit ?? 2000)
        const offset = input.offset ?? 1
        const start = offset - 1
        const sliced = items.slice(start, start + (input.limit ?? 2000))
        const truncated = start + sliced.length < total

        let output = `<path>${filePath}</path>\n<type>directory</type>\n<entries>\n`
        output += sliced.join('\n')
        if (truncated) {
          output += `\n\n(Showing ${sliced.length} of ${total} entries. Use offset=${offset + sliced.length} to continue.)`
        } else {
          output += `\n\n(${total} entries)`
        }
        output += '\n</entries>'

        return { content: output, data: output }
      }

      // Handle file
      let content = await fs.readFile(filePath, 'utf-8')
      const lines = content.split('\n')

      // Check for binary file
      if (await isBinaryFile(filePath, stats.size)) {
        return {
          content: `Cannot read binary file: ${input.path}`,
          error: 'BINARY_FILE'
        }
      }

      // Handle offset and limit
      const offset = input.offset ?? 1
      const limit = input.limit ?? 2000
      const start = offset - 1

      if (offset > lines.length && !(offset === 1 && lines.length === 0)) {
        return {
          content: `Offset ${offset} is out of range for this file (${lines.length} lines)`,
          error: 'OFFSET_OUT_OF_RANGE'
        }
      }

      const selectedLines = lines.slice(start, start + limit)
      let output = `<path>${filePath}</path>\n<type>file</type>\n<content>\n`
      
      // Add line numbers with truncation
      const truncatedLines: string[] = []
      for (let i = 0; i < selectedLines.length; i++) {
        let line = selectedLines[i]
        const lineNum = start + i + 1
        if (line.length > MAX_LINE_LENGTH) {
          line = line.substring(0, MAX_LINE_LENGTH) + MAX_LINE_SUFFIX
        }
        truncatedLines.push(`${lineNum}: ${line}`)
      }

      output += truncatedLines.join('\n')

      const last = start + selectedLines.length
      const next = last + 1
      const fileTruncated = selectedLines.length < lines.length

      if (fileTruncated) {
        output += `\n\n(Showing lines ${offset}-${last} of ${lines.length}. Use offset=${next} to continue.)`
      } else {
        output += `\n\n(End of file - total ${lines.length} lines)`
      }
      output += '\n</content>'

      return { content: output, data: output }
    } catch (error) {
      return {
        content: `Error reading file: ${error instanceof Error ? error.message : String(error)}`,
        error: 'READ_ERROR'
      }
    }
  }
}

export const readTool = new ReadTool()
