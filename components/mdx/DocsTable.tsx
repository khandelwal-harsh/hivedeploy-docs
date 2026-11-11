import type { ComponentProps } from 'react'

/** Every article table sits in one scroll box. Keyboard users can scroll it, so it is a focusable region. */
export function DocsTable(props: ComponentProps<'table'>) {
  return (
    <div className="dx-table" role="region" aria-label="Table" tabIndex={0}>
      <table {...props} />
    </div>
  )
}
