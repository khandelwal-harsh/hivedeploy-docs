'use client'

import { ApiReferenceReact } from '@scalar/api-reference-react'
import '@scalar/api-reference-react/style.css'
import { useEffect, useRef } from 'react'

/**
 * The page head owns the single level-1 heading (D21). Scalar renders its own
 * info-title <h1>, so it is exposed at level 2 and re-marked if Scalar re-renders.
 */
function demoteScalarTitle(root: HTMLElement) {
  root.querySelectorAll('h1').forEach((h) => {
    // role="heading" alongside aria-level makes the level explicit to every a11y implementation.
    if (h.getAttribute('role') !== 'heading') h.setAttribute('role', 'heading')
    if (h.getAttribute('aria-level') !== '2') h.setAttribute('aria-level', '2')
  })
}

export function ScalarReference() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    demoteScalarTitle(root)
    // Batch: at most one query per frame, however many nodes a large spec mutates.
    let frame = 0
    const observer = new MutationObserver(() => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        demoteScalarTitle(root)
      })
    })
    observer.observe(root, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={ref} className="dx-scalar">
      <ApiReferenceReact
        configuration={{
          spec: { url: '/openapi.json' },
          theme: 'none',
          layout: 'modern',
          // The page asks readers to paste a live session token; Scalar's "Open API Client" button would carry them to
          // its hosted client (client.scalar.com, a third-party origin). Re-enabling it is an owner call.
          hideClientButton: true,
          hideDownloadButton: false,
          darkMode: true,
          forceDarkModeState: 'dark',
          hideDarkModeToggle: true,
          withDefaultFonts: false,
        }}
      />
    </div>
  )
}
