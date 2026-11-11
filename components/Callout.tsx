import type { ReactNode } from 'react'

type CalloutType = 'info' | 'warning' | 'error' | 'success'

interface CalloutProps {
  type?: CalloutType
  children: ReactNode
}

const LABELS: Record<CalloutType, string> = { info: 'Note', warning: 'Warning', error: 'Error', success: 'Success' }

/** Warning always carries the triangle, so it never rests on colour alone. */
function Mark({ type }: { type: CalloutType }) {
  if (type === 'warning')
    return (
      <svg className="tri" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 1.8 15 14.2H1Z" />
        <path className="bang" d="M8 6.2v3.6M8 11.6v.4" />
      </svg>
    )
  if (type === 'error')
    return (
      <svg className="glyph x" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
    )
  if (type === 'success')
    return (
      <svg className="glyph ok" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 8.5l3.2 3.2L13 4.8" />
      </svg>
    )
  return <i className="dot" aria-hidden="true" />
}

export function Callout({ type = 'info', children }: CalloutProps) {
  const label = LABELS[type]
  return (
    <div data-testid="callout" className={`dx-callout ${type}`} role="note" aria-label={label}>
      <span className="dx-callout-label">
        <Mark type={type} />
        {label}
      </span>
      <div className="dx-callout-body">{children}</div>
    </div>
  )
}
