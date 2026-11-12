import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { PAGES } from '../lib/pages'

const API = '/reference/api-reference'
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

/** Tests that open their own context at a fixed width run once: the phone project would only repeat them. */
const once = () =>
  test.skip(
    test.info().project.name !== 'desktop',
    'sets its own viewport; the desktop run covers it',
  )

for (const { path } of PAGES)
  for (const width of [1440, 390])
    test(`axe clean: ${path} at ${width}`, async ({ browser }) => {
      once()
      const ctx = await browser.newContext({ viewport: { width, height: 900 } })
      const page = await ctx.newPage()
      await page.goto(path)
      if (path === API) await page.locator('.scalar-app').first().waitFor()
      await page.waitForLoadState('networkidle')
      const b = new AxeBuilder({ page }).withTags(TAGS).exclude('footer .wordmark') // R63: the brand drawn as decoration; aria-hidden, nothing focusable
      if (path === API) b.exclude('.scalar-app') // third-party widget; its findings go in the report
      expect((await b.analyze()).violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
      await ctx.close()
    })

test('axe clean with the palette open and with the phone drawer open', async ({ browser }) => {
  once()
  const dc = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const d = await dc.newPage()
  await d.goto('/quickstart')
  await d.waitForLoadState('networkidle') // ⌘K is a React effect: a press before hydration is dropped (accepted, see the report)
  await d.keyboard.press('ControlOrMeta+k')
  await d.keyboard.type('gate')
  await d.getByRole('option').first().waitFor()
  expect(
    (
      await new AxeBuilder({ page: d }).include('[data-testid="search-palette"]').analyze()
    ).violations.map((v) => v.id),
  ).toEqual([])
  await dc.close()
  const pc = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const p = await pc.newPage()
  await p.goto('/quickstart')
  await p.waitForLoadState('networkidle')
  const menu = p.getByRole('button', { name: 'Open menu' })
  await menu.click()
  await expect(menu).toHaveAttribute('aria-expanded', 'true')
  expect(
    (await new AxeBuilder({ page: p }).exclude('footer .wordmark').analyze()).violations.map(
      (v) => v.id,
    ),
  ).toEqual([])
  await pc.close()
})

test('Tab reaches the skip link first, then the header in order, every stop with a 2 px ring', async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width < 1024)
  await page.goto('/connect-clouds/aws')
  const seen: string[] = []
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    const o = await page.evaluate(() => {
      const e = document.activeElement!
      const c = getComputedStyle(e)
      return [
        e.textContent!.trim().slice(0, 24) || e.getAttribute('aria-label'),
        c.outlineStyle,
        parseFloat(c.outlineWidth),
      ] as const
    })
    seen.push(String(o[0]))
    expect(o[1], `stop ${i}: ${o[0]}`).not.toBe('none')
    expect(o[2], `stop ${i}: ${o[0]}`).toBeGreaterThanOrEqual(2)
  }
  expect(seen[0]).toMatch(/skip/i)
  expect(seen.slice(1, 10).join('|')).toMatch(
    /HiveDeploy\|Docs\|Documentation\|API reference\|Changelog\|.*Search.*\|Proof\|Sign in\|Get started/,
  )
})

test('one h1 and headings in order on every page', async ({ page }) => {
  for (const { path } of PAGES.filter((p) => p.path !== API)) {
    await page.goto(path)
    await expect(page.locator('h1')).toHaveCount(1)
    // D10: full-layout pages have no <main>; the article is on every layout
    const l = await page
      .locator('article.nextra-content :is(h1,h2,h3,h4)')
      .evaluateAll((hs) => hs.map((h) => +h.tagName[1]!))
    expect(l[0], path).toBe(1)
    expect(l.length, path).toBeGreaterThan(1)
    for (let i = 1; i < l.length; i++)
      expect(l[i]! - l[i - 1]!, `${path} #${i}`).toBeLessThanOrEqual(1)
  }
  // D21: the API page keeps two h1 tags (ours, and Scalar's info title), but Chrome's accessibility tree holds one level-1
  // heading. Playwright's role engine ignores aria-level on a native h1, so read the browser's own tree.
  await page.goto(API)
  await page.locator('.scalar-app').first().waitFor()
  await expect(async () => {
    const cdp = await page.context().newCDPSession(page)
    const { nodes } = await cdp.send('Accessibility.getFullAXTree')
    await cdp.detach()
    const h1s = nodes.filter(
      (n) =>
        n.role?.value === 'heading' &&
        !n.ignored &&
        Number(n.properties?.find((q) => q.name === 'level')?.value.value) === 1,
    )
    expect(h1s.map((n) => String(n.name?.value ?? ''))).toEqual([
      expect.stringMatching(/API reference/i),
    ])
  }).toPass()
})

test('every page has one main landmark holding its h1 and its content; on the full-layout pages it sits below the article', async ({ page }) => {
  for (const { path } of PAGES) {
    await page.goto(path)
    if (path === API) await page.locator('.scalar-app').first().waitFor()
    const main = page.getByRole('main')
    await expect(main, path).toHaveCount(1)
    await expect(main.locator('h1').first(), path).toBeVisible()
    const r = await page.evaluate(() => {
      const m = document.querySelector('main')!
      const a = document.querySelector('article.nextra-content')!
      return {
        inArticle: a.contains(m),
        content: !!m.querySelector(':scope .dx-homebody, :scope .dx-body'),
        scalar: !!m.querySelector('.scalar-app'),
        // D10 / D13: the default-layout rules (`article > main`: the 720 clamp, padding, gutter) must not reach it
        child: m.parentElement === a,
      }
    })
    expect(r.inArticle, path).toBe(true)
    expect(r.content, path).toBe(true)
    if (path === API) expect(r.scalar, path).toBe(true)
    if (path === '/' || path === API) expect(r.child, path).toBe(false)
  }
})

test('on the home and the API reference the skip link still lands in the content, inside main', async ({ page }) => {
  for (const path of ['/', API]) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
    await page.keyboard.press('Enter')
    expect(await page.evaluate(() => location.hash), path).toBe('#reach-skip-nav')
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => !!document.activeElement?.closest('main')), path).toBe(true)
  }
})

test('reduced motion: no transition runs', async ({ browser }) => {
  once()
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto('/')
  expect(
    await page
      .locator('.dx-hcard')
      .first()
      .evaluate((e) => getComputedStyle(e).transitionDuration),
  ).toMatch(/^0s/)
  await page.waitForLoadState('networkidle') // ⌘K is a React effect; see above
  await page.keyboard.press('ControlOrMeta+k')
  await expect(page.getByTestId('search-palette')).toBeVisible()
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
  await ctx.close()
})
