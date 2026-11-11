import { test, expect } from '@playwright/test'

test('header: 56 px, solid, every link where it should go', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1024)
  await page.goto('/connect-clouds/aws')
  const h = page.getByTestId('docs-header')
  expect((await h.boundingBox())!.height).toBe(56)
  expect(await h.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(8, 8, 10)')
  for (const [name, href] of [['HiveDeploy', 'https://www.hivedeploy.in'], ['Docs', '/'], ['API reference', '/reference/api-reference'], ['Changelog', '/changelog'],
    ['Proof', 'https://proof.hivedeploy.in'], ['Sign in', 'https://app.hivedeploy.in/login'], ['Get started', 'https://www.hivedeploy.in/#waitlist']] as const)
    await expect(h.getByRole('link', { name, exact: name === 'Docs' }).first()).toHaveAttribute('href', href)
  await expect(h.getByRole('link', { name: 'Documentation' })).toHaveAttribute('aria-current', 'page')
  await expect(h.getByRole('link', { name: /github/i })).toHaveCount(0)
})

test('the skip link is the first focusable element, and Enter moves into the content', async ({ page }) => {
  await page.goto('/quickstart')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
  await page.keyboard.press('Enter')
  expect(await page.evaluate(() => location.hash)).toBe('#reach-skip-nav')
  await page.keyboard.press('Tab')
  const where = await page.evaluate(() => {
    const a = document.activeElement as HTMLElement
    return { inHeader: !!a.closest('[data-testid="docs-header"]'), inContent: !!a.closest('main, article, .nextra-content') }
  })
  expect(where).toEqual({ inHeader: false, inContent: true })
})

test('tablet: Sign in stays visible and goes to the app', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 })
  await page.goto('/quickstart')
  const l = page.getByTestId('docs-header').getByRole('link', { name: 'Sign in' })
  await expect(l).toBeVisible()
  await expect(l).toHaveAttribute('href', 'https://app.hivedeploy.in/login')
})

test('footer wordmark: bg fill, 2 px stroke, stroke painted first', async ({ page }) => {
  await page.goto('/quickstart')
  const st = await page.locator('footer .wordmark').evaluate((e) => { const c = getComputedStyle(e); return { color: c.color, w: c.webkitTextStrokeWidth, sc: c.webkitTextStrokeColor, po: c.paintOrder } })
  expect(st.color).toBe('rgb(8, 8, 10)'); expect(st.w).toBe('2px'); expect(st.sc).toBe('rgba(255, 255, 255, 0.16)'); expect(st.po).toMatch(/^stroke/)
})

test('the sidebar lists Changelog by its title, then the two property links', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 768)
  await page.goto('/quickstart')
  const s = page.locator('.nextra-sidebar-container')
  await expect(s.getByText('Changelog', { exact: true }).first()).toBeVisible()
  await expect(s.getByText('changelog', { exact: true })).toHaveCount(0)
  await expect(s.getByRole('link', { name: 'Reliability ledger' })).toHaveAttribute('href', 'https://proof.hivedeploy.in')
  await expect(s.getByRole('link', { name: 'HiveDeploy' })).toHaveAttribute('href', 'https://www.hivedeploy.in')
})

test('the last page has no "next" that leaves the site', async ({ page }) => {
  await page.goto('/changelog')
  await expect(page.locator('main a[href^="https://proof"][title], main a[title="Reliability ledger"], main a[title="HiveDeploy"], main a[href="https://www.hivedeploy.in"]')).toHaveCount(0)
})

test("footer is www's", async ({ page }) => {
  await page.goto('/quickstart')
  const f = page.locator('footer')
  await expect(f).toContainText('Made for engineers who ship to production.')
  await expect(f.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', 'https://www.hivedeploy.in/#pricing')
  await expect(f.locator('.wordmark')).toHaveAttribute('aria-hidden', 'true')
})

test("phone: the menu button opens Nextra's drawer with the search trigger and the tree", async ({ page }) => {
  test.skip(page.viewportSize()!.width >= 768)
  await page.goto('/quickstart')
  const b = page.getByRole('button', { name: 'Open menu' })
  await b.click()
  await expect(b).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.nextra-sidebar-container').getByRole('link', { name: 'Postgres', exact: true })).toBeVisible()
  await expect(page.locator('.nextra-sidebar-container').getByTestId('search-trigger-menu')).toBeVisible()
})

test('chrome link colours survive the reset', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1024)
  await page.goto('/quickstart')
  const h = page.getByTestId('docs-header')
  const css = (l: ReturnType<typeof h.locator>, prop: 'color' | 'backgroundColor') => l.evaluate((e, p) => getComputedStyle(e)[p as 'color'], prop)
  expect(await css(h.locator('a.brand'), 'color')).toBe('rgb(245, 245, 242)')
  expect(await css(h.getByRole('link', { name: 'Sign in' }), 'color')).toBe('rgb(154, 154, 150)')
  const gs = h.getByRole('link', { name: 'Get started' })
  expect(await css(gs, 'color')).toBe('rgb(26, 18, 0)')
  expect(await css(gs, 'backgroundColor')).toBe('rgb(245, 179, 1)')
  expect(await css(page.locator('footer').getByRole('link', { name: 'Pricing' }), 'color')).toBe('rgb(154, 154, 150)')
})
