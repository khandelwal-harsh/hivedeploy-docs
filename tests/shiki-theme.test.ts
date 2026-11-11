import { describe, expect, it } from 'vitest'
import { obsidian } from '../lib/shiki-obsidian.mjs'

const HUES = ['#82827F', '#E3CFA6', '#9FC3E6', '#C9B8EC', '#E8B98C']

function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

const fg = obsidian.tokenColors.flatMap((t) => (t.settings.foreground ? [t.settings.foreground.toUpperCase()] : []))

describe('obsidian shiki theme', () => {
  it('is a dark theme named obsidian on #0B0B0E', () => {
    expect(obsidian.name).toBe('obsidian')
    expect(obsidian.type).toBe('dark')
    expect(obsidian.colors['editor.background']).toBe('#0B0B0E')
    expect(obsidian.colors['editor.foreground']).toBe('#D6D6D2')
  })
  it('uses only the five hues', () => {
    expect(fg.length).toBeGreaterThan(0)
    expect(new Set(fg).size).toBe(5)
    for (const c of fg) expect(HUES).toContain(c)
  })
  it('never uses Honey', () => {
    for (const c of [...fg, obsidian.colors['editor.foreground'].toUpperCase()]) expect(['#F5B301', '#F7C244']).not.toContain(c)
  })
  it('every colour the theme can paint is at least 4.5:1 on the code background', () => {
    const all = [...new Set([...fg, obsidian.colors['editor.foreground'].toUpperCase()])]
    for (const c of all) expect(contrast(c, obsidian.colors['editor.background']), c).toBeGreaterThanOrEqual(4.5)
  })
})
