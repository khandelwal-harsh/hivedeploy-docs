import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (f: string): string => readFileSync(f, 'utf8')
const css = read('styles/globals.css')

function sources(roots: string[]): string[] {
  const out: string[] = []
  const walk = (p: string): void => {
    if (statSync(p).isDirectory()) {
      for (const e of readdirSync(p)) walk(join(p, e))
    } else if (/\.(css|ts|tsx)$/.test(p)) out.push(p)
  }
  for (const r of roots) {
    try {
      walk(r)
    } catch {
      /* root may not exist yet */
    }
  }
  return out
}

const want: Record<string, string> = {
  '--bg': '#08080A', '--band': '#0E0E11', '--raised': '#131316', '--text-strong': '#F5F5F2', '--text': '#D6D6D2',
  '--text-muted': '#9A9A96', '--text-faint': '#82827F', '--ok': '#34D399', '--warn': '#FF8A3D', '--fail': '#FB7185',
  '--accent': '#F5B301', '--accent-hover': '#FFC53D', '--on-accent': '#1A1200', '--accent-text': '#F7C244',
  '--code-bg': '#0B0B0E', '--syn-cmt': '#82827F', '--syn-str': '#E3CFA6', '--syn-kw': '#9FC3E6', '--syn-key': '#C9B8EC',
  '--syn-num': '#E8B98C',
}

describe('tokens', () => {
  it('tokens are the marketing values, warn is orange', () => {
    for (const [k, v] of Object.entries(want)) expect(css).toMatch(new RegExp(`${k}:\\s*${v};`, 'i'))
  })
  it('one look, one theme', () => {
    expect(css).not.toMatch(/data-look|LIGHT MODE|html\.light|data-theme/)
  })
  it('no old token name survives anywhere', () => {
    for (const f of sources(['styles', 'components', 'lib', 'theme.config.tsx', 'pages/_app.tsx']))
      expect(read(f), f).not.toMatch(
        /--(surface-\d|foreground|border\b|info\b|ai\b|ai-strong|accent-highlight|card\b|primary\b|ring\b)/,
      )
  })
  it('no rule targets a page-head element where it never lives', () => {
    // the "Last updated" line is in .dx-meta, never in the feedback row
    expect(read('styles/components.css')).not.toMatch(/\.dx-fb\s+\.upd/)
  })
})
