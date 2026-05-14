import { describe, it, expect, beforeEach } from 'vitest'
import { _testOnly_resetRateBucket, checkRateLimit } from '../pages/api/feedback'

describe('feedback rate limit', () => {
  beforeEach(() => {
    _testOnly_resetRateBucket()
  })

  it('allows up to 5 requests per IP per hour', () => {
    const ip = '1.2.3.4'
    expect(checkRateLimit(ip)).toBe(true)
    expect(checkRateLimit(ip)).toBe(true)
    expect(checkRateLimit(ip)).toBe(true)
    expect(checkRateLimit(ip)).toBe(true)
    expect(checkRateLimit(ip)).toBe(true)
    expect(checkRateLimit(ip)).toBe(false)
  })

  it('tracks IPs independently', () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit('1.1.1.1')).toBe(true)
    }
    expect(checkRateLimit('1.1.1.1')).toBe(false)
    expect(checkRateLimit('2.2.2.2')).toBe(true)
  })

  it('resets after the time window passes', () => {
    const ip = '3.3.3.3'
    for (let i = 0; i < 5; i++) checkRateLimit(ip)
    expect(checkRateLimit(ip)).toBe(false)
    _testOnly_resetRateBucket()
    expect(checkRateLimit(ip)).toBe(true)
  })
})
