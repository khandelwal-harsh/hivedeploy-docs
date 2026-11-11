import { describe, expect, it } from 'vitest'
import { markQuotes, wrapChangelog, wrapSteps } from '../lib/rehype-docs.mjs'
import { em, h2, h3, hr, p, quote, root, tag, text, toText } from './lib/hast'

const ws = () => text('\n')
const kids = (n: { children?: unknown[] }) => (n.children ?? []) as Parameters<typeof tag>[0][]

describe('wrapSteps', () => {
  it('wraps each "Step N —" section and keeps the heading whole', () => {
    const t = root(h2('step-1--sign-up', 'Step 1 — Sign up'), p('a'), h2('step-2--connect', 'Step 2 — Connect'), p('b'), h2('what-just-happened', 'What just happened'), p('c'))
    wrapSteps(t)
    expect(t.children.map(tag)).toEqual(['div', 'div', 'h2', 'p'])
    expect(t.children[0]!.properties).toMatchObject({ className: ['dx-step'], dataStep: '01' })
    expect(kids(t.children[0]!).map(tag)).toEqual(['h2', 'p'])
    expect(kids(t.children[0]!)[0]!.properties!.id).toBe('step-1--sign-up')
    expect(toText(kids(t.children[0]!)[0]!)).toBe('Step 1 — Sign up')
  })
  it('leaves a page without steps alone', () => {
    const t = root(h2('a', 'Prerequisites'), p('x'))
    const before = JSON.stringify(t)
    wrapSteps(t)
    expect(JSON.stringify(t)).toBe(before)
  })
  it('"Step" inside a sentence or an h3 is not a step', () => {
    const t = root(h2('a', 'Next Step 2 — later'), h3('b', 'Step 1 — nested'))
    wrapSteps(t)
    expect(t.children.map(tag)).toEqual(['h2', 'h3'])
  })
  it('a rule ends a step and stays outside it', () => {
    const t = root(h2('a', 'Step 3 — Go'), p('x'), hr(), p('y'))
    wrapSteps(t)
    expect(t.children.map(tag)).toEqual(['div', 'hr', 'p'])
    expect(t.children[0]!.properties).toMatchObject({ dataStep: '03' })
  })
  it('whitespace text nodes between real MDX elements neither end a step nor get stranded', () => {
    const t = root(h2('a', 'Step 1 — A'), ws(), p('x'), ws(), h2('b', 'Step 2 — B'), ws(), p('y'), ws(), hr(), ws(), p('z'))
    wrapSteps(t)
    expect(t.children.filter((n) => n.type !== 'text').map(tag)).toEqual(['div', 'div', 'hr', 'p'])
    const steps = t.children.filter((n) => tag(n) === 'div')
    expect(steps.map((s) => kids(s).filter((n) => n.type !== 'text').map(tag))).toEqual([['h2', 'p'], ['h2', 'p']])
    expect(kids(steps[1]!).at(-1)!.type).not.toBe('text')
  })
})

describe('markQuotes', () => {
  it('an all-italic quote is the agent speaking; a plain quote is a note', () => {
    const t = root(quote(p(em('"What\'s the intent?"'))), quote(p('If the email does not arrive, check spam.')))
    markQuotes(t)
    expect(t.children[0]!.properties!.className).toEqual(['dx-quote', 'agent'])
    expect(t.children[1]!.properties!.className).toEqual(['dx-quote'])
  })
  it('one plain paragraph makes the whole quote a note', () => {
    const t = root(quote(p(em('a')), p('b')))
    markQuotes(t)
    expect(t.children[0]!.properties!.className).toEqual(['dx-quote'])
  })
  it('whitespace nodes in a quote are not paragraphs, and whitespace before the em is skipped', () => {
    const t = root(quote(ws(), p(ws(), em('a')), ws(), p(em('b')), ws()))
    markQuotes(t)
    expect(t.children[0]!.properties!.className).toEqual(['dx-quote', 'agent'])
  })
  it('finds quotes below the root', () => {
    const inner = quote(p('x'))
    const t = root({ type: 'element', tagName: 'ul', properties: {}, children: [{ type: 'element', tagName: 'li', properties: {}, children: [inner] }] })
    markQuotes(t)
    expect(inner.properties!.className).toEqual(['dx-quote'])
  })
})

it('wrapChangelog is a no-op until Task 10', () => {
  const t = root(h2('a', 'x'))
  const before = JSON.stringify(t)
  expect(wrapChangelog(t, {})).toBe(t)
  expect(JSON.stringify(t)).toBe(before)
})
