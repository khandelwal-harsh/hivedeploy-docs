import { describe, expect, it } from 'vitest'
import { groupHits, marks, sectionOf, sectionTitle, type Hit } from '../lib/search-index'

const hit = (route: string): Hit => ({ id: route, route, section: sectionOf(route), pageTitle: 't', heading: 'h', excerpt: 'x' })

describe('search index helpers', () => {
  it('names the section from the sidebar', () => {
    expect(sectionOf('/connect-clouds/aws#verify')).toBe('Connect a cloud')
    expect(sectionOf('/changelog')).toBe('Changelog')
    expect(sectionOf('/quickstart')).toBe('Documentation')
    expect(sectionOf('/')).toBe('Documentation')
  })
  it('reads a root _meta entry whether it is a string or an object with a title', () => {
    expect(sectionTitle('Guides', 'guides')).toBe('Guides')
    expect(sectionTitle({ title: 'Guides', type: 'page' }, 'guides')).toBe('Guides')
    expect(sectionTitle(undefined, 'guides')).toBe('Documentation')
    expect(sectionTitle({ type: 'page' }, 'guides')).toBe('Documentation')
  })
  it('groups in first-appearance order', () => {
    expect(groupHits([hit('/guides/billing'), hit('/changelog'), hit('/guides/approvals')]).map((g) => [g.section, g.hits.length])).toEqual([
      ['Guides', 2],
      ['Changelog', 1],
    ])
  })
  it('marks every query word, whatever the case, and survives regex characters', () => {
    expect(marks('Your unique external ID', 'External id')).toEqual(['Your unique ', { mark: 'external' }, ' ', { mark: 'ID' }])
    expect(marks('a (b) c', '(b)')).toEqual(['a ', { mark: '(b)' }, ' c'])
    expect(marks('abc', '  ')).toEqual(['abc'])
  })
})
