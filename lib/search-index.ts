import meta from '../pages/_meta'

/**
 * Reads the index Nextra writes at build time (`/_next/static/chunks/nextra-data-en-US.json`, an internal of the pinned
 * Nextra 3.3.1) and builds the same two FlexSearch documents the theme's own search builds
 * (nextra-theme-docs/dist/index.js, `loadIndexesImpl`): a page index and a section index.
 */
export type Hit = { id: string; route: string; section: string; pageTitle: string; heading: string; excerpt: string }

type Doc = { id?: string | number; url?: string; title: string; content?: string; display?: string; pageId?: string }
type Enriched = { result: { id: string | number; doc: Doc }[] }[]
type FlexDocument = {
  add(doc: Record<string, unknown>): unknown
  search(query: string, limit: number, options: Record<string, unknown>): Enriched
}
export type SearchIndex = { pages: FlexDocument; sections: FlexDocument }
type NextraData = Record<string, { title: string; data: Record<string, string> }>

const DEFAULT_SECTION = 'Documentation'

/** A root `_meta` entry is a plain string today and may be `{ title, … }`; both name the section. */
export function sectionTitle(entry: unknown, _segment: string): string {
  if (typeof entry === 'string') return entry
  if (entry && typeof entry === 'object' && typeof (entry as { title?: unknown }).title === 'string') return (entry as { title: string }).title
  return DEFAULT_SECTION
}

export function sectionOf(route: string): string {
  const segment = route.split(/[?#]/)[0]!.split('/').filter(Boolean)[0]
  if (!segment || segment === 'quickstart') return DEFAULT_SECTION
  return sectionTitle((meta as Record<string, unknown>)[segment], segment)
}

export function groupHits(hits: Hit[]): { section: string; hits: Hit[] }[] {
  const groups: { section: string; hits: Hit[] }[] = []
  for (const h of hits) {
    const g = groups.find((x) => x.section === h.section)
    if (g) g.hits.push(h)
    else groups.push({ section: h.section, hits: [h] })
  }
  return groups
}

const words = (query: string) => query.split(/\s+/).filter(Boolean)
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function marks(text: string, query: string): (string | { mark: string })[] {
  const ws = words(query).sort((a, b) => b.length - a.length)
  if (!ws.length) return [text]
  const re = new RegExp(`(${ws.map(escapeRegExp).join('|')})`, 'gi')
  const out: (string | { mark: string })[] = []
  text.split(re).forEach((part, i) => {
    if (part) out.push(i % 2 === 1 ? { mark: part } : part)
  })
  return out
}

/** One line of the paragraph around the first matching word, so the match is not clipped off the end. */
function excerptAround(text: string, query: string, width = 130): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  if (flat.length <= width) return flat
  const lower = flat.toLowerCase()
  const at = words(query).map((w) => lower.indexOf(w.toLowerCase())).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0
  const start = Math.max(0, Math.min(at - 30, flat.length - width))
  return `${start > 0 ? '…' : ''}${flat.slice(start, start + width).trim()}${start + width < flat.length ? '…' : ''}`
}

const memo = new Map<string, Promise<SearchIndex>>()

export function loadIndex(basePath: string): Promise<SearchIndex> {
  const cached = memo.get(basePath)
  if (cached) return cached
  const p = build(basePath)
  memo.set(basePath, p)
  p.catch(() => memo.delete(basePath))
  return p
}

async function build(basePath: string): Promise<SearchIndex> {
  const [res, mod] = await Promise.all([
    fetch(`${basePath}/_next/static/chunks/nextra-data-en-US.json`),
    import('flexsearch') as unknown as Promise<{ default: { Document: new (options: Record<string, unknown>) => FlexDocument } }>,
  ])
  if (!res.ok) throw new Error(`search index: ${res.status}`)
  const data = (await res.json()) as NextraData
  if (!data || typeof data !== 'object') throw new Error('search index: bad JSON')
  const { Document } = mod.default
  const options = { cache: 100, tokenize: 'full', context: { resolution: 9, depth: 2, bidirectional: true } }
  const pages = new Document({ ...options, document: { id: 'id', index: 'content', store: ['title'] } })
  const sections = new Document({ ...options, document: { id: 'id', index: 'content', tag: 'pageId', store: ['title', 'content', 'url', 'display'] } })
  let pageId = 0
  for (const [route, page] of Object.entries(data)) {
    let pageContent = ''
    ++pageId
    for (const [key, content] of Object.entries(page.data)) {
      const [headingId, headingValue] = key.split('#')
      const url = route + (headingId ? `#${headingId}` : '')
      const title = headingValue || page.title
      const paragraphs = content.split('\n')
      sections.add({ id: url, url, title, pageId: `page_${pageId}`, content: title, ...(paragraphs[0] && { display: paragraphs[0] }) })
      paragraphs.forEach((paragraph, i) => sections.add({ id: `${url}_${i}`, url, title, pageId: `page_${pageId}`, content: paragraph }))
      pageContent += ` ${title} ${content}`
    }
    pages.add({ id: pageId, title: page.title, content: pageContent })
  }
  return { pages, sections }
}

/** Page results first (five pages, five sections each), ordered as the theme orders them. */
export function search(index: SearchIndex, query: string, limit = 25): Hit[] {
  if (!words(query).length) return []
  const pageResults = index.pages.search(query, 5, { enrich: true, suggest: true })[0]?.result ?? []
  const rows: { page: number; section: number; hit: Hit }[] = []
  const titleMatches: number[] = []
  pageResults.forEach((p, i) => {
    titleMatches[i] = 0
    const found = index.sections.search(query, 5, { enrich: true, suggest: true, tag: `page_${p.id}` })[0]?.result ?? []
    const seen = new Set<string>()
    found.forEach(({ doc }, j) => {
      if (doc.display !== undefined) titleMatches[i]!++
      const body = doc.display || doc.content || ''
      const key = `${doc.url}@${body}`
      if (seen.has(key)) return
      seen.add(key)
      const route = doc.url ?? ''
      rows.push({ page: i, section: j, hit: { id: `${i}_${j}`, route, section: sectionOf(route), pageTitle: p.doc.title, heading: doc.title, excerpt: excerptAround(body, query) } })
    })
  })
  return rows
    .sort((a, b) => (a.page === b.page ? a.section - b.section : titleMatches[a.page] !== titleMatches[b.page] ? titleMatches[b.page]! - titleMatches[a.page]! : a.page - b.page))
    .slice(0, limit)
    .map((r) => r.hit)
}
