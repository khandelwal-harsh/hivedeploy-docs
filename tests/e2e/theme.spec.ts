import { expect, test } from '@playwright/test'

// Review Focus 3
test('a remembered light theme and a light system still get the dark page', async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: 'light' })
  await ctx.addInitScript(() => localStorage.setItem('theme', 'light'))
  const page = await ctx.newPage()
  await page.goto('/connect-clouds/aws')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('html')).not.toHaveClass(/light/)
  for (const sel of ['body', '.nextra-sidebar-container', 'article'])
    expect(
      await page.locator(sel).first().evaluate((e) => {
        let n: Element | null = e
        while (n) {
          const b = getComputedStyle(n).backgroundColor
          if (b !== 'rgba(0, 0, 0, 0)') return b
          n = n.parentElement
        }
        return ''
      }),
      sel,
    ).toBe('rgb(8, 8, 10)')
  expect(await page.locator('article p').first().evaluate((e) => getComputedStyle(e).color)).toBe('rgb(214, 214, 210)')
  await expect(page.getByRole('button', { name: /theme|dark|light|system/i })).toHaveCount(0)
  await ctx.close()
})

test('Geist is self-hosted; the CSP names no font host; nothing is blocked', async ({ page }) => {
  const hosts = new Set<string>()
  const blocked: string[] = []
  page.on('request', (r) => hosts.add(new URL(r.url()).host))
  page.on('console', (m) => {
    if (/Content Security Policy/.test(m.text())) blocked.push(m.text())
  })
  const res = await page.goto('/quickstart')
  await page.evaluate(() => document.fonts.ready)
  expect([...hosts].filter((h) => h !== '127.0.0.1:3320')).toEqual([])
  expect(blocked).toEqual([])
  const csp = res!.headers()['content-security-policy']
  expect(csp).toContain("font-src 'self'")
  expect(csp).not.toMatch(/fonts\.g/)
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/Geist/i)
  expect(await page.locator('article code').first().evaluate((e) => getComputedStyle(e).fontFamily)).toMatch(/Geist.*Mono/i)
})
