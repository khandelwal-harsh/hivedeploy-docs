import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { SkipNavLink, useMenu } from 'nextra-theme-docs'
import { GET_STARTED, PROOF, SIGN_IN, TABS, WWW, activeTab } from '../../lib/site'
import { SearchTrigger } from './SearchTrigger'
import { SwarmMark } from './SwarmMark'

export function DocsHeader(_props: { items?: unknown }) {
  const { asPath } = useRouter()
  const path = asPath.split(/[?#]/)[0] || '/'
  const active = activeTab(path)
  const { menu, setMenu } = useMenu()
  const home = path === '/'
  const tabs = useRef<HTMLElement>(null)
  const menuBtn = useRef<HTMLButtonElement>(null)

  // The phone drawer is an overlay with a scrim, so Esc closes it and focus goes back to the button that opened it.
  // An Esc the search palette has already handled (defaultPrevented) only closes the palette.
  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      setMenu(false)
      menuBtn.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
