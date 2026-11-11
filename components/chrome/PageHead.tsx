import { useEffect, useState } from 'react'
import { useConfig } from 'nextra-theme-docs'
import { formatUpdated } from '../../lib/format-updated'
import { DiataxisBadge, isDiataxis } from '../DiataxisBadge'

export function PageHead() {
  const { frontMatter, timestamp } = useConfig()
  const [mounted, setMounted] = useState(false)
  // The date is formatted in the reader's locale zone, so it only renders after mount.
  useEffect(() => setMounted(true), [])
  const fm = frontMatter as Record<string, unknown>
  const title = typeof fm['title'] === 'string' ? fm['title'] : ''
  const kind = fm['diataxis']
  const updated = timestamp ? formatUpdated(timestamp) : null
  return (
    <>
      <h1 className="dx-title">{title}</h1>
      <div className="dx-meta">
        {isDiataxis(kind) ? <DiataxisBadge type={kind} /> : null}
        {mounted && updated ? (
          <span className="upd">
            Last updated on{' '}
            <time dateTime={updated.iso}>{updated.text}</time>
          </span>
        ) : null}
      </div>
    </>
  )
}
