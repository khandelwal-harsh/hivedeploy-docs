import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (f: string): string => readFileSync(f, 'utf8')

describe('retired', () => {
  it('the css-drift check is gone, everywhere', () => {
    expect(existsSync('scripts/check-css-drift.ts')).toBe(false)
    expect(existsSync('.github/workflows/css-drift-check.yml')).toBe(false)
    expect(JSON.parse(read('package.json')).scripts['css-drift']).toBeUndefined()
    for (const f of ['README.md', 'docs/DEPLOY.md']) expect(read(f)).not.toMatch(/css-drift|FRONTEND_REPO_READ_TOKEN/)
  })
  it('no Google Fonts anywhere', () => {
    for (const f of ['theme.config.tsx', 'pages/_app.tsx', 'next.config.mjs'])
      expect(read(f)).not.toMatch(/fonts\.g(oogleapis|static)|next\/font\/google/)
  })
})
