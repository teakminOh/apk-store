import { describe, expect, it } from 'vitest'
import { formatBytes, formatDate, initials } from './format'

describe('format utilities', () => {
  it('formats file sizes', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })

  it('formats missing publish dates', () => {
    expect(formatDate(null)).toBe('Not published')
  })

  it('creates app initials', () => {
    expect(initials('React Native Demo')).toBe('RN')
    expect(initials('Solo')).toBe('S')
  })
})
