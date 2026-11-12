import { createContext, createElement, useContext, useEffect, useState } from 'react'
import type { ComponentType, ReactElement, ReactNode } from 'react'
import { getComponents, useConfig, useThemeConfig } from 'nextra-theme-docs'
import { removeLinks } from 'nextra/remove-links'

type Heading = { id: string; value: ReactElement | string; depth: number }

/** The id of the last heading whose top sits above 30% of the viewport, or null before the first. */
function readActive(ids: string[]): string | null {
  const line = window.innerHeight * 0.3
  let active: string | null = null
  for (const id of ids) {
    const el = document.getElementById(id)
    if (el && el.getBoundingClientRect().top < line) active = id
  }
  return active
}

/** Passive, rAF-throttled tracker shared by the rail and the collapsed list. */
function useActiveHeading(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join('|')
  useEffect(() => {
    const list = key ? key.split('|') : []
    let frame = 0
    const update = () => {
      frame = 0
      setActive(readActive(list))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [key])
  return active
}

const outline = (toc: Heading[] | undefined) => (toc ?? []).filter((h) => h.depth === 2 || h.depth === 3)

function List({ items, active }: { items: Heading[]; active: string | null }) {
  return (
    <ol>
      {items.map((h) => (
        <li key={h.id} className={h.depth === 3 ? 'l3' : 'l2'}>
          <a
            href={`#${h.id}`}
            className={h.id === active ? 'on' : undefined}
            aria-current={h.id === active ? 'location' : undefined}
          >
            {removeLinks(h.value)}
          </a>
        </li>
      ))}
    </ol>
  )
}

export function Toc({ toc, filePath }: { toc: Heading[]; filePath: string }) {
  const theme = useThemeConfig()
  const feedbackHref = theme.feedback.useLink()
  const items = outline(toc)
  const active = useActiveHeading(items.map((h) => h.id))
  if (items.length === 0) return null
  return (
    <aside data-testid="toc" className="dx-toc" aria-label="On this page">
      <span className="label mono">On this page</span>
      <List items={items} active={active} />
      <div className="dx-toc-foot">
        {theme.feedback.content ? (
          <a href={feedbackHref} target="_blank" rel="noreferrer">
            {theme.feedback.content as ReactNode}
          </a>
        ) : null}
        <a href={`${theme.docsRepositoryBase}/${filePath}`} target="_blank" rel="noreferrer">
          Edit this page
        </a>
      </div>
    </aside>
  )
}

/** The page's headings, handed from Nextra's wrapper to Main, which sits inside it. */
const TocContext = createContext<Heading[]>([])

type WrapperProps = { toc: Heading[]; children: ReactNode }
const nextraWrapper = getComponents({ isRawLayout: false, components: {} }).wrapper as ComponentType<WrapperProps>

/** Module-level, so its type is stable across renders. Delegates to Nextra's own wrapper. */
export function TocWrapper(props: WrapperProps) {
  return <TocContext.Provider value={props.toc}>{createElement(nextraWrapper, props)}</TocContext.Provider>
}

/** Below 1280 px the rail is hidden; this collapsed list sits in the article after the title block. */
export function MobileToc() {
  const items = outline(useContext(TocContext))
  const { normalizePagesResult } = useConfig()
  const ctx = normalizePagesResult.activeThemeContext
  const active = useActiveHeading(items.map((h) => h.id))
  if (items.length === 0 || !ctx.toc || ctx.layout !== 'default') return null
  return (
    <details className="dx-mtoc">
      <summary>
        <span>On this page</span>
        <span className="chev" aria-hidden="true">⌄</span>
      </summary>
      <List items={items} active={active} />
    </details>
  )
}
