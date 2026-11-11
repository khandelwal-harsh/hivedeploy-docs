import { globSync } from 'glob'
import { expect, test } from '@playwright/test'

const PAGES = globSync('pages/**/*.mdx')
  .map((f) => '/' + f.replace(/^pages\//, '').replace(/\.mdx$/, '').replace(/(^|\/)index$/, ''))
  .map((p) => (p === '/' ? p : p.replace(/\/$/, '')))
  .sort()

test('the rail is 232 px, lists the headings and marks the one in view', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1280)
  await page.goto('/connect-clouds/aws')
  const toc = page.getByTestId('toc')
  expect(Math.round((await toc.boundingBox())!.width)).toBe(232)
  await expect(toc.getByText('On this page')).toBeVisible()
  await page.locator('#verify').scrollIntoViewIfNeeded()
  await page.mouse.wheel(0, 400)
  await expect(toc.locator('a[aria-current="location"]')).toHaveCount(1)
  expect(
    await toc.locator('a.on').evaluate((e) => getComputedStyle(e, '::before').backgroundColor),
  ).toBe('rgb(245, 179, 1)')
  await expect(toc.getByRole('link', { name: 'Edit this page' })).toHaveAttribute(
    'href',
    /blob\/main\/pages\/connect-clouds\/aws\.mdx$/,
  )
})

test('the segment does not animate', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1280)
  await page.goto('/connect-clouds/aws')
  const toc = page.getByTestId('toc')
  await page.locator('#verify').scrollIntoViewIfNeeded()
  await page.mouse.wheel(0, 400)
  const dur = await toc.locator('a.on').evaluate((e) => getComputedStyle(e, '::before').transitionDuration)
  expect(dur).toBe('0s')
})

test('on every page the rail text is exactly the depth 2 and 3 heading text', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1280)
  test.setTimeout(180_000)
  expect(PAGES.length).toBeGreaterThan(30)
  let withRail = 0
  for (const path of PAGES) {
    await page.goto(path)
    const toc = page.getByTestId('toc')
    if ((await toc.count()) === 0) continue
    withRail++
    const rail = (await toc.locator('ol a').allInnerTexts()).map((t) => t.trim())
    const heads = (await page.locator('article.nextra-content :is(h2, h3)').allInnerTexts()).map((t) => t.trim())
    expect(rail, path).toEqual(heads)
    expect(await toc.locator('ol a a').count(), path).toBe(0)
  }
  expect(withRail).toBeGreaterThan(25)
})

test('a heading with a link in it causes no React errors and the page is not re-rendered from scratch', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  await page.addInitScript(() => addEventListener('DOMContentLoaded', () => ((window as unknown as { __root: Element }).__root = document.querySelector('#__next > div')!)))
  await page.goto('/reference/env-vars')
  await page.waitForTimeout(1500)
  expect(errors.filter((e) => /react|hydrat|#4\d\d/i.test(e))).toEqual([])
  expect(await page.evaluate(() => (window as unknown as { __root: Element }).__root.isConnected)).toBe(true)
})

test('no heading is replaced after load', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __gone: number; __article: number }
    w.__gone = 0
    w.__article = 0
    new MutationObserver((recs) => {
      for (const r of recs)
        r.removedNodes.forEach((n) => {
          if (!(n instanceof Element)) return
          if (/^H[2-6]$/.test(n.tagName)) w.__gone++
          // a whole-article replacement must not pass silently
          if (n.matches('article.nextra-content') || n.querySelector('article.nextra-content')) w.__article++
        })
    }).observe(document, { childList: true, subtree: true })
  })
  await page.goto('/connect-clouds/aws')
  await page.waitForTimeout(1500)
  expect(await page.evaluate(() => (window as unknown as { __gone: number }).__gone)).toBe(0)
  expect(await page.evaluate(() => (window as unknown as { __article: number }).__article)).toBe(0)
})

// Review Focus 5
for (const hash of ['step-2--create-the-iam-role-in-your-aws-account', 'verify'])
  test(`a link to #${hash} lands below the header and is marked in the rail`, async ({ page }) => {
    await page.goto('/connect-clouds/aws#' + hash)
    await page.waitForTimeout(500)
    const top = await page.locator('#' + hash).evaluate((e) => e.getBoundingClientRect().top)
    expect(top).toBeGreaterThanOrEqual(56)
    expect(top).toBeLessThan(120)
    const rail = page.locator(page.viewportSize()!.width >= 1280 ? '[data-testid="toc"]' : 'details.dx-mtoc')
    if (page.viewportSize()!.width >= 1280) await expect(rail.locator(`a[href="#${hash}"]`)).toHaveAttribute('aria-current', 'location')
  })

test('phone: "On this page" opens above the first section and stays open', async ({ page }) => {
  test.skip(page.viewportSize()!.width >= 768)
  await page.goto('/quickstart')
  const d = page.locator('details.dx-mtoc')
  const s = d.locator('> summary')
  await expect(s).toBeVisible()
  const meta = (await page.locator('.dx-meta').boundingBox())!
  const sb = (await s.boundingBox())!
  expect(sb.y).toBeGreaterThanOrEqual(meta.y + meta.height - 1)
  expect(sb.y).toBeLessThan((await page.locator('article h2').first().boundingBox())!.y)
  expect(Math.round(sb.height)).toBe(46)
  await s.click()
  await expect(d.getByRole('link', { name: /Step 1/ })).toBeVisible()
  await page.waitForTimeout(1000)
  expect(await d.evaluate((e: HTMLDetailsElement) => e.open)).toBe(true)
})

for (const width of [768, 1024]) {
  test(`${width}: the article starts under the header with the collapsed list above the first section`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop')
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/connect-clouds/aws')
    const main = (await page.locator('article.nextra-content > main').boundingBox())!
    expect(main.y).toBeLessThan(80)
    expect(main.y).toBeGreaterThanOrEqual(56)
    await expect(page.getByTestId('toc')).toBeHidden()
    const s = page.locator('details.dx-mtoc > summary')
    await expect(s).toBeVisible()
    expect((await s.boundingBox())!.y).toBeLessThan((await page.locator('article h2').first().boundingBox())!.y)
  })
}

for (const width of [1024, 1279]) {
  test(`${width}: the header fits and the page does not scroll sideways`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop')
    await page.setViewportSize({ width, height: 800 })
    for (const path of ['/', '/quickstart', '/connect-clouds/aws']) {
      await page.goto(path)
      expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(width)
      const cta = (await page.getByRole('link', { name: /Get started/ }).first().boundingBox())!
      expect(cta.x + cta.width, path).toBeLessThanOrEqual(width)
    }
  })
}

test('ids are unique in the document', async ({ page }) => {
  await page.goto('/connect-clouds/aws')
  const dup = await page.evaluate(() => {
    const seen = new Map<string, number>()
    document.querySelectorAll('[id]').forEach((e) => seen.set(e.id, (seen.get(e.id) ?? 0) + 1))
    const testids = new Map<string, number>()
    // test ids name a kind of thing; "code-block" and "callout" legitimately repeat
    document.querySelectorAll('[data-testid]:not([data-testid="code-block"]):not([data-testid="callout"])').forEach((e) => testids.set(e.getAttribute('data-testid')!, (testids.get(e.getAttribute('data-testid')!) ?? 0) + 1))
    return [...seen, ...testids].filter(([, n]) => n > 1).map(([k]) => k)
  })
  expect(dup).toEqual([])
})
