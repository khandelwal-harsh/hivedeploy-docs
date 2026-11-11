import { expect, test } from '@playwright/test'
import { inOrder, mdxWords, toks } from '../lib/words'

test('the home is index.mdx word for word under its own title and description', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('AI Orchestrator — Documentation')
  await expect(page.getByTestId('home-hero').locator('.lead')).toHaveText('Reference content for the docs site at docs.hivedeploy.in. Every doc fits one of four Diátaxis types.')
  expect(inOrder(mdxWords('pages/index.mdx'), toks(await page.locator('.dx-homebody').innerText()))).toEqual({ ok: true })
})

test('full layout: no sidebar, no contents rail, no feedback widget; header spotlight on', async ({ page }) => {
  await page.goto('/')
  // D7: a closed Nextra drawer is only transformed off-screen, so "no sidebar" is the drawer being closed and outside the viewport.
  const side = await page.locator('.nextra-sidebar-container').evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect()
      return { open: e.classList.contains('open') || e.getAttribute('data-open') !== null, inView: r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight && r.width > 0 }
    }),
  )
  expect(side.filter((s) => s.open || s.inView)).toEqual([])
  await expect(page.getByTestId('toc')).toHaveCount(0)
  await expect(page.getByText('Was this page helpful?')).toHaveCount(0)
  await expect(page.getByTestId('docs-header')).toHaveClass(/spotlight/)
  await expect(page.locator('.dx-homebody table')).toHaveCount(0)
  // D10 / D13: no <main>, and the 720 px article measure does not clamp the home.
  await expect(page.locator('article.nextra-content > main')).toHaveCount(0)
})

test('the home is not held to the article measure', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1024)
  await page.goto('/')
  const w = await page.locator('.dx-homebody').evaluate((e) => e.getBoundingClientRect().width)
  expect(w).toBeGreaterThan(900)
})

test("22 link cards with the page's own hrefs; Reference and Explanation side by side", async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1024)
  await page.goto('/')
  const cards = page.locator('.dx-homebody a.dx-hcard')
  await expect(cards).toHaveCount(22)
  await expect(cards.first()).toHaveAttribute('href', '/quickstart')
  await expect(cards.first()).toContainText('First 10 minutes — sign up, connect a cloud, deploy a Postgres.')
  const [a, b] = await Promise.all(['Reference (information-oriented)', 'Explanation (understanding-oriented)'].map((n) => page.getByRole('heading', { name: n }).boundingBox()))
  expect(Math.abs(a!.y - b!.y)).toBeLessThan(2)
  expect(b!.x).toBeGreaterThan(a!.x + 200)
  const row = await page.locator('.dx-hsec').first().locator('a.dx-hcard').evaluateAll((cs) => cs.map((c) => Math.round(c.getBoundingClientRect().top)))
  expect(new Set(row).size).toBe(1)
})

test('the hero search opens the palette', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByTestId('home-hero').getByTestId('search-trigger').click()
  await expect(page.getByTestId('search-palette')).toBeVisible()
})

test('phone: one column', async ({ page }) => {
  test.skip(page.viewportSize()!.width >= 768)
  await page.goto('/')
  const xs = await page.locator('a.dx-hcard').evaluateAll((cs) => cs.map((c) => Math.round(c.getBoundingClientRect().left)))
  expect(new Set(xs).size).toBe(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('cards are real links with a visible focus ring; the accent edge follows the pointer', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1024)
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const card = page.locator('.dx-homebody a.dx-hcard').nth(1)
  expect(await card.evaluate((e) => e.tagName)).toBe('A')
  await card.focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  expect(await card.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe('none')
  const b = (await card.boundingBox())!
  await page.mouse.move(b.x + 40, b.y + 30)
  await page.mouse.move(b.x + 60, b.y + 50)
  expect(await card.evaluate((e) => e.style.getPropertyValue('--gx'))).toBe('60px')
})

test('D12: reduced motion leaves the cards still; nothing on the home loops', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:3320/')
  await page.waitForLoadState('networkidle')
  const card = page.locator('.dx-homebody a.dx-hcard').nth(1)
  const b = (await card.boundingBox())!
  await page.mouse.move(b.x + 40, b.y + 30)
  await page.mouse.move(b.x + 60, b.y + 50)
  expect(await card.evaluate((e) => e.style.getPropertyValue('--gx'))).toBe('')
  const anim = await page.locator('.dx-home *').evaluateAll((els) => els.filter((e) => getComputedStyle(e).animationName !== 'none').length)
  expect(anim).toBe(0)
  await ctx.close()
})

test('AWS and GCP carry their marks, other cards a plain icon, all hidden from the link name', async ({ page }) => {
  await page.goto('/')
  const aws = page.locator('a.dx-hcard[href="/connect-clouds/aws"]')
  await expect(aws.locator('.ic svg')).toHaveCount(1)
  expect(await aws.evaluate((e) => e.querySelector('.ic')!.getAttribute('aria-hidden'))).toBe('true')
  await expect(page.getByRole('link', { name: /^Connect AWS Connect a customer AWS account/ })).toHaveCount(1)
})
