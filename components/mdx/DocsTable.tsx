import type { ComponentProps } from 'react'
import { useRouter } from 'next/router'
import { HomeLinks, parseLinkTable } from './HomeLinks'

type Props = ComponentProps<'table'> & { 'data-heading'?: string }

/** Every article table sits in one scroll box. Keyboard users can scroll it, so it is a focusable region, named from
 *  the heading before it (lib/rehype-docs.mjs `nameTables`), or plain "Table" when there is none.
 *  On the home, a table of links (a link in each first cell, a note in the second) becomes link cards. */
export function DocsTable({ 'data-heading': heading, ...props }: Props) {
  const { pathname } = useRouter()
  const links = pathname === '/' ? parseLinkTable(props.children) : null
  if (links) return <HomeLinks data={links} />
  return (
    <div
      className="dx-table"
      role="region"
      aria-label={heading ? `Table: ${heading}` : 'Table'}
      tabIndex={0}
    >
      <table {...props} />
    </div>
  )
}
