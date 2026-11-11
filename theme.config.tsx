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

const config: DocsThemeConfig = {
  navbar: { component: DocsHeader as FC },
  search: { component: SearchTrigger as FC, placeholder: 'Search documentation…' },
  sidebar: { toggleButton: false, autoCollapse: false },
  docsRepositoryBase: 'https://github.com/khandelwal-harsh/hivedeploy-docs/blob/main',
  footer: { component: SiteFooter as FC },
  components: {
    Callout: Callout as FC,
    DiataxisBadge: DiataxisBadge as FC,
    ScalarReference: ScalarReference as FC,
  },
  main: (({ children }: { children: ReactNode }) => (
    <>
      {children}
      <FeedbackWidget />
    </>
  )) as FC<{ children: ReactNode }>,
  darkMode: false,
  nextThemes: { defaultTheme: 'dark', forcedTheme: 'dark' },
  color: { hue: 44, saturation: 99 },
  backgroundColor: { dark: '8,8,10', light: '8,8,10' },
  head: Head,
}

export default config
