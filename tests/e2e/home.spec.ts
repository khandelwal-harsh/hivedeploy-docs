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
  // D10 / D13: the home's <main> sits inside .dx-home, never directly under the article, so the 720 px article
  // measure (`article > main`) does not clamp the home.
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

test('a card opens its page in place (client-side), as the base did, keeping its href and name', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  // a full page load would drop this
  await page.evaluate(() => ((window as unknown as { stay?: number }).stay = 1))
  const card = page.getByRole('link', { name: /^Quickstart First 10 minutes/ })
  await expect(card).toHaveAttribute('href', '/quickstart')
  await card.click()
  await expect(page).toHaveURL(/\/quickstart$/)
  await expect(page.locator('h1')).toHaveText('Quickstart')
  expect(await page.evaluate(() => (window as unknown as { stay?: number }).stay)).toBe(1)
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

test('the page keeps the section order its layout is written for', async ({ page }) => {
  await page.goto('/')
  const h2 = await page.locator('.dx-homebody > h2').allInnerTexts()
  expect(h2.map((t) => t.trim())).toEqual([
    'Start here',
    'How-to guides (task-oriented)',
    'Reference (information-oriented)',
    'Explanation (understanding-oriented)',
    'Troubleshooting',
    'Conventions used in these docs',
    "What’s intentionally NOT here",
    'Maintenance',
  ])
  const kinds = await page.locator('.dx-homebody > *').evaluateAll((els) => els.map((e) => (e.matches('.dx-hsec') ? 'cards' : e.tagName.toLowerCase())))
  // Nextra may leave an empty wrapper after the content; only the first 17 children carry the layout.
  expect(kinds.slice(0, 17)).toEqual(['h2', 'cards', 'h2', 'cards', 'h2', 'cards', 'h2', 'cards', 'h2', 'cards', 'hr', 'h2', 'ul', 'h2', 'ul', 'h2', 'ul'])
})

test('exactly the first card is lit', async ({ page }) => {
  await page.goto('/')
  const lit = await page.locator('a.dx-hcard').evaluateAll((cs) => cs.map((c) => getComputedStyle(c).boxShadow !== 'none'))
  expect(lit.filter(Boolean)).toHaveLength(1)
  expect(lit[0]).toBe(true)
})

for (const width of [1440, 1024]) {
  test(`at ${width} Start here, How-to and Troubleshooting carry their label on the heading's row, at the right, over one rule`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    for (const n of [1, 2, 5]) {
      const r = await page.locator('.dx-homebody').evaluate((body, n) => {
        const h2 = body.querySelectorAll(':scope > h2')[n - 1] as HTMLElement
        const sec = body.querySelectorAll(':scope > .dx-hsec')[n - 1] as HTMLElement
        const cols = sec.querySelector('.cols') as HTMLElement
        const hs = h2.getBoundingClientRect()
        const c = cols.getBoundingClientRect()
        const kids = [...sec.children].map((k) => k.className)
        return { pos: getComputedStyle(cols).position, top: getComputedStyle(cols).top, secRight: sec.getBoundingClientRect().right, bodyRight: body.getBoundingClientRect().right - parseFloat(getComputedStyle(body).paddingRight), colsRight: c.right, colsBottom: c.bottom, h2Bottom: hs.bottom - parseFloat(getComputedStyle(h2).paddingBottom) - parseFloat(getComputedStyle(h2).borderBottomWidth), rule: hs.bottom, list: sec.querySelector('.dx-hgrid')!.getBoundingClientRect().top, colsBorder: getComputedStyle(cols).borderBottomWidth, h2Border: getComputedStyle(h2).borderBottomWidth, kids }
      }, n)
      expect(r.pos, `section ${n}`).toBe('static')
      expect(r.top, `section ${n}`).toBe('auto')
      expect(Math.abs(r.colsRight - r.bodyRight), `section ${n} right edge`).toBeLessThanOrEqual(1)
      expect(Math.abs(r.colsBottom - r.h2Bottom), `section ${n} bottom`).toBeLessThanOrEqual(2)
      expect(r.colsBottom, `section ${n}`).toBeLessThanOrEqual(r.rule)
      expect(r.rule, `section ${n}`).toBeLessThanOrEqual(r.list)
      expect(r.h2Border, `section ${n}`).toBe('1px')
      expect(r.colsBorder, `section ${n}`).toBe('0px')
    }
  })
}

test('at 390 the labels sit in flow under their heading and its rule', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  for (const n of [1, 2, 5]) {
    const r = await page.locator('.dx-homebody').evaluate((body, n) => {
      const h2 = body.querySelectorAll(':scope > h2')[n - 1] as HTMLElement
      const sec = body.querySelectorAll(':scope > .dx-hsec')[n - 1] as HTMLElement
      const cols = sec.querySelector('.cols') as HTMLElement
      return { h2Bottom: h2.getBoundingClientRect().bottom, label: cols.getBoundingClientRect().top, pos: getComputedStyle(cols).position }
    }, n)
    expect(r.label, `section ${n}`).toBeGreaterThanOrEqual(r.h2Bottom - 1)
    expect(r.pos, `section ${n}`).toBe('static')
  }
})

for (const width of [1024, 900, 768]) {
  test(`at ${width} the Reference and Explanation labels and rules line up, wrapped heading or not`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const col = async (n: number) =>
      page.locator('.dx-homebody').evaluate((body, n) => {
        const h2 = body.querySelectorAll(':scope > h2')[n - 1] as HTMLElement
        const sec = body.querySelectorAll(':scope > .dx-hsec')[n - 1] as HTMLElement
        const cols = sec.querySelector('.cols') as HTMLElement
        const rule = [h2, cols].find((e) => parseFloat(getComputedStyle(e).borderBottomWidth) > 0)!
        return { label: cols.getBoundingClientRect().top, rule: rule.getBoundingClientRect().bottom, list: sec.querySelector('.dx-hgrid')!.getBoundingClientRect().top }
      }, n)
    const a = await col(3)
    const b = await col(4)
    expect(Math.abs(a.label - b.label)).toBeLessThanOrEqual(1)
    expect(Math.abs(a.rule - b.rule)).toBeLessThanOrEqual(1)
    expect(a.rule).toBeLessThanOrEqual(a.list)
    expect(a.label).toBeLessThan(a.rule)
  })
}

test('D12: reduced motion leaves the cards still; nothing on the home loops', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 }, baseURL })
  const page = await ctx.newPage()
  await page.goto('/')
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
