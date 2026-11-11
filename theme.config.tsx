import { Children, isValidElement, useEffect } from 'react'
import type { FC, ReactNode } from 'react'
import type { DocsThemeConfig } from 'nextra-theme-docs'
import { useConfig } from 'nextra-theme-docs'
import { useRouter } from 'next/router'
import { Callout } from './components/Callout'
import { DiataxisBadge } from './components/DiataxisBadge'
import { FeedbackWidget } from './components/FeedbackWidget'
import { ScalarReference } from './components/ScalarReference'
import { DocsHeader } from './components/chrome/DocsHeader'
import { SiteFooter } from './components/chrome/SiteFooter'
import { SearchTrigger } from './components/chrome/SearchTrigger'
import { PageHead } from './components/chrome/PageHead'
import { MobileToc, Toc, TocWrapper } from './components/chrome/Toc'
import { headings } from './components/Heading'
import { HomeHero } from './components/home/HomeHero'
import { CodeBlock } from './components/mdx/CodeBlock'
import { DocsTable } from './components/mdx/DocsTable'

function Head() {
  const router = useRouter()
  const { frontMatter } = useConfig()
  const title = (frontMatter as Record<string, string>)['title'] ?? 'Hivedeploy docs'
  const description =
    (frontMatter as Record<string, string>)['description'] ??
    'Customer-facing documentation for Hivedeploy.'
  const section = router.asPath.split('/')[1] ?? ''
  const ogUrl = `https://docs.hivedeploy.in/api/og?title=${encodeURIComponent(title)}&section=${encodeURIComponent(section)}`
  const canonical = `https://docs.hivedeploy.in${router.asPath.split('?')[0]}`
  const pageTitle =
    router.asPath === '/' ? 'Hivedeploy docs' : `${title} | Hivedeploy docs`
  return (
    <>
      <title>{pageTitle}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content={description} />
      <meta property="og:site_name" content="Hivedeploy docs" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogUrl} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="article" />
      <meta name="twitter:card" content="summary_large_image" />
      <link rel="canonical" href={canonical} />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </>
  )
}

/**
 * Nextra hands `main` one fragment: [topContent, article, timestamp, bottomContent, pagination].
 * The feedback widget goes between the article and the pagination, so the page foot reads
 * feedback, then previous / next. If the shape ever differs, the widget is appended instead.
 */
function Main({ children }: { children: ReactNode }) {
  const { pathname, asPath } = useRouter()
  // Nextra renders its own <main> only in the default layout; a full-layout page is a bare <article>.
  const full = useConfig().normalizePagesResult.activeThemeContext.layout === 'full'
  // Nextra marks the open page with an `active` class only; assistive tech and the pill style want aria-current. It
  // mounts the phone drawer's copy of the list after this effect first runs, and re-renders lists as folders open, so
  // the mark is re-applied whenever the sidebar's links change (at most once a frame).
  useEffect(() => {
    const side = document.querySelector('.nextra-sidebar-container')
    if (!side) return
    const mark = () => {
      side.querySelectorAll('a[aria-current="page"]').forEach((a) => {
        if (!a.matches('li.active > a')) a.removeAttribute('aria-current')
      })
      side.querySelectorAll('li.active > a:not([aria-current="page"])').forEach((a) => a.setAttribute('aria-current', 'page'))
    }
    mark()
    let frame = 0
    const observer = new MutationObserver(() => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0
          mark()
        })
    })
    observer.observe(side, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    return () => {
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [asPath])
  // Nextra's previous / next cards show only a title; assistive tech also hears which way each goes, and the name
  // starts with "Previous" or "Next" and keeps the visible title (WCAG 2.5.3). The next card is the one Nextra pushes right.
  useEffect(() => {
    document.querySelectorAll('.dx-pn a').forEach((a) => {
      a.setAttribute('aria-label', `${a.matches('[class~="ltr:_ml-auto"]') ? 'Next' : 'Previous'}: ${(a.textContent ?? '').trim()}`)
    })
  }, [asPath])
  // A full-layout page gets its main landmark one level below the article, so the default layout's `article > main`
  // rules (the 720 measure, its padding, the gutter) never reach it.
  if (pathname === '/') {
    return (
      <div className="dx-home">
        <main>
          <HomeHero />
          <div className="dx-homebody">{children}</div>
        </main>
      </div>
    )
  }
  const parts = isValidElement<{ children?: ReactNode }>(children) ? children.props.children : undefined
  const raw = Array.isArray(parts) && parts.length === 5 ? (parts as ReactNode[]) : null
  const pagination = raw?.[4]
  const body = (
    <div className="dx-body">
      <PageHead />
      <MobileToc />
      {raw ? Children.toArray(raw.slice(0, 4)) : children}
      <div className="dx-pagefoot">
        <FeedbackWidget />
        {pagination ? <div className="dx-pn">{pagination}</div> : null}
      </div>
    </div>
  )
  return full ? (
    <div className="dx-full">
      <main>{body}</main>
    </div>
  ) : (
    body
  )
}

const config: DocsThemeConfig = {
  navbar: { component: DocsHeader as FC },
  search: { component: SearchTrigger as FC, placeholder: 'Search documentation…' },
  sidebar: { toggleButton: false, autoCollapse: false },
  docsRepositoryBase: 'https://github.com/khandelwal-harsh/hivedeploy-docs/blob/main',
  footer: { component: SiteFooter as FC },
  components: {
    ...headings,
    pre: CodeBlock as FC,
    table: DocsTable as FC,
    wrapper: TocWrapper as FC,
    Callout: Callout as FC,
    DiataxisBadge: DiataxisBadge as FC,
    ScalarReference: ScalarReference as FC,
  },
  toc: { component: Toc as FC, float: true },
  gitTimestamp: null,
  main: Main as FC<{ children: ReactNode }>,
  darkMode: false,
  nextThemes: { defaultTheme: 'dark', forcedTheme: 'dark' },
  color: { hue: 44, saturation: 99 },
  backgroundColor: { dark: '8,8,10', light: '8,8,10' },
  head: Head,
}

export default config
