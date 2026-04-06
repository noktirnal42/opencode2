// WebFetch Tool - Fetch web pages
// Cherry-picked enhancements from OpenCode:
// - Timeout handling with configurable limits
// - Cloudflare bot detection bypass
// - Content negotiation with Accept headers
// - HTML to Markdown conversion
// - Text extraction from HTML

import { z } from 'zod'
import { BaseTool, type ToolContext, type ToolResult } from '@/types/tool'

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024 // 5MB
const DEFAULT_TIMEOUT = 30 * 1000 // 30 seconds
const MAX_TIMEOUT = 120 * 1000 // 2 minutes

export const WebFetchInputSchema = z.object({
  url: z.string().describe('The URL to fetch content from'),
  format: z.enum(['text', 'markdown', 'html']).describe('Output format'),
  timeout: z.number().optional().describe('Timeout in seconds (max 120)')
})

export type WebFetchInput = z.infer<typeof WebFetchInputSchema>

// HTML to Markdown conversion (simplified from Turndown)
function htmlToMarkdown(html: string): string {
  // Simple conversion - handle common patterns
  let markdown = html
  
  // Code blocks
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```')
  markdown = markdown.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
  
  // Headers
  markdown = markdown.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n')
  markdown = markdown.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n')
  markdown = markdown.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n')
  markdown = markdown.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n')
  markdown = markdown.replace(/<h5[^>]*>([\s\S]*>)([\s\S]*?)<\/h5>/gi, '##### $1\n')
  markdown = markdown.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '###### $1\n')
  
  // Links
  markdown = markdown.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
  
  // Bold and italic
  markdown = markdown.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
  markdown = markdown.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
  markdown = markdown.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
  markdown = markdown.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
  
  // Lists
  markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, content) => {
    return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
  })
  markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, content) => {
    let idx = 0
    return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, () => `${++idx}. $1\n`)
  })
  
  // Paragraphs and line breaks
  markdown = markdown.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n')
  
  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '')
  
  // Decode HTML entities
  markdown = markdown
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    .replace(/&#\d+;/g, (match) => String.fromCharCode(parseInt(match.slice(2, -1))))
  
  // Clean up whitespace
  markdown = markdown.replace(/[ \t]+/g, ' ')
  markdown = markdown.replace(/\n{3,}/g, '\n\n')
  
  return markdown.trim()
}

// Extract plain text from HTML
function extractText(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<(script|style|noscript|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '')
  
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ')
  
  // Decode entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  
  // Clean whitespace
  text = text.replace(/\s+/g, ' ').trim()
  
  return text
}

export class WebFetchTool extends BaseTool<WebFetchInput, string> {
  readonly name = 'webfetch'
  readonly description = 'Fetch content from a URL with proper content negotiation'
  readonly inputSchema = WebFetchInputSchema

  async execute(context: ToolContext, input: WebFetchInput): Promise<ToolResult<string>> {
    // Validate URL
    if (!input.url.startsWith('http://') && !input.url.startsWith('https://')) {
      return {
        content: 'URL must start with http:// or https://',
        error: 'INVALID_URL'
      }
    }

    const timeout = Math.min((input.timeout ?? DEFAULT_TIMEOUT / 1000) * 1000, MAX_TIMEOUT)
    const format = input.format || 'markdown'

    // Build Accept header based on format
    let acceptHeader = '*/*'
    switch (format) {
      case 'markdown':
        acceptHeader = 'text/markdown;q=1.0, text/x-markdown;q=0.9, text/plain;q=0.8, text/html;q=0.7, */*;q=0.1'
        break
      case 'text':
        acceptHeader = 'text/plain;q=1.0, text/markdown;q=0.9, text/html;q=0.8, */*;q=0.1'
        break
      case 'html':
        acceptHeader = 'text/html;q=1.0, application/xhtml+xml;q=0.9, text/plain;q=0.8, */*;q=0.1'
        break
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': acceptHeader,
      'Accept-Language': 'en-US,en;q=0.9'
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(input.url, { 
        signal: controller.signal,
        headers 
      })

      clearTimeout(timeoutId)

      // Cloudflare bypass: retry with simple UA if blocked
      const finalResponse = response.status === 403 && response.headers.get('cf-mitigated') === 'challenge'
        ? await fetch(input.url, { 
            signal: controller.signal,
            headers: { ...headers, 'User-Agent': 'opencode' }
          })
        : response

      if (!response.ok && !finalResponse.ok) {
        return {
          content: `Request failed with status code: ${response.status}`,
          error: 'HTTP_ERROR'
        }
      }

      // Check content length
      const contentLength = response.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
        return {
          content: 'Response too large (exceeds 5MB limit)',
          error: 'RESPONSE_TOO_LARGE'
        }
      }

      const arrayBuffer = await response.arrayBuffer()
      if (arrayBuffer.byteLength > MAX_RESPONSE_SIZE) {
        return {
          content: 'Response too large (exceeds 5MB limit)',
          error: 'RESPONSE_TOO_LARGE'
        }
      }

      const contentType = response.headers.get('content-type') || ''
      const mime = contentType.split(';')[0]?.trim().toLowerCase() || ''

      // Check if image
      const isImage = mime.startsWith('image/') && mime !== 'image/svg+xml'
      if (isImage) {
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        return {
          content: `Image fetched successfully (${mime})`,
          data: `[Image: data:${mime};base64,${base64.substring(0, 50)}...]`
        }
      }

      const content = new TextDecoder().decode(arrayBuffer)

      // Format output based on requested format
      let output: string
      switch (format) {
        case 'markdown':
          if (mime.includes('text/html')) {
            output = htmlToMarkdown(content)
          } else {
            output = content
          }
          break
        case 'text':
          if (mime.includes('text/html')) {
            output = extractText(content)
          } else {
            output = content
          }
          break
        case 'html':
          output = content
          break
        default:
          output = content
      }

      return {
        content: output,
        data: output
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            content: `Request timed out after ${timeout}ms`,
            error: 'TIMEOUT'
          }
        }
        return {
          content: `Fetch error: ${error.message}`,
          error: 'FETCH_ERROR'
        }
      }
      return {
        content: 'Unknown fetch error',
        error: 'FETCH_ERROR'
      }
    }
  }
}

export const webFetchTool = new WebFetchTool()
