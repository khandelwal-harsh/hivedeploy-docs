import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const STRIP = new Set('.,;:()"\'“”‘’`*|[]{}<>!?'.split(''))
const SKIP = new Set(['—', '–', '-', '·', '→', '/', '+', '×', '&', '=', '...'])

function strip(w: string): string {
  let a = 0
  let b = w.length
  while (a < b && STRIP.has(w[a]!)) a++
  while (b > a && STRIP.has(w[b - 1]!)) b--
  return w.slice(a, b)
}

/** Words of a text: split on whitespace, edge punctuation off, lone dashes and arrows dropped. */
export function toks(text: string): string[] {
  const out: string[] = []
  // Nextra sets typographic apostrophes and ellipses; the source has straight ones and "...". Backticks only reach a
  // page inside code, and the source has them around inline code too, so `a`/`b` and a/b count as the same word.
  const norm = text.replace(/[’‘]/g, "'").replace(/…/g, '...').replaceAll('`', '')
  for (const raw of norm.split(/\s+/)) {
    const w = strip(raw)
    if (w && !SKIP.has(w)) out.push(w)
  }
  return out
}

/** The words of an MDX page, as a reader would meet them: no front matter, imports, JSX tags, link targets or markup. */
export function mdxWords(file: string, opts: { cut?: (t: string) => string } = {}): string[] {
  let t = readFileSync(resolve(process.cwd(), file), 'utf8')
  t = t.replace(/^---\n[\s\S]*?\n---\n/, '')
  if (opts.cut) t = opts.cut(t)
  const fences: string[] = []
  // A fence may sit indented inside a list item. Its language is chrome (the chip); its body is content.
  t = t.replace(/^([ \t]*)```[\w-]*[ \t]*\n([\s\S]*?)\n\1```[ \t]*$/gm, (_m, _indent: string, body: string) => ` FENCE${fences.push(body) - 1} `)
  t = t.replace(/^import .*$/gm, '')
  t = t.replace(/<Callout[^>]*>|<\/Callout>|<ScalarReference ?\/>/g, ' ')
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  t = t.replace(/^\|[\s\-|:]+\|$/gm, ' ')
  t = t.replace(/\\\|/g, '|') // an escaped pipe in a table cell renders as a pipe
  // List markers before heading markers, so a numbered heading ("### 1. From the catalog") keeps its number.
  t = t.replace(/^\s*(- |\d+\. )/gm, ' ')
  t = t.replace(/^#{2,4} |^> ?|^>$/gm, '')
  t = t.replaceAll('**', ' ').replaceAll('---', ' ')
  t = t.replace(/(?<![\w*])\*|\*(?![\w*])/g, ' ')
  t = t.replace(/ FENCE(\d+) /g, (_m, i: string) => ` ${fences[Number(i)]} `)
  return toks(t).map((w) => w.toLowerCase())
}

/** Every source word appears in `got`, in the source's order. `got` is compared lower-cased. */
export function inOrder(src: string[], got: string[]): { ok: true } | { ok: false; at: number; word: string; context: string } {
  const g = got.map((w) => w.toLowerCase())
  let j = 0
  for (let i = 0; i < src.length; i++) {
    const w = src[i]!.toLowerCase()
    let k = j
    while (k < g.length && g[k] !== w) k++
    if (k === g.length) return { ok: false, at: i, word: w, context: src.slice(Math.max(0, i - 6), i + 6).join(' ') }
    j = k + 1
  }
  return { ok: true }
}

const counts = (ws: string[]) => {
  const m = new Map<string, number>()
  for (const w of ws) m.set(w.toLowerCase(), (m.get(w.toLowerCase()) ?? 0) + 1)
  return m
}

/** Words whose count in `a` is above their count in `b`, as "word×n" (n = how many more), sorted. */
function over(a: Map<string, number>, b: Map<string, number>): string[] {
  const out: string[] = []
  for (const [w, n] of a) if (n > (b.get(w) ?? 0)) out.push(`${w}×${n - (b.get(w) ?? 0)}`)
  return out.sort()
}

/** The rendered words against the source words, as multisets. `missing`: a source word the page has fewer times
 *  (dropped). `extra`: a word the page has more times than the source (duplicated or added). Equal multisets give two
 *  empty lists, so every source word's count is at most its rendered count and nothing is shown twice. */
export function wordDiff(src: string[], got: string[]): { missing: string[]; extra: string[] } {
  const s = counts(src)
  const g = counts(got)
  return { missing: over(s, g), extra: over(g, s) }
}

/** Source words the painted text covers fewer times than the source has them: words that live only in transparent,
 *  zero-size or clipped text. A visible copy beyond the source count (the changelog's date column) is fine here. */
export function unpainted(src: string[], painted: string[]): string[] {
  return over(counts(src), counts(painted))
}
