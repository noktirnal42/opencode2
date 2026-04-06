// WebSearch Tool - Search the web
import { z } from 'zod'
import { BaseTool, type ToolContext, type ToolResult } from '@/types/tool'

export const WebSearchInputSchema = z.object({
  query: z.string().describe('Search query'),
  numResults: z.number().optional().describe('Number of results (default: 10)')
})

export type WebSearchInput = z.infer<typeof WebSearchInputSchema>

interface SearchResult {
  title: string
  url: string
  snippet: string
}

export class WebSearchTool extends BaseTool<WebSearchInput, SearchResult[]> {
  readonly name = 'websearch'
  readonly description = 'Search the web for information'
  readonly inputSchema = WebSearchInputSchema

  // Simple search using DuckDuckGo's HTML results
  async execute(context: ToolContext, input: WebSearchInput): Promise<ToolResult<SearchResult[]>> {
    try {
      const numResults = input.numResults ?? 10
      const query = encodeURIComponent(input.query)
      
      // Use DuckDuckGo HTML API (no API key needed)
      const url = `https://html.duckduckgo.com/html/?q=${query}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'OpenCode2/1.0'
        }
      })
      
      if (!response.ok) {
        return {
          content: `Error: HTTP ${response.status}`,
          error: 'HTTP_ERROR'
        }
      }
      
      const html = await response.text()
      
      // Parse results (simple regex-based parsing)
      const results: SearchResult[] = []
      const resultRegex = /<a class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
      
      let match
      let count = 0
      while ((match = resultRegex.exec(html)) !== null && count < numResults) {
        const url = match[1]
        // Decode URL
        const decodedUrl = decodeURIComponent(url.replace(/^https:\/\/duckduckgo\.com\/u\/\?q=/, '').replace(/&.*$/, ''))
        
        if (decodedUrl.startsWith('http')) {
          results.push({
            title: match[2].trim(),
            url: decodedUrl,
            snippet: match[3].replace(/<[^>]+>/g, '').trim()
          })
          count++
        }
      }
      
      if (results.length === 0) {
        return {
          content: `No results found for "${input.query}"`,
          data: []
        }
      }
      
      // Format output
      const output = results.map(r => 
        `${r.title}\n${r.url}\n${r.snippet}\n`
      ).join('\n')
      
      return {
        content: `Search results for "${input.query}":\n\n${output}`,
        data: results
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

export const webSearchTool = new WebSearchTool()