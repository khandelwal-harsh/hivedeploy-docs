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

test('a default article title sits 18 px under its breadcrumb, at DC1’s height (116)', async ({ page }) => {
  for (const path of ['/quickstart', '/connect-clouds/aws', '/changelog']) {
    await page.goto(path)
    const r = await page.evaluate(() => ({
      crumb: document.querySelector('.nextra-breadcrumb')!.getBoundingClientRect(),
      title: document.querySelector('.dx-title')!.getBoundingClientRect().top,
    }))
    // the breadcrumb's own 18 px margin is the only space between them
    expect(Math.round(r.title - r.crumb.bottom), path).toBe(18)
    // header 56 + the article's 24 + an 18 px breadcrumb line + 18
    if (r.crumb.height < 20) expect(Math.round(r.title), path).toBe(116)
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
  const h2 = await page.locator('article h2').first().evaluate((e) => {
    const c = getComputedStyle(e)
    return [c.fontSize, c.color, c.scrollMarginTop]
  })
  expect(h2).toEqual(['26px', 'rgb(245, 245, 242)', '24px'])
  const h3 = await page.locator('article h3').first().evaluate((e) => [getComputedStyle(e).fontSize, getComputedStyle(e).scrollMarginTop])
  expect(h3).toEqual(['19px', '24px'])
  const link = await page.locator('article p a').first().evaluate((e) => {
    const c = getComputedStyle(e)
    return [c.color, c.textUnderlineOffset]
  })
  expect(link).toEqual(['rgb(247, 194, 68)', '3px'])
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

test('previous / next tell assistive tech which way they go, and each name holds its visible text (WCAG 2.5.3)', async ({ page }) => {
  await page.goto('/connect-clouds/aws')
  await page.waitForLoadState('networkidle')
  const pn = page.locator('.dx-pn')
  const check = async () => {
    const links = await pn.locator('a').evaluateAll((as) => as.map((a) => a.textContent!.trim()))
    expect(links).toHaveLength(2)
    await expect(pn.getByRole('link', { name: `Previous: ${links[0]}`, exact: true })).toHaveCount(1)
    await expect(pn.getByRole('link', { name: `Next: ${links[1]}`, exact: true })).toHaveCount(1)
  }
  await check()
  // after a client-side move the names follow the new page
  const href = (await pn.locator('a').last().getAttribute('href'))!
  await pn.locator('a').last().click()
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  await expect(async () => check()).toPass()
})

test('a page with one neighbour gets one card, named for its direction', async ({ page }) => {
  // the last page has only a previous card; Nextra tells the two apart only by the class that pushes "next" right
  await page.goto('/changelog')
  await page.waitForLoadState('networkidle')
  const cards = page.locator('.dx-pn a')
  await expect(cards).toHaveCount(1)
  const title = (await cards.textContent())!.trim()
  await expect(page.locator('.dx-pn').getByRole('link', { name: `Previous: ${title}`, exact: true })).toHaveCount(1)
})

test('article pages log no warnings or errors', async ({ page }) => {
  const logged: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'warning' || m.type() === 'error') logged.push(`${m.type()}: ${m.text()}`)
  })
  page.on('pageerror', (e) => logged.push(`pageerror: ${e.message}`))
  // Vercel serves the analytics script on its own hosts only; locally it 404s, so stand in for the host.
  await page.route('**/_vercel/insights/script.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }))
  for (const path of ['/quickstart', '/connect-clouds/aws', '/reference/env-vars']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  }
  expect(logged).toEqual([])
})
