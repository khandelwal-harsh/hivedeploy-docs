import { createElement as h } from 'react'
import { describe, expect, it } from 'vitest'
import { parseLinkTable } from '../components/mdx/HomeLinks'

const th = (t: string) => h('th', null, t)
const head = (...cols: string[]) => h('thead', null, h('tr', null, ...cols.map(th)))
const link = (t: string, href: string) => h('strong', null, h('a', { href }, t))
const row = (...cells: unknown[]) => h('tr', null, ...(cells as never[]).map((c) => h('td', null, c as never)))
const table = (hd: unknown, ...rows: unknown[]) => [hd, h('tbody', null, ...(rows as never[]))] as never

describe('parseLinkTable', () => {
  it('reads a 2 x 2 link table into rows', () => {
    const r = parseLinkTable(table(head('Doc', 'When'), row(link('A', '/a'), 'one'), row(link('B', '/b'), 'two')))
    expect(r?.cols[0]).toBe('Doc')
    expect(r?.rows.map((x) => [x.href, x.title])).toEqual([['/a', 'A'], ['/b', 'B']])
  })
  it('is null for three columns', () => {
    expect(parseLinkTable(table(head('A', 'B', 'C'), row(link('A', '/a'), 'x', 'y')))).toBeNull()
    expect(parseLinkTable(table(head('A', 'B'), row(link('A', '/a'), 'x', 'y')))).toBeNull()
  })
  it('is null when a row has no link', () => {
    expect(parseLinkTable(table(head('A', 'B'), row(link('A', '/a'), 'x'), row('plain', 'y')))).toBeNull()
  })
  it('is null for an empty body', () => {
    expect(parseLinkTable(table(head('A', 'B')))).toBeNull()
  })
  it('is null when the first cell has words outside the link', () => {
    expect(parseLinkTable(table(head('A', 'B'), row([link('A', '/a'), ' (beta)'], 'x')))).toBeNull()
  })
})
