// Session Manager - Create, load, and manage sessions
import * as fs from 'fs/promises'
import * as path from 'path'
import { ulid } from 'ulid'
import type { Session, SessionMessage } from './types'

// Session storage directory
function getSessionsDir(workspacePath: string): string {
  return path.join(workspacePath, '.opencode', 'sessions')
}

// Create new session
export async function createSession(
  workspacePath: string,
  agent: string,
  model: string,
  systemPrompt?: string
): Promise<Session> {
  const sessionsDir = getSessionsDir(workspacePath)
  await fs.mkdir(sessionsDir, { recursive: true })
  
  const session: Session = {
    id: ulid(),
    agent,
    model,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: []
  }
  
  // Add system message if provided
  if (systemPrompt) {
    session.messages.push({
      id: ulid(),
      role: 'system',
      content: systemPrompt,
      timestamp: Date.now()
    })
  }
  
  // Save session
  await saveSession(workspacePath, session)
  
  return session
}

// Save session to disk
export async function saveSession(workspacePath: string, session: Session): Promise<void> {
  const sessionsDir = getSessionsDir(workspacePath)
  await fs.mkdir(sessionsDir, { recursive: true })
  
  const filePath = path.join(sessionsDir, `${session.id}.json`)
  await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8')
}

// Load session by ID
export async function loadSession(workspacePath: string, sessionId: string): Promise<Session | null> {
  const filePath = path.join(getSessionsDir(workspacePath), `${sessionId}.json`)
  
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content) as Session
  } catch {
    return null
  }
}

// List all sessions
export async function listSessions(workspacePath: string): Promise<Session[]> {
  const sessionsDir = getSessionsDir(workspacePath)
  const sessions: Session[] = []
  
  try {
    const entries = await fs.readdir(sessionsDir)
    
    for (const entry of entries) {
      if (entry.endsWith('.json')) {
        try {
          const content = await fs.readFile(path.join(sessionsDir, entry), 'utf-8')
          sessions.push(JSON.parse(content))
        } catch {
          // Skip invalid session files
        }
      }
    }
  } catch {
    // Directory doesn't exist
  }
  
  // Sort by updated time, newest first
  return sessions.sort((a, b) => b.updatedAt - a.updatedAt)
}

// Add message to session
export async function addMessage(
  workspacePath: string,
  sessionId: string,
  message: Omit<SessionMessage, 'id' | 'timestamp'>
): Promise<void> {
  const session = await loadSession(workspacePath, sessionId)
  if (!session) return
  
  const newMessage: SessionMessage = {
    ...message,
    id: ulid(),
    timestamp: Date.now()
  }
  
  session.messages.push(newMessage)
  session.updatedAt = Date.now()
  
  await saveSession(workspacePath, session)
}

// Update session (for tool calls/results)
export async function updateSession(
  workspacePath: string,
  sessionId: string,
  updates: Partial<Session>
): Promise<void> {
  const session = await loadSession(workspacePath, sessionId)
  if (!session) return
  
  Object.assign(session, updates, { updatedAt: Date.now() })
  await saveSession(workspacePath, session)
}

// Delete session
export async function deleteSession(workspacePath: string, sessionId: string): Promise<void> {
  const filePath = path.join(getSessionsDir(workspacePath), `${sessionId}.json`)
  await fs.unlink(filePath)
}

// Get recent sessions
export async function getRecentSessions(workspacePath: string, limit: number = 10): Promise<Session[]> {
  const sessions = await listSessions(workspacePath)
  return sessions.slice(0, limit)
}

// Session compaction - summarize old messages
export async function compactSession(
  workspacePath: string,
  sessionId: string,
  summary: string
): Promise<void> {
  const session = await loadSession(workspacePath, sessionId)
  if (!session) return
  
  // Keep system message and last few messages
  const systemMessages = session.messages.filter(m => m.role === 'system')
  const recentMessages = session.messages.slice(-5)
  
  // Add summary as a system message
  const summaryMessage: SessionMessage = {
    id: ulid(),
    role: 'system',
    content: `[Previous conversation summarized]\n${summary}`,
    timestamp: Date.now()
  }
  
  session.messages = [...systemMessages, summaryMessage, ...recentMessages]
  session.updatedAt = Date.now()
  
  await saveSession(workspacePath, session)
}

// Export for easy import
export const sessionManager = {
  create: createSession,
  load: loadSession,
  save: saveSession,
  list: listSessions,
  addMessage,
  update: updateSession,
  delete: deleteSession,
  getRecent: getRecentSessions,
  compact: compactSession
}