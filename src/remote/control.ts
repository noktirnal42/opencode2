// Remote Control Implementation for OpenCode2
import { ulid } from 'ulid'
import type {
  RemoteConfig,
  RemoteSession,
  RemoteCommand,
  RemoteResponse,
  RemoteEvent,
  RemoteAPI
} from './types'

// In-memory remote control implementation
// This can be extended to use WebSocket or HTTP servers
export class RemoteControl implements RemoteAPI {
  private config: RemoteConfig
  private connected: boolean = false
  private sessions: Map<string, RemoteSession> = new Map()
  private eventListeners: Set<(event: RemoteEvent) => void> = new Set()
  
  constructor(config: RemoteConfig) {
    this.config = config
  }
  
  async connect(): Promise<void> {
    if (this.connected) return
    
    // In a real implementation, this would start a WebSocket server
    // or connect to an existing remote control server
    this.connected = true
    this.emitEvent({ type: 'connected', timestamp: Date.now() })
  }
  
  async disconnect(): Promise<void> {
    if (!this.connected) return
    
    this.connected = false
    this.emitEvent({ type: 'disconnected', timestamp: Date.now() })
  }
  
  isConnected(): boolean {
    return this.connected
  }
  
  async createSession(agent: string, model: string): Promise<RemoteSession> {
    const session: RemoteSession = {
      id: ulid(),
      agent,
      model,
      connectedAt: Date.now(),
      lastActivity: Date.now()
    }
    
    this.sessions.set(session.id, session)
    return session
  }
  
  async getSession(id: string): Promise<RemoteSession | null> {
    return this.sessions.get(id) || null
  }
  
  async listSessions(): Promise<RemoteSession[]> {
    return Array.from(this.sessions.values())
  }
  
  async closeSession(id: string): Promise<void> {
    this.sessions.delete(id)
  }
  
  async sendCommand(command: Omit<RemoteCommand, 'id' | 'timestamp'>): Promise<RemoteResponse> {
    const id = ulid()
    const timestamp = Date.now()
    
    const fullCommand: RemoteCommand = {
      id,
      ...command,
      timestamp
    }
    
    this.emitEvent({
      type: 'command',
      data: fullCommand,
      timestamp
    })
    
    // In a real implementation, this would:
    // 1. Validate the command
    // 2. Execute the command
    // 3. Return the response
    
    // For now, return a placeholder response
    const response: RemoteResponse = {
      id,
      success: true,
      data: { message: 'Command received', command: fullCommand },
      timestamp: Date.now()
    }
    
    this.emitEvent({
      type: 'response',
      data: response,
      timestamp: Date.now()
    })
    
    return response
  }
  
  onEvent(callback: (event: RemoteEvent) => void): () => void {
    this.eventListeners.add(callback)
    return () => {
      this.eventListeners.delete(callback)
    }
  }
  
  emitEvent(event: RemoteEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in remote event listener:', error)
      }
    }
  }
}

// Factory function
export function createRemoteControl(config: RemoteConfig): RemoteAPI {
  return new RemoteControl(config)
}

// CLI command for remote control
export async function startRemoteControl(
  config: RemoteConfig,
  onCommand?: (command: RemoteCommand) => Promise<RemoteResponse>
): Promise<void> {
  const remote = createRemoteControl(config)
  
  remote.onEvent((event) => {
    if (event.type === 'command' && onCommand) {
      const command = event.data as RemoteCommand
      onCommand(command).then((response) => {
        if (remote.emitEvent) {
          remote.emitEvent({
            type: 'response',
            data: response,
            timestamp: Date.now()
          })
        }
      })
    }
  })
  
  await remote.connect()
  console.log(`Remote control enabled on ${config.host}:${config.port}`)
}
