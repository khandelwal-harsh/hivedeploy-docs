import type { FC, ReactNode } from 'react'
import type { DocsThemeConfig } from 'nextra-theme-docs'
import { Callout } from './components/Callout'
import { DiataxisBadge } from './components/DiataxisBadge'
import { FeedbackWidget } from './components/FeedbackWidget'

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
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:site_name" content="Hivedeploy docs" />
    </>
  ),
}

export default config
