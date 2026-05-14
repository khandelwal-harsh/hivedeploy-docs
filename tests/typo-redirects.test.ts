import { describe, it, expect } from 'vitest'
import { correctTypos, TYPO_MAP } from '../scripts/typo-redirects'

describe('correctTypos', () => {
  it('corrects a single typo', () => {
    expect(correctTypos('kuberntes')).toEqual({ corrected: 'kubernetes', wasCorrected: true })
  })

  it('returns the input unchanged when no typo matches', () => {
    expect(correctTypos('postgres')).toEqual({ corrected: 'postgres', wasCorrected: false })
  })

  it('corrects multiple typos in a single query', () => {
    expect(correctTypos('tarraform kuberntes')).toEqual({
      corrected: 'terraform kubernetes',
      wasCorrected: true,
    })
  })

  it('is case-insensitive for matching but preserves casing of non-typo words', () => {
    expect(correctTypos('Kuberntes Service')).toEqual({
      corrected: 'kubernetes Service',
      wasCorrected: true,
    })
  })

  it('exports a non-empty TYPO_MAP', () => {
    expect(Object.keys(TYPO_MAP).length).toBeGreaterThan(0)
  })
})
