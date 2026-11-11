import { Children, cloneElement, isValidElement } from 'react'
import type { PointerEvent, ReactElement, ReactNode } from 'react'
import { BRAND_MARKS } from '../home/brandMarks'

type El = ReactElement<{ children?: ReactNode; href?: string }>
const asEl = (n: ReactNode): El | null => (isValidElement(n) ? (n as El) : null)
const kids = (n: ReactNode): ReactNode[] => Children.toArray(asEl(n)?.props.children)
const text = (n: ReactNode): string => (typeof n === 'string' || typeof n === 'number' ? String(n) : Children.toArray(asEl(n)?.props.children).map(text).join(''))

/** The first descendant that carries an href. */
function findLink(n: ReactNode): El | null {
  const el = asEl(n)
  if (!el) return null
  if (typeof el.props.href === 'string') return el
  for (const c of kids(el)) {
    const f = findLink(c)
    if (f) return f
  }
  return null
}

/** A card is itself a link, so a link inside its description would nest anchors: keep the text, drop the anchor. */
function unlink(n: ReactNode): ReactNode {
  const el = asEl(n)
  if (!el) return n
  const inner = Children.map(el.props.children, unlink)
  if (typeof el.props.href === 'string') return <>{inner}</>
  return cloneElement(el, undefined, inner)
}

interface Row {
  href: string
  title: string
  desc: ReactNode
}
interface Parsed {
  cols: [string, ReactNode]
  rows: Row[]
}

/** Reads `thead > tr > th*2` and `tbody > tr > td*2` with a link in each first cell. Anything else is not a link table. */
export function parseLinkTable(children: ReactNode): Parsed | null {
  const parts = Children.toArray(children).map(asEl)
  const head = parts.find((p) => p && p.type === 'thead') ?? parts[0]
  const body = parts.find((p) => p && p.type === 'tbody') ?? parts[1]
  if (!head || !body) return null
  const ths = kids(kids(head)[0])
  if (ths.length !== 2) return null
  const rows: Row[] = []
  for (const tr of kids(body)) {
    const tds = kids(tr)
    if (tds.length !== 2) return null
    const link = findLink(tds[0])
    if (!link || !link.props.href) return null
    // Words outside the link ("**[A](/a)** (beta)") would be lost in a card, so such a table stays a table.
    if (text(tds[0]).trim() !== text(link).trim()) return null
    rows.push({ href: link.props.href, title: text(link), desc: Children.map(asEl(tds[1])?.props.children, unlink) })
  }
  if (rows.length === 0) return null
  return { cols: [text(ths[0]), asEl(ths[1])?.props.children ?? ''], rows }
}

const stroke = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, 'aria-hidden': true, focusable: 'false' } as const
const ICON: Record<string, ReactNode> = {
  book: <svg {...stroke}><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19v14H5.5A1.5 1.5 0 0 0 4 19.5z" /><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H19" /></svg>,
  gate: <svg {...stroke}><path d="M4 12h4l2-5 4 10 2-5h4" /></svg>,
  agent: <svg {...stroke}><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z" /><circle cx="12" cy="12" r="2.5" /></svg>,
  heal: <svg {...stroke}><path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20 4v5h-5" /></svg>,
  team: <svg {...stroke}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6M18 19a5 5 0 0 0-2.5-4.3" /></svg>,
  check: <svg {...stroke}><rect x="4" y="4" width="16" height="16" rx="4" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>,
  bell: <svg {...stroke}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg>,
  card: <svg {...stroke}><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18" /></svg>,
  list: <svg {...stroke}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></svg>,
  code: <svg {...stroke}><path d="m8 8-4 4 4 4M16 8l4 4-4 4" /></svg>,
  env: <svg {...stroke}><path d="M4 7h10M4 17h6M18 7h2M14 17h6" /><circle cx="16" cy="7" r="2" /><circle cx="12" cy="17" r="2" /></svg>,
  cloud: <svg {...stroke}><path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4.25 4.25 0 0 1-.5 8.5z" /></svg>,
  shield: <svg {...stroke}><path d="M12 3 19 6v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></svg>,
  arch: <svg {...stroke}><rect x="3" y="4" width="7" height="6" rx="1.5" /><rect x="14" y="4" width="7" height="6" rx="1.5" /><rect x="8.5" y="14" width="7" height="6" rx="1.5" /><path d="M6.5 10v2h11v-2M12 12v2" /></svg>,
  wrench: <svg {...stroke}><path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5" /><path d="M14.5 6.5 17 4l3 3-2.5 2.5" /></svg>,
}
const BY_HREF: Record<string, keyof typeof ICON | keyof typeof BRAND_MARKS> = {
  '/quickstart': 'book', '/concepts/agents': 'agent', '/concepts/gates': 'gate', '/concepts/self-healing': 'heal',
  '/connect-clouds/aws': 'aws', '/connect-clouds/gcp': 'gcp', '/connect-clouds/azure': 'cloud',
  '/guides/team-management': 'team', '/guides/approvals': 'check', '/guides/notifications': 'bell', '/guides/billing': 'card',
  '/reference/agents-list': 'list', '/reference/api': 'code', '/reference/env-vars': 'env',
  '/concepts/multi-cloud': 'cloud', '/concepts/security-wif': 'shield', '/concepts/architecture': 'arch',
}

function Icon({ href }: { href: string }) {
  const key = BY_HREF[href] ?? 'wrench'
  if (key === 'aws' || key === 'gcp') {
    const m = BRAND_MARKS[key]
    return (
      <span className="ic" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false"><path d={m.path} fill={m.fill} /></svg>
      </span>
    )
  }
  return <span className="ic" aria-hidden="true">{ICON[key]}</span>
}

/** The accent edge follows the pointer (wire.js). Reduced motion keeps it where the stylesheet put it. */
function follow(e: PointerEvent<HTMLAnchorElement>) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const c = e.currentTarget
  const r = c.getBoundingClientRect()
  c.style.setProperty('--gx', `${e.clientX - r.left}px`)
  c.style.setProperty('--gy', `${e.clientY - r.top}px`)
}

/** A home-page link table, as cards. Which look a block gets (grid, stacked rows, full-width rows) is the stylesheet's, by position. */
export function HomeLinks({ data }: { data: Parsed }) {
  return (
    <div className="dx-hsec">
      <p className="cols">
        {data.cols[0]} · {data.cols[1]}
      </p>
      <div className="dx-hgrid dx-hrows">
        {data.rows.map((r) => (
          <a key={r.href} className="dx-hcard dx-hrow" href={r.href} onPointerMove={follow}>
            <Icon href={r.href} />
            <span className="t">{r.title}</span>
            <span className="d">{r.desc}</span>
            <span className="go" aria-hidden="true">→</span>
          </a>
        ))}
      </div>
    </div>
  )
}
