// WebFetch Tool - Fetch web page content
import { z } from 'zod'
import { BaseTool, type ToolContext, type ToolResult } from '@/types/tool'

export const WebFetchInputSchema = z.object({
  url: z.string().url().describe('URL to fetch'),
  maxLength: z.number().optional().describe('Maximum characters to fetch (default: 50000)')
})

export type WebFetchInput = z.infer<typeof WebFetchInputSchema>

export class WebFetchTool extends BaseTool<WebFetchInput, { url: string; content: string }> {
  readonly name = 'webfetch'
  readonly description = 'Fetch the content of a web page'
  readonly inputSchema = WebFetchInputSchema

  async execute(context: ToolContext, input: WebFetchInput): Promise<ToolResult<{ url: string; content: string }>> {
    try {
      const maxLength = input.maxLength ?? 50000
      
      const response = await fetch(input.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'OpenCode2/1.0'
        }
      })
      
      if (!response.ok) {
        return {
          content: `Error: HTTP ${response.status} - ${response.statusText}`,
          error: 'HTTP_ERROR'
        }
      }
      
      let content = await response.text()
      
      // Truncate if too long
      if (content.length > maxLength) {
        content = content.slice(0, maxLength) + '\n\n... (truncated)'
      }
      
      // Basic HTML tag stripping for readability
      content = content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim()
      
      return {
        content: `Fetched: ${input.url}\n\n${content}`,
        data: { url: input.url, content }
      }
    } catch (error) {
      return {
        content: `Error fetching URL: ${error instanceof Error ? error.message : String(error)}`,
        error: 'FETCH_ERROR'
      }
    }
  }
}

export const webFetchTool = new WebFetchTool()