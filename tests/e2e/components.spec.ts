import { expect, test } from '@playwright/test'

test('callouts: a hairline box with a visible label; warning is orange with a triangle', async ({ page }) => {
  await page.goto('/connect-clouds/aws')
  const w = page.locator('[data-testid="callout"].warning').first()
  await expect(w.locator('.dx-callout-label')).toHaveText(/warning/i)
  await expect(w.locator('svg.tri')).toHaveCount(1)
  const s = await w.evaluate((e) => {
    const c = getComputedStyle(e)
    return [c.borderLeftWidth, c.borderTopWidth, c.borderLeftColor === c.borderTopColor]
  })
  expect(s).toEqual(['1px', '1px', true])
  expect(await w.locator('.dx-callout-label').evaluate((e) => getComputedStyle(e).color)).toBe('rgb(255, 138, 61)')
  const i = page.locator('[data-testid="callout"].info').first()
  await expect(i.locator('.dx-callout-label')).toHaveText(/note/i)
  await expect(i).toHaveAttribute('role', 'note')
})

test('steps: numbered 01… on the quickstart, none on a page without steps', async ({ page }) => {
  await page.goto('/quickstart')
  expect(await page.locator('.dx-step').evaluateAll((s) => s.map((e) => e.getAttribute('data-step')))).toEqual(['01', '02', '03', '04', '05', '06'])
  await expect(page.locator('.dx-step').first().locator('h2')).toHaveText('Step 1 — Sign up')
  await expect(page.locator('blockquote.dx-quote.agent').first()).toBeVisible()
  await page.goto('/guides/approvals')
  await expect(page.locator('.dx-step')).toHaveCount(0)
})

test('a plain blockquote is a note, not the agent', async ({ page }) => {
  await page.goto('/quickstart')
  const note = page.locator('blockquote.dx-quote:not(.agent)').first()
  await expect(note).toContainText('verification email')
})

// Review Focus 4
for (const width of [320, 390])
  test(`article tables scroll in their own box at ${width}`, async ({ browser }) => {
    const page = await (await browser.newContext({ viewport: { width, height: 760 } })).newPage()
    for (const path of ['/reference/env-vars', '/connect-clouds/aws', '/reference/agents-list']) {
      await page.goto(path)
      const boxes = page.locator('article .dx-table')
      expect(await boxes.count()).toBeGreaterThan(0)
      expect(await page.locator('article table').count()).toBe(await boxes.count())
      expect(await page.locator('article .dx-table .dx-table, article .dx-table .nextra-scrollbar').count()).toBe(0)
      for (const b of await boxes.all()) {
        await expect(b).toHaveAttribute('tabindex', '0')
        expect(await b.evaluate((e) => getComputedStyle(e).overflowX)).toBe('auto')
        expect((await b.boundingBox())!.width).toBeLessThanOrEqual(width)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
    }
    await page.close()
  })

test('table cells never use the faint text colour; headers are mono caps on the band', async ({ page }) => {
  await page.goto('/reference/env-vars')
  const r = await page.locator('article .dx-table').first().evaluate((b) => {
    const th = b.querySelector('th')!
    const cs = getComputedStyle(th)
    const colours = [...b.querySelectorAll('th, td, td *')].map((e) => getComputedStyle(e).color)
    return { tt: cs.textTransform, fs: cs.fontSize, bg: cs.backgroundColor, colours }
  })
  expect(r.tt).toBe('uppercase')
  expect(r.fs).toBe('11px')
  expect(r.bg).toBe('rgb(14, 14, 17)')
  expect(r.colours).not.toContain('rgb(130, 130, 127)')
})

test('D12: callouts, steps, quotes and tables carry no animation', async ({ page }) => {
  await page.goto('/quickstart')
  const r = await page.locator('.dx-step, .dx-callout, .dx-quote, .dx-table').evaluateAll((els) =>
    els.map((e) => [getComputedStyle(e).animationName, getComputedStyle(e).transitionDuration]),
  )
  expect(r.length).toBeGreaterThan(0)
  for (const [a, t] of r) {
    expect(a).toBe('none')
    expect(t).toMatch(/^0s(, 0s)*$/) // no transition is declared on them
  }
})

test('the focus ring on a code block is not clipped by the block', async ({ page }) => {
  await page.goto('/connect-clouds/aws')
  const pre = page.getByTestId('code-block').first().locator('pre')
  await pre.focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  await expect(pre).toBeFocused()
  const r = await pre.evaluate((e) => {
    const cs = getComputedStyle(e)
    const off = parseFloat(cs.outlineOffset)
    const w = parseFloat(cs.outlineWidth)
    const box = e.getBoundingClientRect()
    const clip = (e.parentElement as HTMLElement).getBoundingClientRect()
    return { style: cs.outlineStyle, w, top: box.top - off - w - clip.top, left: box.left - off - w - clip.left, right: clip.right - (box.right + off + w), bottom: clip.bottom - (box.bottom + off + w) }
  })
  expect(r.style).toBe('solid')
  expect(r.w).toBeGreaterThanOrEqual(2)
  // the ring's outer edge must sit inside the block's own box, which clips with overflow: hidden
  for (const side of [r.top, r.left, r.right, r.bottom]) expect(side).toBeGreaterThanOrEqual(-0.5)
})
