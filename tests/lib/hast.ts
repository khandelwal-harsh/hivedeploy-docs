import type { HastNode, HastRoot } from '../../lib/rehype-docs.mjs'

export type { HastNode, HastRoot }

export const text = (value: string): HastNode => ({ type: 'text', value })
const el = (tagName: string, properties: Record<string, unknown>, children: (HastNode | string)[]): HastNode => ({
  type: 'element',
  tagName,
  properties,
  children: children.map((c) => (typeof c === 'string' ? text(c) : c)),
})

export const root = (...children: HastNode[]): HastRoot => ({ type: 'root', children })
export const h2 = (id: string, t: string): HastNode => el('h2', { id }, [t])
export const h3 = (id: string, t: string): HastNode => el('h3', { id }, [t])
export const p = (...c: (HastNode | string)[]): HastNode => el('p', {}, c)
export const em = (...c: (HastNode | string)[]): HastNode => el('em', {}, c)
export const strong = (...c: (HastNode | string)[]): HastNode => el('strong', {}, c)
export const ul = (...c: HastNode[]): HastNode => el('ul', {}, c)
export const hr = (): HastNode => el('hr', {}, [])
export const quote = (...c: HastNode[]): HastNode => el('blockquote', {}, c)

export const tag = (n: HastNode): string => (n.type === 'element' ? n.tagName! : n.type)
export const toText = (n: HastNode): string => (n.type === 'text' ? n.value! : (n.children ?? []).map(toText).join(''))
