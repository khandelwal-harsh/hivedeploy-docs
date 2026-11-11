import { describe, expect, it } from 'vitest'
import { inOrder, mdxWords, toks } from './lib/words'

describe('word helpers', () => {
  it('toks drops edge punctuation and lone dashes and arrows', () => {
    expect(toks('Hello, (world) — → "x"; a·b ·')).toEqual(['Hello', 'world', 'x', 'a·b'])
  })
  it('mdxWords reads index.mdx without markup, link targets or imports', () => {
    const w = mdxWords('pages/index.mdx')
    expect(w.slice(0, 6)).toEqual(['start', 'here', 'doc', 'when', 'to', 'read'])
    expect(w).not.toContain('/quickstart')
    expect(w).not.toContain('import')
    expect(w).toContain('quickstart')
  })
  it('inOrder passes a subsequence and names the first miss', () => {
    expect(inOrder(['a', 'b'], ['x', 'A', 'y', 'b'])).toEqual({ ok: true })
    const r = inOrder(['a', 'b', 'c'], ['a', 'c', 'b'])
    expect(r).toMatchObject({ ok: false, at: 2, word: 'c' })
  })
})
