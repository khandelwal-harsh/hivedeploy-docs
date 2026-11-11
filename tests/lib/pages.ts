export interface PageEntry {
  name: string
  path: string
}

export const PAGES: PageEntry[] = [
  { name: 'home', path: '/' },
  { name: 'quickstart', path: '/quickstart' },
  { name: 'aws', path: '/connect-clouds/aws' },
  { name: 'concept', path: '/concepts/architecture' },
  { name: 'api-reference', path: '/reference/api-reference' },
  { name: 'changelog', path: '/changelog' },
]
