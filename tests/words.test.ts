import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { inOrder, mdxWords, toks, unpainted, wordDiff } from './lib/words'

const dir = mkdtempSync(join(tmpdir(), 'words-'))
afterAll(() => rmSync(dir, { recursive: true, force: true }))
const mdx = (body: string) => {
  const f = join(dir, `${Math.random().toString(36).slice(2)}.mdx`)
  writeFileSync(f, `---\ntitle: T\n---\n\n${body}\n`)
  return f
}

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
  it('toks reads the typographic ellipsis as "..." and ignores backticks, as the page renders them', () => {
    expect(toks('thinking… …')).toEqual(toks('thinking... ...'))
    expect(toks('thinking…')).toEqual(['thinking'])
    expect(toks('iat`/`exp /api/auth/me`-style')).toEqual(toks('iat/exp /api/auth/me-style'))
  })
  it('mdxWords keeps the number of a numbered heading, unescapes a table pipe, and leaves an indented fence its body only', () => {
    expect(mdxWords(mdx('### 1. From the catalog\n\n1. first item'))).toEqual(['1', 'from', 'the', 'catalog', 'first', 'item'])
    expect(mdxWords(mdx('| a | b |\n|---|---|\n| string \\| null | x |'))).toEqual(['a', 'b', 'string', 'null', 'x'])
    expect(mdxWords(mdx('1. Run it:\n\n   ```bash\n   2. not a list\n   ```\n'))).toEqual(['run', 'it', '2', 'not', 'a', 'list'])
  })
  it('wordDiff compares counts both ways; equal multisets give two empty lists', () => {
    expect(wordDiff(['a', 'b', 'b'], ['B', 'a', 'b'])).toEqual({ missing: [], extra: [] })
    expect(wordDiff(['a', 'b', 'b'], ['a', 'b'])).toEqual({ missing: ['b×1'], extra: [] })
    expect(wordDiff(['a', 'b'], ['a', 'b', 'a', 'c'])).toEqual({ missing: [], extra: ['a×1', 'c×1'] })
  })
  it('unpainted names source words the painted text covers less often than the source has them', () => {
    expect(unpainted(['a', 'b', 'b'], ['a', 'b', 'b', 'chrome'])).toEqual([])
    expect(unpainted(['a', 'b', 'b'], ['a', 'b'])).toEqual(['b×1'])
  })
})
