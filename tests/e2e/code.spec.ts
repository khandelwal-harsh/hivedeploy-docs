import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// D2: the block count comes from the source, never a magic number.
const SRC = readFileSync('pages/connect-clouds/aws.mdx', 'utf8')
const FENCES = (SRC.match(/^```/gm) ?? []).length / 2
const FIRST_BASH = /^```bash\n([\s\S]*?)\n```$/m.exec(SRC)![1]!

test('bash is a "terminal" card on #0B0B0E; unlabelled fences have no chip', async ({ page }) => {
  await page.goto('/connect-clouds/aws')
  const blocks = page.getByTestId('code-block')
  expect(FENCES).toBeGreaterThan(0)
  expect(await blocks.count()).toBe(FENCES)
  await expect(blocks.locator('.dx-code-head .chip', { hasText: 'terminal' }).first()).toBeVisible()
  // D3: a fence with no language is bare: no chip at all
  const bare = blocks.locator('.dx-code-head.bare')
  expect(await bare.count()).toBeGreaterThan(0)
  expect(await bare.first().locator('.chip').count()).toBe(0)
  expect(await bare.first().locator('..').locator('pre').getAttribute('data-language')).toBe('plaintext')
  expect(await blocks.first().locator('pre').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(11, 11, 14)')
  const hues = await blocks.locator('pre span').evaluateAll((s) => [...new Set(s.map((e) => getComputedStyle(e).color))])
  for (const h of hues)
    expect(['rgb(130, 130, 127)', 'rgb(227, 207, 166)', 'rgb(159, 195, 230)', 'rgb(201, 184, 236)', 'rgb(232, 185, 140)', 'rgb(214, 214, 210)']).toContain(h)
})

test('code text is byte-identical to the fence', async ({ page }) => {
  await page.goto('/connect-clouds/aws')
  const block = page.getByTestId('code-block').filter({ has: page.locator('.chip', { hasText: 'terminal' }) }).first()
  const text = await block.locator('pre code').evaluate((e) => e.textContent)
  expect(text!.replace(/\n$/, '')).toBe(FIRST_BASH)
})

test('highlighted lines and the Nextra chrome are neutralised', async ({ page }) => {
  await page.goto('/connect-clouds/aws')
  const pre = page.getByTestId('code-block').first().locator('pre')
  expect(await pre.evaluate((e) => getComputedStyle(e).boxShadow)).toBe('none')
  expect(await page.locator('.dx-code.nextra-code, .dx-code pre.nextra-focus').count()).toBe(0)
  expect(await page.locator('.dx-code > .nextra-code').count()).toBe(0)
})

test('copy puts the code on the clipboard and turns to a check for 1.2 s', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/connect-clouds/aws')
  const block = page.getByTestId('code-block').filter({ has: page.locator('.chip', { hasText: 'terminal' }) }).first()
  const btn = block.getByRole('button', { name: 'Copy code' })
  await btn.focus()
  await page.keyboard.press('Enter')
  await expect(btn).toHaveClass(/done/)
  await expect(btn).toBeFocused()
  await expect(block.locator('[aria-live]')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe((await block.locator('pre code').innerText()).replace(/\n$/, ''))
  await expect(btn).not.toHaveClass(/done/, { timeout: 2500 })
})

test('D12: the check swaps with no animation; hover only changes colour', async ({ page }) => {
  await page.goto('/connect-clouds/aws')
  const btn = page.getByTestId('code-block').first().getByRole('button', { name: 'Copy code' })
  const t = await btn.evaluate((e) => {
    const c = getComputedStyle(e)
    return { prop: c.transitionProperty, anim: c.animationName }
  })
  expect(t.anim).toBe('none')
  expect(t.prop).not.toMatch(/transform|opacity|all/)
  for (const svg of await btn.locator('svg').all()) expect(await svg.evaluate((e) => getComputedStyle(e).animationName)).toBe('none')
})

// Review Focus 2
for (const width of [320, 390])
  test(`long lines scroll inside the block at ${width}; the page does not`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 760 } })
    const page = await ctx.newPage()
    await page.goto('/connect-clouds/aws')
    const m = await page.getByTestId('code-block').evaluateAll((bs) =>
      bs.map((b) => {
        const pre = b.querySelector('pre')!
        const btn = b.querySelector('.dx-copy')
        const line = pre.querySelector('code > span') ?? pre
        return {
          wide: pre.scrollWidth > pre.clientWidth,
          ws: getComputedStyle(pre).whiteSpace,
          ox: getComputedStyle(pre).overflowX,
          tab: pre.tabIndex,
          clear: !btn || btn.getBoundingClientRect().bottom <= line.getBoundingClientRect().top + 1,
          right: b.getBoundingClientRect().right,
        }
      }),
    )
    expect(m.some((x) => x.wide)).toBe(true)
    for (const x of m) {
      expect(x.ws).toBe('pre')
      expect(x.ox).toBe('auto')
      expect(x.tab).toBe(0)
      expect(x.clear).toBe(true)
      expect(x.right).toBeLessThanOrEqual(width + 1)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
    await ctx.close()
  })

test('h5 and h6 are sized below h4 and keep the heading weight', async ({ page }) => {
  await page.goto('/connect-clouds/aws')
  const r = await page.evaluate(() => {
    const host = document.querySelector('.dx-body')!
    const out: Record<string, { size: number; weight: string }> = {}
    for (const t of ['h4', 'h5', 'h6']) {
      const e = document.createElement(t)
      e.textContent = 'x'
      host.appendChild(e)
      const c = getComputedStyle(e)
      out[t] = { size: parseFloat(c.fontSize), weight: c.fontWeight }
      e.remove()
    }
    return out
  })
  expect(r.h5!.size).toBeLessThan(r.h4!.size)
  expect(r.h6!.size).toBeLessThan(r.h5!.size)
  expect(r.h5!.weight).toBe('600')
  expect(r.h6!.weight).toBe('600')
})
