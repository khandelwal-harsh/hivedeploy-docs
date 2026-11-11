import { describe, expect, it } from 'vitest'
import meta from '../pages/_meta'

describe('root _meta', () => {
  it('lists the eight sections, Changelog, a separator and the two property links, in order', () => {
    expect(Object.keys(meta)).toEqual(['index', 'quickstart', 'concepts', 'connect-clouds', 'guides', 'use-the-agents', 'reference', 'troubleshooting', 'changelog', '-- links', 'proof', 'www'])
  })
  it('titles Changelog and points the links at the properties', () => {
    const m = meta as Record<string, unknown>
    expect(m['changelog']).toBe('Changelog')
    expect(m['-- links']).toEqual({ type: 'separator' })
    expect(m['proof']).toEqual({ title: 'Reliability ledger', href: 'https://proof.hivedeploy.in', newWindow: true, theme: { pagination: false } })
    expect(m['www']).toEqual({ title: 'HiveDeploy', href: 'https://www.hivedeploy.in', newWindow: true, theme: { pagination: false } })
  })
})
