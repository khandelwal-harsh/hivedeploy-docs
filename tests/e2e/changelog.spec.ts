import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { inOrder, mdxWords, toks } from '../lib/words'

// Counted from the MDX, as D2 counts code fences, so the next entry does not break the suite. An entry is a
// `## YYYY-MM-DD — ` or `## YYYY-MM-DD → MM-DD — ` heading (lib/rehype-docs.mjs ENTRY). The RSS script keeps only the
// headings without a range (scripts/generate-changelog-rss.ts: `^(\d{4}-\d{2}-\d{2})\s*—`), so the feed has fewer items
// than the page has entries (D5, an owner call): 13 of 16 when this was written.
const MDX = readFileSync('pages/changelog/index.mdx', 'utf8')
const HEADINGS = [...MDX.matchAll(/^## (\d{4}-\d{2}-\d{2}(?: → \S+)?) — (.+)$/gm)]
const ENTRIES = HEADINGS.length
const RSS_ITEMS = HEADINGS.filter((h) => !h[1]!.includes('→')).length
const FIRST_DATE = HEADINGS[0]![1]!
// the newest entry's first kind label: its first line that is only bold text (**Added**)
const FIRST_KIND = /^\*\*([^*]+)\*\*$/m.exec(MDX.slice(HEADINGS[0]!.index))![1]!

test('every dated entry, newest lit, every word kept, RSS link intact', async ({ page, request }) => {
  expect(ENTRIES, 'the MDX has its dated headings').toBeGreaterThanOrEqual(16)
  await page.goto('/changelog')
  await expect(page.locator('article.dx-cl-entry')).toHaveCount(ENTRIES)
  await expect(page.locator('article.dx-cl-entry.first .dx-cl-date')).toHaveText(FIRST_DATE)
  await expect(page.locator('article.dx-cl-entry.first')).toHaveCount(1)
  expect(inOrder(mdxWords('pages/changelog/index.mdx'), toks(await page.locator('article.nextra-content').innerText()))).toEqual({ ok: true })
  await expect(page.getByRole('link', { name: /RSS/i })).toHaveAttribute('href', '/changelog.xml')
  // the phone header keeps its links in the drawer
  if (page.viewportSize()!.width >= 768) await expect(page.getByTestId('docs-header').getByRole('link', { name: 'Changelog' })).toHaveAttribute('aria-current', 'page')
  expect((await (await request.get('/changelog.xml')).text()).match(/<item>/g)!.length).toBe(RSS_ITEMS)
})

test('the heading keeps its id and whole text for assistive tech; the visual date is hidden from it', async ({ page }) => {
  await page.goto('/changelog')
  // this entry, wherever later entries put it
  const first = page.locator('article.dx-cl-entry', { has: page.locator('.dx-cl-date', { hasText: /^2026-07-18$/ }) })
  await expect(first).toHaveCount(1)
  await expect(first.locator('.dx-cl-date')).toHaveAttribute('aria-hidden', 'true')
  const h2 = first.locator('h2')
  await expect(h2).toHaveAttribute('id', '2026-07-18--public-reliability-ledger')
  await expect(h2.locator('span.sr')).toHaveCount(1)
  await expect(first.getByRole('heading', { level: 2, name: /^2026-07-18 — Public reliability ledger/ })).toHaveCount(1)
  await expect(first.locator('.dx-cl-date').getByText('2026-07-18')).toHaveCount(1)
  // the date shows once to the eye: the sr copy is clipped to one pixel
  const box = await h2.locator('span.sr').evaluate((e) => ({ w: e.getBoundingClientRect().width, h: e.getBoundingClientRect().height }))
  expect(box.w).toBeLessThanOrEqual(1)
  expect(box.h).toBeLessThanOrEqual(1)
  const snap = await first.ariaSnapshot()
  expect(snap).toContain('2026-07-18 — Public reliability ledger')
  expect(snap).not.toMatch(/^\s*- text: 2026-07-18\s*$/m)
})

test('kind labels and a range heading', async ({ page }) => {
  await page.goto('/changelog')
  expect(await page.locator('p.dx-kind').count()).toBeGreaterThan(10)
  await expect(page.locator('p.dx-kind').first()).toHaveText(FIRST_KIND)
  await expect(page.locator('article.dx-cl-entry .dx-cl-date', { hasText: '2026-07-02 → 07-12' })).toHaveCount(1)
  await expect(page.locator('article.nextra-content hr')).toHaveCount(0)
})

test('the date column stays in view while an entry scrolls (desktop)', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1024)
  await page.goto('/changelog')
  const date = page.locator('.dx-cl-date').nth(7)
  expect(await date.evaluate((e) => getComputedStyle(e).position)).toBe('sticky')
  const entry = page.locator('article.dx-cl-entry').nth(7)
  const eb = (await entry.boundingBox())!
  expect(eb.height).toBeGreaterThan(300)
  await entry.evaluate((e) => window.scrollTo(0, window.scrollY + e.getBoundingClientRect().top - 100))
  const before = (await date.boundingBox())!
  await page.evaluate(() => window.scrollBy(0, 150))
  const after = (await date.boundingBox())!
  const heading = (await entry.locator('h2').boundingBox())!
  expect(heading.y).toBeLessThan(before.y - 50)
  expect(after.y).toBeGreaterThanOrEqual(80)
  expect(after.y).toBeLessThan(before.y + 1)
  expect(after.y + after.height).toBeLessThan(eb.y + eb.height + 1000)
})

test('phone and tablet: the date sits above its heading and is not sticky', async ({ page }) => {
  test.skip(page.viewportSize()!.width >= 1024)
  await page.goto('/changelog')
  const date = page.locator('.dx-cl-date').first()
  expect(await date.evaluate((e) => getComputedStyle(e).position)).not.toBe('sticky')
  const d = (await date.boundingBox())!
  const h = (await page.locator('article.dx-cl-entry').first().locator('h2').boundingBox())!
  expect(d.y + d.height).toBeLessThanOrEqual(h.y + 1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
