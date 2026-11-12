import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { useRouter } from 'next/router'
import { closeSearch, toggleSearch, openSearch, useSearchOpen } from '../../lib/search-store'
import { groupHits, loadIndex, marks, search, type Hit, type SearchIndex } from '../../lib/search-index'

const ICONS: Record<string, string> = {
  'Connect a cloud': 'M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4.25 4.25 0 0 1-.5 8.5z',
  Troubleshooting: 'M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5M14.5 6.5 17 4l3 3-2.5 2.5',
  Changelog: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
}
const DEFAULT_ICON = 'M4 5.5A1.5 1.5 0 0 1 5.5 4H19v14H5.5A1.5 1.5 0 0 0 4 19.5zM4 19.5A1.5 1.5 0 0 0 5.5 21H19'

function Marked({ text, query }: { text: string; query: string }) {
  return (
    <>
      {marks(text, query).map((m, i) => (typeof m === 'string' ? <Fragment key={i}>{m}</Fragment> : <mark key={i}>{m.mark}</mark>))}
    </>
  )
}

const isField = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
}

export function SearchPalette() {
  const open = useSearchOpen()
  const router = useRouter()
  const id = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<SearchIndex | null>(null)
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState(0)
  const resultsId = 'search-results'

  // The query empties in the render that closes the palette, so the next open starts empty before anyone types. A
  // setQuery('') in the effect below would be a low-priority update that a quick ⌘K and the first keys can overtake.
  const [shown, setShown] = useState(open)
  if (shown !== open) {
    setShown(open)
    if (!open) setQuery('')
  }

  // One capture-phase listener: ⌘K / Ctrl+K toggles (and stops Scalar's own handler), "/" opens outside a field.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        e.stopImmediatePropagation()
        toggleSearch()
      } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isField(e.target)) {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [])

  // The native dialog follows the store; focus returns to whatever had it before opening.
  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      d.showModal()
      input.current?.focus()
    } else if (!open && d.open) {
      d.close()
    }
  }, [open])

  useEffect(() => {
    if (!open || index || failed) return
    loadIndex(router.basePath).then(setIndex, () => setFailed(true))
  }, [open, index, failed, router.basePath])

  const groups = useMemo(() => (index ? groupHits(search(index, query)) : []), [index, query])
  const flat: Hit[] = useMemo(() => groups.flatMap((g) => g.hits), [groups])
  useEffect(() => setActive(0), [flat])
  const optionId = (h: Hit) => `${id}-${h.id}`
  const current = flat[active]

  useEffect(() => {
    if (current) document.getElementById(optionId(current))?.scrollIntoView({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  const go = (h: Hit) => {
    closeSearch()
    void router.push(h.route)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Escape') {
      // Chrome's close watcher can ignore a repeat Esc without fresh user activation; close it ourselves.
      e.preventDefault()
      closeSearch()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (flat.length) setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + flat.length) % flat.length)
    } else if (e.key === 'Enter' && e.target === input.current) {
      e.preventDefault()
      if (current) go(current)
    } else if (e.key === 'Tab') {
      const stops = Array.from(dialog.current!.querySelectorAll<HTMLElement>('input, button')).filter((el) => !el.hasAttribute('disabled'))
      const at = stops.indexOf(document.activeElement as HTMLElement)
      const next = stops[(at + (e.shiftKey ? -1 : 1) + stops.length) % stops.length]
      e.preventDefault()
      next?.focus()
    }
  }

  const onDialogClick = (e: MouseEvent<HTMLDialogElement>) => {
    // The ::backdrop belongs to the dialog; a click outside its box is a click on the backdrop.
    const r = e.currentTarget.getBoundingClientRect()
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeSearch()
  }

  const onOptionClick = (e: MouseEvent<HTMLAnchorElement>, h: Hit) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    go(h)
  }

  const live = !query.trim() || !index ? '' : flat.length ? `${flat.length} ${flat.length === 1 ? 'result' : 'results'}` : 'No results.'

  return (
    <dialog
      ref={dialog}
      data-testid="search-palette"
      className="dx-scrim dx-modal"
      aria-label="Search documentation"
      onClose={() => {
        // `close` is delivered as a task after dialog.close(). If ⌘K reopened the palette before it arrived, the event
        // belongs to the palette that already closed: shutting this one would drop keystrokes and move focus away.
        if (dialog.current?.open) return
        closeSearch()
        opener.current?.focus()
        opener.current = null
      }}
      onKeyDown={onKeyDown}
      onClick={onDialogClick}
    >
      <div className="dx-q">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <input
          ref={input}
          type="search"
          role="combobox"
          aria-label="Search documentation"
          aria-autocomplete="list"
          aria-expanded={flat.length > 0}
          aria-controls={resultsId}
          aria-activedescendant={current ? optionId(current) : undefined}
          placeholder="Search documentation…"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="kbd" aria-label="esc, close search" onClick={() => closeSearch()}>
          esc
        </button>
      </div>
      <div id={resultsId} role="listbox" aria-label="Search results" className="dx-res">
        {groups.map((g) => (
          <div key={g.section} role="group" aria-label={g.section}>
            <div className="grp" aria-hidden="true">
              {g.section}
            </div>
            {g.hits.map((h) => (
              <a
                key={h.id}
                id={optionId(h)}
                role="option"
                aria-selected={h === current}
                href={h.route}
                tabIndex={-1}
                className={`dx-hit${h === current ? ' on' : ''}`}
                onClick={(e) => onOptionClick(e, h)}
                onMouseMove={() => setActive(flat.indexOf(h))}
              >
                <span className="ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" focusable="false">
                    <path d={ICONS[g.section] ?? DEFAULT_ICON} />
                  </svg>
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="p">{h.pageTitle}</span>
                  <span className="h">
                    <Marked text={h.heading} query={query} />
                  </span>
                  {h.excerpt && (
                    <span className="x">
                      <Marked text={h.excerpt} query={query} />
                    </span>
                  )}
                </span>
                <span className="ret" aria-hidden="true">
                  ↵
                </span>
              </a>
            ))}
          </div>
        ))}
      </div>
      {failed && (
        <p className="dx-err" role="alert">
          Search is unavailable. Reload the page.
        </p>
      )}
      {!failed && live === 'No results.' && (
        <p className="dx-none" aria-hidden="true">
          No results.
        </p>
      )}
      <p className="sr" aria-live="polite">
        {live}
      </p>
      <div className="dx-mfoot" aria-hidden="true">
        <span>
          <span className="kbd">↑</span>
          <span className="kbd">↓</span>
        </span>
        <span>
          <span className="kbd">↵</span>
        </span>
        <span>
          <span className="kbd">esc</span>
        </span>
      </div>
    </dialog>
  )
}
