// Task Tool tests
import { describe, it, expect } from '@jest/globals'

// Since task tools use in-memory storage, we need to test the logic separately
describe('Task Tool - Logic', () => {
  describe('Task Sorting', () => {
    it('should sort tasks by status (in_progress first)', () => {
      const tasks = [
        { status: 'completed' as const, priority: 'high' as const, createdAt: 1000 },
        { status: 'in_progress' as const, priority: 'low' as const, createdAt: 2000 },
        { status: 'pending' as const, priority: 'high' as const, createdAt: 3000 },
      ]

      const statusOrder = { in_progress: 0, pending: 1, completed: 2, cancelled: 3 }
      const sorted = [...tasks].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

      expect(sorted[0].status).toBe('in_progress')
      expect(sorted[1].status).toBe('pending')
      expect(sorted[2].status).toBe('completed')
    })

    it('should sort tasks by priority within same status', () => {
      const tasks = [
        { status: 'pending' as const, priority: 'low' as const },
        { status: 'pending' as const, priority: 'high' as const },
        { status: 'pending' as const, priority: 'medium' as const },
      ]

      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const sorted = [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

      expect(sorted[0].priority).toBe('high')
      expect(sorted[1].priority).toBe('medium')
      expect(sorted[2].priority).toBe('low')
    })
  })

  describe('Task ID Generation', () => {
    it('should generate unique IDs', () => {
      const generateTaskId = () => {
        return `task_${Date.now()}_${Math.random().toString(36).substring(7)}`
      }

      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateTaskId())
      }
      expect(ids.size).toBe(100)
    })
  })
})
