import { describe, it, expect } from 'vitest'
import { tools } from './tools'

describe('AI Tools', () => {
  it('should export an array', () => {
    expect(Array.isArray(tools)).toBe(true)
  })

  it('should be empty initially', () => {
    expect(tools).toHaveLength(0)
  })
})
