import type { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>hivedeploy / docs</span>,
  project: {
    link: 'https://github.com/khandelwal-harsh/hivedeploy-docs',
  },
  docsRepositoryBase: 'https://github.com/khandelwal-harsh/hivedeploy-docs/blob/main',
  footer: {
    content: <span>© {new Date().getFullYear()} Hivedeploy</span>,
  },
  darkMode: true,
  nextThemes: { defaultTheme: 'dark' },
  useNextSeoProps() {
    return { titleTemplate: '%s | Hivedeploy docs' }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:site_name" content="Hivedeploy docs" />
    </>
  ),
}

export default config
