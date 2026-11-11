import { useEffect, useRef, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { HomeLinks, parseLinkTable } from './HomeLinks'

type Props = ComponentProps<'table'> & { 'data-heading'?: string }

/** Every article table sits in one scroll box: a region named from the heading before it (lib/rehype-docs.mjs
 *  `nameTables`), or plain "Table" when there is none. On the home, a table of links (a link in each first cell, a
 *  note in the second) becomes link cards. */
export function DocsTable({ 'data-heading': heading, ...props }: Props) {
  const { pathname } = useRouter()
  const links = pathname === '/' ? parseLinkTable(props.children) : null
  if (links) return <HomeLinks data={links} />
  return (
    <ScrollBox name={heading ? `Table: ${heading}` : 'Table'}>
      <table {...props} />
    </ScrollBox>
  )
}

/** While the table is wider than its box, keyboard users have to scroll it, so the box is a tab stop; when it fits it
 *  is not one. A resize of the box or the table measures again. */
function ScrollBox({ name, children }: { name: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  // The server cannot measure, so the page starts with the stop (a box that scrolls is never out of reach) and drops
  // it once the box is measured and fits.
  const [scrolls, setScrolls] = useState(true)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setScrolls(el.scrollWidth > el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={box} className="dx-table" role="region" aria-label={name} tabIndex={scrolls ? 0 : undefined}>
      {children}
    </div>
  )
}
