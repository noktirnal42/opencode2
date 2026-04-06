// Tool tests - Basic tests for OpenCode2 tools
import { describe, it, expect, beforeEach } from '@jest/globals'
import { replace, SimpleReplacer, LineTrimmedReplacer, WhitespaceNormalizedReplacer, TrimmedBoundaryReplacer } from '../src/tool/edit'

describe('Edit Tool - Replacement Functions', () => {
  describe('SimpleReplacer', () => {
    it('should yield the find string', () => {
      const content = 'Hello World'
      const find = 'World'
      // SimpleReplacer yields the search string, not the match from content
      const matches = [...SimpleReplacer(content, find)]
      expect(matches).toContain('World')
    })

    it('should yield find string even if not in content', () => {
      // SimpleReplacer doesn't check if string exists in content
      // The replace function handles the existence check
      const content = 'Hello World'
      const find = 'Goodbye'
      const matches = [...SimpleReplacer(content, find)]
      expect(matches).toContain('Goodbye')
    })
  })

  describe('LineTrimmedReplacer', () => {
    it('should find trimmed match', () => {
      const content = '  Hello World  '
      const find = 'Hello World'
      const matches = [...LineTrimmedReplacer(content, find)]
      expect(matches).toHaveLength(1)
    })

    it('should handle multiline content', () => {
      const content = `
      line 1
        line 2
      line 3
      `
      const find = 'line 2'
      const matches = [...LineTrimmedReplacer(content, find)]
      expect(matches.length).toBeGreaterThan(0)
    })
  })

  describe('WhitespaceNormalizedReplacer', () => {
    it('should find match with different whitespace', () => {
      const content = 'Hello    World'
      const find = 'Hello World'
      const matches = [...WhitespaceNormalizedReplacer(content, find)]
      expect(matches.length).toBeGreaterThan(0)
    })
  })

  describe('TrimmedBoundaryReplacer', () => {
    it('should find trimmed match', () => {
      const content = '   Hello World   '
      const find = '   Hello World   '
      const matches = [...TrimmedBoundaryReplacer(content, find)]
      expect(matches).toContain('Hello World')
    })

    it('should not find when not trimmed', () => {
      const content = 'Hello'
      const find = 'Hello'
      const matches = [...TrimmedBoundaryReplacer(content, find)]
      expect(matches).toHaveLength(0)
    })
  })

  describe('replace function', () => {
    it('should replace exact match', () => {
      const content = 'Hello World'
      const result = replace(content, 'World', 'Universe')
      expect(result).toBe('Hello Universe')
    })

    it('should throw for identical strings', () => {
      expect(() => {
        replace('Hello', 'Hello', 'Hello')
      }).toThrow()
    })

    it('should throw when string not found', () => {
      expect(() => {
        replace('Hello', 'Goodbye', 'World')
      }).toThrow()
    })

    it('should handle multiline content', () => {
      const content = `line 1
line 2
line 3`
      const result = replace(content, 'line 2', 'new line 2')
      expect(result).toContain('new line 2')
    })
  })
})
