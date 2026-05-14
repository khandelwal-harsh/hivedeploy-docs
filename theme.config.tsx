import type { FC, ReactNode } from 'react'
import type { DocsThemeConfig } from 'nextra-theme-docs'
import { useConfig } from 'nextra-theme-docs'
import { useRouter } from 'next/router'
import { Callout } from './components/Callout'
import { DiataxisBadge } from './components/DiataxisBadge'
import { FeedbackWidget } from './components/FeedbackWidget'

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
  return (
    <>
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
    </>
  )
}

const config: DocsThemeConfig = {
  logo: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>hivedeploy / docs</span>,
  project: {
    link: 'https://github.com/khandelwal-harsh/hivedeploy-docs',
  },
  docsRepositoryBase: 'https://github.com/khandelwal-harsh/hivedeploy-docs/blob/main',
  footer: {
    content: <span>© {new Date().getFullYear()} Hivedeploy</span>,
  },
  components: {
    Callout: Callout as FC,
    DiataxisBadge: DiataxisBadge as FC,
  },
  main: (({ children }: { children: ReactNode }) => (
    <>
      {children}
      <FeedbackWidget />
    </>
  )) as FC<{ children: ReactNode }>,
  darkMode: true,
  nextThemes: { defaultTheme: 'dark' },
  head: Head,
}

export default config
