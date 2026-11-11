import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useThemeConfig } from 'nextra-theme-docs'

type Heading = { id: string; value: string; depth: number }

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
            {h.value}
          </a>
        </li>
      ))}
    </ol>
  )
}

export function Toc({ toc, filePath }: { toc: Heading[]; filePath: string }) {
  const theme = useThemeConfig()
  const feedbackHref = theme.feedback.useLink()
  const items = toc.filter((h) => h.depth === 2 || h.depth === 3)
  const [active, setActive] = useState<string | null>(null)
  const key = items.map((h) => h.id).join('|')

  useEffect(() => {
    const ids = key ? key.split('|') : []
    let frame = 0
    const update = () => {
      frame = 0
      setActive(readActive(ids))
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

  if (items.length === 0) return null

  return (
    <>
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
      <details className="dx-mtoc">
        <summary>On this page</summary>
        <List items={items} active={active} />
      </details>
    </>
  )
}
