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
  // Nextra marks the open page with an `active` class only; assistive tech and the pill style want aria-current.
  useEffect(() => {
    const side = document.querySelector('.nextra-sidebar-container')
    side?.querySelectorAll('a[aria-current="page"]').forEach((a) => a.removeAttribute('aria-current'))
    side?.querySelectorAll('li.active > a').forEach((a) => a.setAttribute('aria-current', 'page'))
  }, [asPath])
  if (pathname === '/') {
    return (
      <div className="dx-home">
        <HomeHero />
        <div className="dx-homebody">{children}</div>
      </div>
    )
  }
  const parts = isValidElement<{ children?: ReactNode }>(children) ? children.props.children : undefined
  const raw = Array.isArray(parts) && parts.length === 5 ? (parts as ReactNode[]) : null
  if (!raw) {
    return (
      <div className="dx-body">
        <PageHead />
        <MobileToc />
        {children}
        <div className="dx-pagefoot">
          <FeedbackWidget />
        </div>
      </div>
    )
  }
  const pagination = raw[4]
  return (
    <div className="dx-body">
      <PageHead />
      <MobileToc />
      {Children.toArray(raw.slice(0, 4))}
      <div className="dx-pagefoot">
        <FeedbackWidget />
        {pagination ? <div className="dx-pn">{pagination}</div> : null}
      </div>
    </div>
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
