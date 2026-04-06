// Remote Control Types for OpenCode2

// Remote control configuration
export interface RemoteConfig {
  enabled: boolean
  host: string
  port: number
  authToken?: string
  ssl?: boolean
}

// Remote session state
export interface RemoteSession {
  id: string
  connectedAt: number
  lastActivity: number
  agent: string
  model: string
}

// Remote command
export interface RemoteCommand {
  id: string
  type: 'prompt' | 'agent' | 'tool' | 'control'
  payload: unknown
  timestamp: number
}

// Remote response
export interface RemoteResponse {
  id: string
  success: boolean
  data?: unknown
  error?: string
  timestamp: number
}

// Remote events
export type RemoteEventType = 
  | 'connected'
  | 'disconnected'
  | 'command'
  | 'response'
  | 'error'
  | 'message'

export interface RemoteEvent {
  type: RemoteEventType
  data?: unknown
  timestamp: number
}

// Remote control API
export interface RemoteAPI {
  // Connection
  connect(): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  
  // Session
  createSession(agent: string, model: string): Promise<RemoteSession>
  getSession(id: string): Promise<RemoteSession | null>
  listSessions(): Promise<RemoteSession[]>
  closeSession(id: string): Promise<void>
  
  // Commands
  sendCommand(command: Omit<RemoteCommand, 'id' | 'timestamp'>): Promise<RemoteResponse>
  
  // Streaming
  onEvent(callback: (event: RemoteEvent) => void): () => void
  
  // Internal (for startRemoteControl)
  emitEvent?(event: RemoteEvent): void
}
