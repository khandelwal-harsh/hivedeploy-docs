import { afterEach, describe, expect, it, vi } from 'vitest'
import { groupHits, loadIndex, marks, search, sectionOf, sectionTitle, type Hit } from '../lib/search-index'

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

/** A small index in the shape Nextra writes (`nextra-data-en-US.json`): route -> { title, data: { "id#Heading": text } }. */
const DATA = {
  '/connect-clouds/aws': { title: 'Connect an AWS account', data: { '': 'Give the role your external ID.', 'verify#Verify': 'Check the external ID matches.\nThen run a deploy.' } },
  '/troubleshooting/cloud-403': { title: 'Cloud 403', data: { 'cause#Cause': 'A wrong external ID gives a 403.' } },
  '/changelog': { title: 'Changelog', data: { '2026-05-14--added#2026-05-14 — Added': 'External ID shown in the UI.' } },
  ...Object.fromEntries(
    Array.from({ length: 6 }, (_, i) => [
      `/guides/g${i}`,
      { title: `Guide ${i}`, data: Object.fromEntries(Array.from({ length: 6 }, (_, j) => [`s${j}#Gate step ${j}`, `The gate checks part ${j}.`])) },
    ]),
  ),
}
const ok = () => ({ ok: true, status: 200, json: async () => DATA }) as unknown as Response
let base = 0
const fresh = () => `/t${++base}` // loadIndex memoises per base path; each test takes its own

describe('loadIndex and search', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('memoises: one fetch per base path, the same promise to every caller', async () => {
    const f = vi.fn(async () => ok())
    vi.stubGlobal('fetch', f)
    const b = fresh()
    const p1 = loadIndex(b)
    const p2 = loadIndex(b)
    expect(p2).toBe(p1)
    await p1
    expect(loadIndex(b)).toBe(p1)
    expect(f).toHaveBeenCalledTimes(1)
    expect(f).toHaveBeenCalledWith(`${b}/_next/static/chunks/nextra-data-en-US.json`)
  })

  it('rejects on a non-200 index, and the next call fetches again', async () => {
    const f = vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) }) as unknown as Response)
    vi.stubGlobal('fetch', f)
    const b = fresh()
    await expect(loadIndex(b)).rejects.toThrow('search index: 404')
    await Promise.resolve()
    f.mockImplementation(async () => ok())
    await expect(loadIndex(b)).resolves.toBeTruthy()
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('groups the hits by section, every hit under its own section, each page together', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ok()))
    const index = await loadIndex(fresh())
    const hits = search(index, 'external ID')
    expect(hits.length).toBeGreaterThan(2)
    const groups = groupHits(hits)
    expect(new Set(groups.map((g) => g.section))).toEqual(new Set(['Connect a cloud', 'Troubleshooting', 'Changelog']))
    expect(groups.map((g) => g.section)).toEqual([...new Set(groups.map((g) => g.section))])
    for (const g of groups) for (const h of g.hits) expect(h.section).toBe(sectionOf(h.route))
    expect(groups.flatMap((g) => g.hits)).toHaveLength(hits.length)
    // a page's hits are adjacent: the theme orders page by page
    const pages = hits.map((h) => h.pageTitle)
    expect(pages.filter((t, i) => i === 0 || t !== pages[i - 1])).toEqual([...new Set(pages)])
    expect(hits.find((h) => h.route === '/connect-clouds/aws#verify')).toMatchObject({ pageTitle: 'Connect an AWS account', heading: 'Verify' })
  })

  it('caps the hits at the limit (25 by default: five pages, five sections each)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ok()))
    const index = await loadIndex(fresh())
    const all = search(index, 'gate')
    expect(all.length).toBeGreaterThan(5)
    expect(all.length).toBeLessThanOrEqual(25)
    expect(search(index, 'gate', 3)).toEqual(all.slice(0, 3))
    expect(search(index, '   ')).toEqual([])
  })
})
