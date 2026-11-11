import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Callout } from '../components/Callout'

const render = (type?: 'info' | 'warning' | 'error' | 'success') => renderToStaticMarkup(createElement(Callout, { type, children: 'body text' }))

describe('Callout', () => {
  it.each([
    ['info', 'Note', 'class="dot"'],
    ['warning', 'Warning', 'class="tri"'],
    ['error', 'Error', 'class="glyph x"'],
    ['success', 'Success', 'class="glyph ok"'],
  ] as const)('%s: label, mark, role and aria-label', (type, label, mark) => {
    const html = render(type)
    expect(html).toContain('data-testid="callout"')
    expect(html).toContain(`class="dx-callout ${type}"`)
    expect(html).toContain('role="note"')
    expect(html).toContain(`aria-label="${label}"`)
    expect(html).toMatch(new RegExp(`${label}</span>`))
    expect(html).toContain(mark)
    expect(html).toContain('body text')
  })
  it('the error and success marks are aria-hidden SVGs, not text characters', () => {
    for (const t of ['error', 'success'] as const) {
      const html = render(t)
      expect(html).toMatch(/<svg class="glyph[^"]*"[^>]*aria-hidden="true"/)
      expect(html).not.toMatch(/[✕✓]/)
    }
  })
  it('defaults to info', () => expect(render()).toContain('class="dx-callout info"'))
})
