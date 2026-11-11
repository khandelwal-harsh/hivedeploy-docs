import { statSync } from 'node:fs'
import { expect, test } from '@playwright/test'

test('the shell measures: 272 sidebar, 720 article, body 16/1.7 in #D6D6D2', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1280)
  await page.goto('/connect-clouds/aws')
  expect(Math.round((await page.locator('.nextra-sidebar-container').boundingBox())!.width)).toBe(272)
  const p = page.locator('article p').first()
  expect((await p.boundingBox())!.width).toBeLessThanOrEqual(720)
  expect(
    await p.evaluate((e) => {
      const c = getComputedStyle(e)
      return [c.fontSize, Math.round((parseFloat(c.lineHeight) / parseFloat(c.fontSize)) * 10) / 10, c.color]
    }),
  ).toEqual(['16px', 1.7, 'rgb(214, 214, 210)'])
})

test('the sidebar starts under the header and fills to the bottom of the screen', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 768)
  await page.goto('/connect-clouds/aws')
  const side = await page.locator('.nextra-sidebar-container').evaluate((e) => {
    const r = e.getBoundingClientRect()
    return { top: r.top, bottom: r.bottom, vh: window.innerHeight }
  })
  expect(side.top).toBe(56)
  expect(side.bottom).toBe(side.vh)
})

test('only default-layout articles are clamped to 720; the home and the API page are not', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1280)
  await page.goto('/connect-clouds/aws')
  expect(await page.locator('article.nextra-content > main').evaluate((e) => e.getBoundingClientRect().width)).toBeLessThanOrEqual(720)
  for (const path of ['/', '/reference/api-reference']) {
    await page.goto(path)
    expect(await page.locator('article.nextra-content').evaluate((e) => e.getBoundingClientRect().width), path).toBeGreaterThan(900)
  }
})

test('each page has one h1, its frontmatter title, then the badge', async ({ page }) => {
  for (const [path, title, kind] of [
    ['/connect-clouds/aws', 'Connect an AWS account', 'How-to'],
    ['/quickstart', 'Quickstart', 'Tutorial'],
    ['/concepts/gates', 'Gates — the deployment flow', 'Explanation'],
  ] as const) {
    await page.goto(path)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toHaveText(title)
    await expect(page.locator('.dx-meta')).toContainText(kind)
  }
})

test('a page shows when it was last updated', async ({ page }) => {
  // Nextra 3.3.1 reads the git date from `repository.path()/..`, which is wrong in a linked worktree (`.git` is a file),
  // so no page has a timestamp there. The date check runs wherever `.git` is a directory.
  test.skip(statSync('.git').isFile(), 'linked worktree: Nextra finds no git timestamps')
  await page.goto('/quickstart')
  await expect(page.locator('.dx-meta time')).toBeVisible()
})

test('the open page is a glass pill with no accent', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 768)
  await page.goto('/connect-clouds/aws')
  const a = page.locator('.nextra-sidebar-container a[aria-current="page"]')
  const s = await a.evaluate((e) => {
    const c = getComputedStyle(e)
    return [c.color, c.borderLeftColor, c.backgroundColor]
  })
  expect(s[0]).toBe('rgb(245, 245, 242)')
  for (const v of s) expect(v).not.toMatch(/245, 179, 1|247, 194, 68/)
})

test('sidebar chrome is Geist, and only the group labels are mono uppercase', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 768)
  await page.goto('/connect-clouds/aws')
  const link = await page.locator('.nextra-sidebar-container a[aria-current="page"]').evaluate((e) => getComputedStyle(e).fontFamily)
  expect(link).not.toMatch(/mono/i)
  const folder = await page.locator('.nextra-sidebar-container li > button').first().evaluate((e) => {
    const c = getComputedStyle(e)
    return [c.fontFamily, c.textTransform, c.fontSize]
  })
  expect(folder[0]).toMatch(/mono/i)
  expect(folder[1]).toBe('uppercase')
  expect(folder[2]).toBe('11px')
})

test('no faint text inside an article', async ({ page }) => {
  await page.goto('/connect-clouds/aws')
  expect(
    await page.locator('article *').evaluateAll(
      (els) =>
        els.filter(
          (e) => e.childElementCount === 0 && e.textContent!.trim() && getComputedStyle(e).color === 'rgb(130, 130, 127)' && !e.closest('pre'),
        ).length,
    ),
  ).toBe(0)
})

test('article headings, links and inline code follow the brief', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 768)
  await page.goto('/connect-clouds/aws')
  // The article node is replaced once just after load, so read through a poll, not a single evaluate.
  const read = (sel: string, props: string[]) =>
    page.evaluate(([s, ps]) => {
      const e = document.querySelector(s!)
      if (!e || !e.isConnected) return []
      const c = getComputedStyle(e)
      return (ps as string[]).map((p) => c.getPropertyValue(p))
    }, [sel, props] as const)
  await expect.poll(() => read('article h2', ['font-size', 'color', 'scroll-margin-top'])).toEqual(['26px', 'rgb(245, 245, 242)', '80px'])
  await expect.poll(() => read('article h3', ['font-size', 'scroll-margin-top'])).toEqual(['19px', '80px'])
  await expect.poll(() => read('article p a', ['color', 'text-underline-offset'])).toEqual(['rgb(247, 194, 68)', '3px'])
})

test('feedback widget and previous/next are at the foot', async ({ page }) => {
  await page.goto('/connect-clouds/aws')
  await expect(page.getByText('Was this page helpful?')).toBeVisible()
  await expect(page.getByRole('link', { name: /GCP/ }).last()).toBeVisible()
  const order = await page.evaluate(() => {
    const fb = document.querySelector('.dx-fb')!
    const pn = document.querySelector('.dx-pn')!
    return !!(fb.compareDocumentPosition(pn) & Node.DOCUMENT_POSITION_FOLLOWING)
  })
  expect(order).toBe(true)
})

test('the pagination the redesign adds stays on the site', async ({ page }) => {
  await page.goto('/connect-clouds/aws')
  for (const href of await page.locator('.dx-pn a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!))) expect(href.startsWith('/'), href).toBe(true)
})
