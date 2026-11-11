import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { globSync } from 'glob'
import { describe, expect, it } from 'vitest'

// The manifest was generated once from base commit 95cfb46 with `git show 95cfb46:<path>`.
// The working tree is compared against it, so the guard needs no git history (CI checks out shallow).
const manifest = JSON.parse(readFileSync('tests/fixtures/mdx-manifest.json', 'utf8')) as {
  base: string
  mdx: Record<string, string>
  buildFiles: Record<string, string>
}

const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')

describe('content guard', () => {
  it('the manifest pins 39 MDX pages and the four build files', () => {
    expect(manifest.base).toBe('95cfb46')
    expect(Object.keys(manifest.mdx)).toHaveLength(39)
    expect(Object.keys(manifest.buildFiles).sort()).toEqual([
      'next-sitemap.config.js',
      'scripts/generate-changelog-rss.ts',
      'scripts/generate-llms-txt.ts',
      'scripts/snapshot-openapi.ts',
    ])
  })

  it('no MDX page differs from the base, and there are still 39', () => {
    const files = globSync('pages/**/*.mdx').sort()
    expect(files).toEqual(Object.keys(manifest.mdx).sort())
    expect(files).toHaveLength(39)
    const changed = files.filter((f) => sha256(f) !== manifest.mdx[f])
    expect(changed).toEqual([])
  })

  it('the build scripts are the ones the base has', () => {
    const changed = Object.entries(manifest.buildFiles)
      .filter(([f, hash]) => sha256(f) !== hash)
      .map(([f]) => f)
    expect(changed).toEqual([])
    const s = JSON.parse(readFileSync('package.json', 'utf8')).scripts
    expect(s.prebuild).toBe('tsx scripts/snapshot-openapi.ts')
    expect(s.postbuild).toBe('tsx scripts/generate-llms-txt.ts && tsx scripts/generate-changelog-rss.ts && next-sitemap')
  })
})
