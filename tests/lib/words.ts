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
  // Nextra sets typographic apostrophes; the source has straight ones.
  for (const raw of text.replace(/[’‘]/g, "'").split(/\s+/)) {
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
  t = t.replace(/^```\w*\n([\s\S]*?)\n```$/gm, (_m, body: string) => ` FENCE${fences.push(body) - 1} `)
  t = t.replace(/^import .*$/gm, '')
  t = t.replace(/<Callout[^>]*>|<\/Callout>|<ScalarReference ?\/>/g, ' ')
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  t = t.replace(/^\|[\s\-|:]+\|$/gm, ' ')
  t = t.replace(/^#{2,4} |^> ?|^>$/gm, '')
  t = t.replace(/^\s*(- |\d+\. )/gm, ' ')
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
