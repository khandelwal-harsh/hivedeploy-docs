// Chrome words and links. Transcribed from the marketing site's content/site.ts; this file is the only place they live.
export const WWW = 'https://www.hivedeploy.in'
export const DOCS = 'https://docs.hivedeploy.in'
export const PROOF = 'https://proof.hivedeploy.in'
export const APP = 'https://app.hivedeploy.in'

export const SIGN_IN = { label: 'Sign in', href: `${APP}/login` }
export const GET_STARTED = { label: 'Get started', href: `${WWW}/#waitlist` }

export type TabLabel = 'Documentation' | 'API reference' | 'Changelog'
export const TABS: { label: TabLabel; href: string }[] = [
  { label: 'Documentation', href: '/' },
  { label: 'API reference', href: '/reference/api-reference' },
  { label: 'Changelog', href: '/changelog' },
]

export function activeTab(pathname: string): TabLabel {
  const p = pathname.split(/[?#]/)[0]!.replace(/\/+$/, '') || '/'
  if (p === '/changelog' || p.startsWith('/changelog/')) return 'Changelog'
  if (p === '/reference/api-reference') return 'API reference'
  return 'Documentation'
}

export interface FooterCol {
  title: string
  links: { label: string; href: string }[]
}

// On www the `#anchor` links are same-page; here they point at www. Docs and Changelog stay on this site.
export const FOOTER: { blurb: string; email: string; cols: FooterCol[]; legal: string; made: string } = {
  blurb: 'Specialist AI agents for every layer of your stack. Built for engineers who ship to AWS, GCP, Azure, Cloudflare, and Kubernetes.',
  email: 'hello@hivedeploy.in',
  cols: [
    { title: 'Product', links: [
      { label: 'Agents', href: `${WWW}/#agents` }, { label: 'How it works', href: `${WWW}/#how-it-works` }, { label: 'Pricing', href: `${WWW}/#pricing` },
      { label: 'Proof', href: `${WWW}/#proof` }, { label: 'Changelog', href: '/changelog' },
    ] },
    { title: 'Resources', links: [
      { label: 'Docs', href: '/' }, { label: 'Reliability ledger', href: PROOF },
      { label: 'Changelog', href: '/changelog' }, { label: 'Compare', href: `${WWW}/#compare` }, { label: 'FAQ', href: `${WWW}/#faq` },
    ] },
    { title: 'Company', links: [
      { label: 'About', href: '#' }, { label: 'Contact', href: 'mailto:hello@hivedeploy.in' }, { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' }, { label: 'Security', href: '#' },
    ] },
  ],
  legal: '© 2026 HiveDeploy. All rights reserved.',
  made: 'Made for engineers who ship to production.',
}
