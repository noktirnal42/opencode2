// Session Types
export interface Session {
  id: string
  agent: string
  model: string
  createdAt: number
  updatedAt: number
  messages: SessionMessage[]
  workspace?: string
}

export interface SessionMessage {
  id: string
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
  timestamp: number
}

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolResult {
  tool: string
  result: string
}

// Session state
export interface SessionState {
  currentSession: Session | null
  sessions: Session[]
  isProcessing: boolean
}