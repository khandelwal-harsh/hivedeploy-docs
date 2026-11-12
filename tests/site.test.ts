import { describe, expect, it } from 'vitest'
import { FOOTER, GET_STARTED, SIGN_IN, TABS, activeTab, tabCurrent } from '../lib/site'

describe('activeTab', () => {
  it('maps paths to tabs', () => {
    expect(activeTab('/')).toBe('Documentation')
    expect(activeTab('/guides/billing')).toBe('Documentation')
    expect(activeTab('/reference/api-reference')).toBe('API reference')
    expect(activeTab('/reference/api')).toBe('Documentation')
    expect(activeTab('/changelog')).toBe('Changelog')
  })
})

describe('tabCurrent', () => {
  const at = (path: string) => Object.fromEntries(TABS.map((t) => [t.label, tabCurrent(t, path)]))
  it('is "page" on the tab\'s own page, "true" for the section around it, and nothing elsewhere', () => {
    expect(at('/')).toEqual({ Documentation: 'page', 'API reference': undefined, Changelog: undefined })
    expect(at('/guides/billing')).toEqual({ Documentation: 'true', 'API reference': undefined, Changelog: undefined })
    expect(at('/reference/api-reference')).toEqual({ Documentation: undefined, 'API reference': 'page', Changelog: undefined })
    expect(at('/reference/api-reference/')).toEqual({ Documentation: undefined, 'API reference': 'page', Changelog: undefined })
    expect(at('/changelog')).toEqual({ Documentation: undefined, 'API reference': undefined, Changelog: 'page' })
    expect(at('/changelog/2026')).toEqual({ Documentation: undefined, 'API reference': undefined, Changelog: 'true' })
  })
})

describe('chrome words', () => {
  it('has the three tabs and the two calls to action', () => {
    expect(TABS.map((t) => t.label)).toEqual(['Documentation', 'API reference', 'Changelog'])
    expect(SIGN_IN).toEqual({ label: 'Sign in', href: 'https://app.hivedeploy.in/login' })
    expect(GET_STARTED).toEqual({ label: 'Get started', href: 'https://www.hivedeploy.in/#waitlist' })
  })
  it('footer: legal line and every href on a known origin', () => {
    expect(FOOTER.legal).toBe('© 2026 HiveDeploy. All rights reserved.')
    const hrefs = FOOTER.cols.flatMap((c) => c.links.map((l) => l.href))
    expect(hrefs.length).toBeGreaterThan(10)
    for (const h of hrefs) expect(h).toMatch(/^(https:\/\/(www|docs|proof)\.hivedeploy\.in|mailto:hello@hivedeploy\.in|\/|#$)/)
  })
})
