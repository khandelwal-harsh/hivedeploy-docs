import { expect, test } from '@playwright/test'

test('Scalar renders in the tokens, dark, with no toggle of its own', async ({ page }) => {
  await page.goto('/reference/api-reference')
  const app = page.locator('.scalar-app').first()
  await expect(app).toBeVisible({ timeout: 20_000 })
  const v = await app.evaluate((e) => {
    const c = getComputedStyle(e)
    return ['--scalar-background-1', '--scalar-color-1', '--scalar-color-accent', '--scalar-border-color'].map((k) =>
      c.getPropertyValue(k).trim().toUpperCase(),
    )
  })
  expect(v[0]).toBe('#08080A')
  expect(v[1]).toBe('#F5F5F2')
  expect(v[2]).toBe('#F7C244')
  expect(await app.evaluate((e) => getComputedStyle(e).fontFamily)).toMatch(/Geist/i)
  await expect(page.getByRole('button', { name: /dark mode|light mode|toggle.*mode/i })).toHaveCount(0)
  // D21: our page head owns the single level-1 heading; Scalar's info title is exposed at level 2.
  await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText(/API reference/i)
  await expect(app.locator('h1')).toHaveAttribute('aria-level', '2')
  // Playwright's role engine ignores aria-level on a native <h1>, so read the browser's own accessibility tree.
  await expect(async () => {
    const cdp = await page.context().newCDPSession(page)
    const { nodes } = await cdp.send('Accessibility.getFullAXTree')
    await cdp.detach()
    const headings = nodes
      .filter((n) => n.role?.value === 'heading' && !n.ignored)
      .map((n) => ({ name: String(n.name?.value ?? ''), level: Number(n.properties?.find((p) => p.name === 'level')?.value.value) }))
    const h1s = headings.filter((h) => h.level === 1)
    expect(h1s).toHaveLength(1)
    expect(h1s[0]?.name).toMatch(/API reference/i)
    expect(headings).toContainEqual({ name: 'Placeholder', level: 2 })
  }).toPass()
  await expect(page.locator('article.nextra-content [data-testid="callout"].info')).toBeVisible()
  await expect(page.getByTestId('toc')).toHaveCount(0)
})

test('the page keeps the sidebar, gives Scalar the full width and does not scroll sideways', async ({ page }) => {
  await page.goto('/reference/api-reference')
  const app = page.locator('.scalar-app').first()
  await app.waitFor()
  if (page.viewportSize()!.width >= 768) await expect(page.locator('.nextra-sidebar-container')).toBeVisible()
  const [appW, artW] = await Promise.all([
    app.evaluate((e) => e.getBoundingClientRect().width),
    page.locator('article.nextra-content').evaluate((e) => e.getBoundingClientRect().width),
  ])
  if (page.viewportSize()!.width >= 1280) {
    // D13: full layout is not clamped to 720 px
    expect(appW).toBeGreaterThan(720)
    expect(artW).toBeGreaterThan(720)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
})

test('no request leaves the site', async ({ page }) => {
  const foreign: string[] = []
  page.on('request', (r) => {
    const u = new URL(r.url())
    if (!/^(127\.0\.0\.1|localhost)$/.test(u.hostname) && u.protocol.startsWith('http')) foreign.push(r.url())
  })
  await page.goto('/reference/api-reference')
  await page.locator('.scalar-app').first().waitFor()
  await page.waitForLoadState('networkidle')
  expect(foreign).toEqual([])
})

test('Scalar links take the prose link colour', async ({ page }) => {
  await page.goto('/reference/api-reference')
  const app = page.locator('.scalar-app').first()
  await app.waitFor()
  const prose = await page.locator('article.nextra-content p a').first().evaluate((e) => getComputedStyle(e).color)
  expect(prose).toBe('rgb(247, 194, 68)')
  await expect(app.getByRole('link', { name: /Download OpenAPI/i })).toHaveCSS('color', prose)
})

test('Scalar borders take --line, not the preflight grey', async ({ page }) => {
  await page.goto('/reference/api-reference')
  const app = page.locator('.scalar-app').first()
  await app.waitFor()
  const colours = await app.evaluate((e) => {
    const out: string[] = []
    e.querySelectorAll('*').forEach((el) => {
      const c = getComputedStyle(el)
      if (parseFloat(c.borderTopWidth) > 0 && c.borderTopStyle !== 'none' && c.borderTopColor !== 'rgba(0, 0, 0, 0)') out.push(c.borderTopColor)
    })
    return out
  })
  expect(colours.length).toBeGreaterThan(0)
  // --line is rgba(255,255,255,0.08); every visible border in Scalar must be that or a deliberate token
  expect(colours).not.toContain('rgb(229, 231, 235)')
  expect(colours.filter((c) => c === 'rgba(255, 255, 255, 0.08)').length).toBeGreaterThan(0)
})

test('the page head clears the header like /quickstart does', async ({ page }) => {
  const top = async (path: string, sel: string) => {
    await page.goto(path)
    const head = await page.locator(sel).first().evaluate((e) => e.getBoundingClientRect().top)
    const hdr = await page.getByTestId('docs-header').evaluate((e) => e.getBoundingClientRect().bottom)
    return { head, hdr }
  }
  const ref = await top('/reference/api-reference', '.dx-title')
  expect(ref.head).toBeGreaterThanOrEqual(ref.hdr + 20)
  await page.goto('/quickstart')
  const qs = await page.locator('.nextra-breadcrumb').first().evaluate((e) => e.getBoundingClientRect().top)
  expect(Math.abs(ref.head - qs)).toBeLessThanOrEqual(4 + 0)
})

test("the border reset does not flatten Scalar's coloured border utilities", async ({ page }) => {
  await page.goto('/reference/api-reference')
  const app = page.locator('.scalar-app').first()
  await app.waitFor()
  const r = await app.evaluate((e) => {
    const mk = (cls: string, css: string) => {
      const d = document.createElement('div')
      d.className = cls
      d.style.cssText = css
      e.appendChild(d)
      const c = getComputedStyle(d)
      const out = c.borderTopColor === '' ? '' : c.borderTopColor, color = c.color
      d.remove()
      return { out, color }
    }
    return {
      red: mk('border-1 border-red', ''),
      c3: mk('border-1 border-c-3', ''),
      wantRed: mk('', 'color: var(--scalar-color-red)').color,
      wantC3: mk('', 'color: var(--scalar-color-3)').color,
      line: mk('', 'color: var(--scalar-border-color)').color,
    }
  })
  expect(r.red.out).not.toBe(r.line)
  expect(r.c3.out).not.toBe(r.line)
  expect(r.red.out).toBe(r.wantRed)
  expect(r.c3.out).toBe(r.wantC3)
})
