import { expect, test } from '@playwright/test'
import { inOrder, mdxWords, toks } from '../lib/words'

// pages/changelog/index.mdx has 16 `## YYYY-MM-DD — ` headings (three of them date ranges). The RSS script skips the ranges (owner call), so the feed has 13.
const ENTRIES = 16
const RSS_ITEMS = 13

test('sixteen dated entries, newest lit, every word kept, RSS link intact', async ({ page, request }) => {
  await page.goto('/changelog')
  await expect(page.locator('article.dx-cl-entry')).toHaveCount(ENTRIES)
  await expect(page.locator('article.dx-cl-entry.first .dx-cl-date')).toHaveText('2026-07-18')
  await expect(page.locator('article.dx-cl-entry.first')).toHaveCount(1)
  expect(inOrder(mdxWords('pages/changelog/index.mdx'), toks(await page.locator('article.nextra-content').innerText()))).toEqual({ ok: true })
  await expect(page.getByRole('link', { name: /RSS/i })).toHaveAttribute('href', '/changelog.xml')
  // the phone header keeps its links in the drawer
  if (page.viewportSize()!.width >= 768) await expect(page.getByTestId('docs-header').getByRole('link', { name: 'Changelog' })).toHaveAttribute('aria-current', 'page')
  expect((await (await request.get('/changelog.xml')).text()).match(/<item>/g)!.length).toBe(RSS_ITEMS)
})

test('the heading keeps its id and whole text for assistive tech; the visual date is hidden from it', async ({ page }) => {
  await page.goto('/changelog')
  const first = page.locator('article.dx-cl-entry.first')
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
  await expect(page.locator('p.dx-kind').first()).toHaveText('Added')
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
