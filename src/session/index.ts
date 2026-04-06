// Session System - Export all session modules
export * from './types'
export * from './manager'

// Export manager for convenience
export const session = {
  create: import('./manager').then(m => m.createSession),
  load: import('./manager').then(m => m.loadSession),
  save: import('./manager').then(m => m.saveSession),
  list: import('./manager').then(m => m.listSessions),
  addMessage: import('./manager').then(m => m.addMessage),
  delete: import('./manager').then(m => m.deleteSession),
  compact: import('./manager').then(m => m.compactSession)
}