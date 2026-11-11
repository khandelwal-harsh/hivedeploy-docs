import { describe, expect, it } from 'vitest'
import { formatUpdated } from '../lib/format-updated'

describe('formatUpdated', () => {
  it('prints day, long month and year, with the ISO value for <time>', () => {
    const r = formatUpdated(Date.UTC(2026, 4, 14, 12))
    expect(r?.iso).toBe('2026-05-14T12:00:00.000Z')
    expect(r?.text).toBe('May 14, 2026')
  })
  it('returns null for a value that is not a date', () => {
    expect(formatUpdated('nope')).toBeNull()
  })
})
