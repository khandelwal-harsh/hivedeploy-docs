import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { SkipNavLink, useMenu } from 'nextra-theme-docs'
import { GET_STARTED, PROOF, SIGN_IN, TABS, WWW, activeTab } from '../../lib/site'
import { SearchTrigger } from './SearchTrigger'
import { SwarmMark } from './SwarmMark'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]'

/** The drawer's Tab stops in document order, as the browser walks them (display:none ones have no box). */
function stopsIn(root: Element): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((e) => e.tabIndex >= 0 && e.getClientRects().length > 0)
}

/** What a reader could reach behind the open drawer: every header control but the menu button, the article column and
 *  the footer. The drawer, its scrim (Nextra's overlay, the drawer's previous sibling) and the search palette stay live. */
function behindDrawer(btn: HTMLElement, drawer: HTMLElement): Element[] {
  const header = btn.closest('header')
  const scrim = drawer.previousElementSibling
  return [
    ...(header ? Array.from(header.querySelectorAll(':scope > .dx-skip, .dx-hdr-in > *')) : []),
    ...Array.from(drawer.parentElement?.children ?? []),
    ...Array.from(document.querySelectorAll('footer')),
  ].filter((e) => e !== btn && e !== drawer && e !== scrim && !e.hasAttribute('inert'))
}

export function DocsHeader(_props: { items?: unknown }) {
  const { asPath } = useRouter()
  const path = asPath.split(/[?#]/)[0] || '/'
  const active = activeTab(path)
  const { menu, setMenu } = useMenu()
  const home = path === '/'
  const tabs = useRef<HTMLElement>(null)
  const menuBtn = useRef<HTMLButtonElement>(null)

  // The phone drawer is a modal layer over a scrim. While it is open the page behind it is inert, Tab cycles from the
  // menu button (its close control) through the drawer and back, and Esc closes it and returns focus to the button.
  // Every way of closing (the button, Esc, the scrim, a link, a route change) sets `menu` false, and the cleanup clears
  // what was marked. Widening past the phone layout hides the button, so the drawer closes with it.
  useEffect(() => {
    const btn = menuBtn.current
    const drawer = document.querySelector<HTMLElement>('aside.nextra-sidebar-container')
    if (!menu || !btn || !drawer) return
    const wide = window.matchMedia('(min-width: 768px)')
    if (wide.matches) {
      setMenu(false)
      return
    }
    const marked = behindDrawer(btn, drawer)
    marked.forEach((e) => e.setAttribute('inert', ''))
    const onKey = (e: KeyboardEvent) => {
      // the search palette opens from the drawer; the keys it handles (Esc, Tab) are its own
      if (e.defaultPrevented || (e.target instanceof Element && e.target.closest('dialog[open]'))) return
      if (e.key === 'Escape') {
        setMenu(false)
        btn.focus()
      } else if (e.key === 'Tab') {
        const stops = [btn, ...stopsIn(drawer)]
        const first = stops[0]!
        const last = stops[stops.length - 1]!
        const at = document.activeElement
        if (at !== btn && !drawer.contains(at)) {
          e.preventDefault()
          first.focus()
        } else if (e.shiftKey && at === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && at === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    const onWide = (e: MediaQueryListEvent) => {
      if (e.matches) setMenu(false)
    }
    window.addEventListener('keydown', onKey)
    wide.addEventListener('change', onWide)
    return () => {
      window.removeEventListener('keydown', onKey)
      wide.removeEventListener('change', onWide)
      marked.forEach((e) => e.removeAttribute('inert'))
    }
  }, [menu, setMenu])

  // Home only: a spotlight and a light streak follow the pointer across the tabs (wire.js 69-75).
  useEffect(() => {
    const nav = tabs.current
    if (!home || !nav) return
    const streak = nav.querySelector<HTMLElement>('.streak')
    const glow = nav.querySelector<HTMLElement>('.glowspot')
    const to = (a: Element) => {
      const r = a.getBoundingClientRect()
      const p = nav.getBoundingClientRect()
      for (const x of [streak, glow]) {
        if (!x) continue
        x.style.transform = `translateX(${r.left - p.left}px)`
        x.style.width = `${r.width}px`
      }
    }
    const links = Array.from(nav.querySelectorAll('a'))
    const handlers = links.map((a) => {
      const h = () => to(a)
      a.addEventListener('pointerenter', h)
      return [a, h] as const
    })
    const on = nav.querySelector('a.on')
    if (on) to(on)
    return () => handlers.forEach(([a, h]) => a.removeEventListener('pointerenter', h))
  }, [home, active])

  return (
    <header data-testid="docs-header" className={`dx-hdr${home ? ' spotlight' : ''}`}>
      <SkipNavLink className="dx-skip" />
      <div className="dx-hdr-in">
        <a className="brand" href={WWW}>
          <SwarmMark />
          HiveDeploy
        </a>
        <span className="crumb-sep" aria-hidden="true">/</span>
        <Link className="dx-tag" href="/">Docs</Link>
        <nav ref={tabs} className="dx-tabs" aria-label="Docs sections">
          <span className="glowspot" aria-hidden="true" />
          {TABS.map((t) => (
            <Link key={t.label} href={t.href} className={t.label === active ? 'on' : undefined} aria-current={t.label === active ? 'page' : undefined}>
              {t.label}
            </Link>
          ))}
          <span className="streak" aria-hidden="true" />
        </nav>
        <SearchTrigger className="hdr-s" />
        <nav className="links" aria-label="HiveDeploy">
          <a href={PROOF}>Proof</a>
        </nav>
        <div className="nav-cta">
          <a className="btn ghost" href={SIGN_IN.href}>{SIGN_IN.label}</a>
          <a className="btn accent" href={GET_STARTED.href}>
            {GET_STARTED.label} <span className="arrow" aria-hidden="true">→</span>
          </a>
        </div>
        <button ref={menuBtn} type="button" className="menu-btn" aria-label="Open menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>
          <svg className="bars" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <svg className="x" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </header>
  )
}
