import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { PAGES } from '../lib/pages'

/** Tests that open their own context at a fixed width run once: the phone project would only repeat them. */
const once = () =>
  test.skip(
    test.info().project.name !== 'desktop',
    'sets its own viewport; the desktop run covers it',
  )

const PATHS = [
  ...PAGES.map((p) => p.path),
  '/reference/env-vars',
  '/troubleshooting/cloud-403',
  '/guides/self-host',
]

for (const path of PATHS)
  for (const width of [320, 390, 768, 1024, 1280, 1440])
    test(`no sideways scroll: ${path} at ${width}`, async ({ browser }) => {
      once()
      const ctx = await browser.newContext({ viewport: { width, height: 800 } })
      const page = await ctx.newPage()
      await page.goto(path)
      if (path.endsWith('api-reference')) await page.locator('.scalar-app').first().waitFor()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(0)
      await ctx.close()
    })

const box = async (page: Page, sel: string) => (await page.locator(sel).first().boundingBox())!

test('at 768 and up the sidebar is in the page; at 1280 and up the rail too', async ({
  browser,
}) => {
  once()
  for (const [width, side, rail] of [
    [767, false, false],
    [768, true, false],
    [1279, true, false],
    [1280, true, true],
  ] as const) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } })
    const page = await ctx.newPage()
    await page.goto('/connect-clouds/aws')
    await page.waitForLoadState('networkidle')
    const link = page.locator('.nextra-sidebar-container').getByRole('link', { name: 'Postgres' })
    if (side) {
      expect(await link.isVisible(), `${width}`).toBe(true)
      // the md+ sidebar fills from the header to the bottom; it no longer subtracts Nextra's unused mobile menu bar
      const pane = await box(page, '.nextra-sidebar-container .nextra-scrollbar')
      expect([pane.y, pane.y + pane.height], `${width}`).toEqual([56, 800])
    } else {
      // D7: a closed drawer is only moved off-screen, so read its closed state and its box, never isVisible()
      await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
        'aria-expanded',
        'false',
      )
      const b = await box(page, '.nextra-sidebar-container')
      expect(
        b.x + b.width <= 0 || b.y + b.height <= 0,
        `${width}: drawer box ${JSON.stringify(b)}`,
      ).toBe(true)
    }
    expect(await page.locator('aside.dx-toc').isVisible(), `${width}`).toBe(rail)
    // D14: below 1280 the collapsed list inside the article serves instead of the rail
    expect(await page.locator('details.dx-mtoc').isVisible(), `${width}`).toBe(!rail)
    await ctx.close()
  }
})

test('phone: the menu is a left drawer under the header (PD02) that opens with no slide, holds no focus stop while closed, and closes on Esc and on the scrim', async ({
  browser,
}) => {
  once()
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await page.goto('/quickstart')
  await page.waitForLoadState('networkidle')
  const menu = page.getByRole('button', { name: 'Open menu' })
  const drawer = page.locator('.nextra-sidebar-container')
  const inDrawer = () =>
    page.evaluate(() => !!document.activeElement?.closest('.nextra-sidebar-container'))
  // closed: off the left edge, and Tab passes it by
  const shut = await box(page, '.nextra-sidebar-container')
  expect(shut.x + shut.width).toBeLessThanOrEqual(0)
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press('Tab')
    expect(await inDrawer(), `Tab ${i}`).toBe(false)
  }
  // open: a panel at most 336 px wide from the left edge, from the header's foot to the bottom, the header above the scrim
  await menu.click()
  await expect(menu).toHaveAttribute('aria-expanded', 'true')
  const b = await box(page, '.nextra-sidebar-container')
  expect(b.x).toBe(0)
  expect(b.width).toBeGreaterThan(300)
  expect(b.width).toBeLessThanOrEqual(336)
  expect([b.y, b.y + b.height]).toEqual([56, 844])
  const look = await drawer.evaluate((e) => {
    const c = getComputedStyle(e)
    const scrim = e.previousElementSibling as HTMLElement
    const at = (x: number, y: number) => document.elementFromPoint(x, y)
    const mb = document.querySelector('.dx-hdr .menu-btn')!.getBoundingClientRect()
    return {
      bg: c.backgroundColor,
      edge: [c.borderRightWidth, c.borderRightColor],
      motion: [c.transitionDuration, c.animationName],
      scrim: getComputedStyle(scrim).backgroundColor,
      scrimMotion: getComputedStyle(scrim).transitionDuration,
      rightOfPanel: at(375, 500) === scrim,
      headerOnTop: !!at(mb.left + mb.width / 2, mb.top + mb.height / 2)?.closest('.menu-btn'),
    }
  })
  expect(look).toEqual({
    bg: 'rgb(8, 8, 10)',
    edge: ['1px', 'rgba(255, 255, 255, 0.16)'],
    motion: ['0s', 'none'],
    scrim: 'rgba(4, 4, 6, 0.6)',
    scrimMotion: '0s',
    rightOfPanel: true,
    headerOnTop: true,
  })
  await expect(menu.locator('svg.x')).toBeVisible()
  await expect(menu.locator('svg.bars')).toBeHidden()
  // the next Tab from the menu button enters the drawer
  await menu.focus()
  await page.keyboard.press('Tab')
  expect(await inDrawer()).toBe(true)
  // Esc closes it and focus returns to the menu button
  await page.keyboard.press('Escape')
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
  await expect(menu).toBeFocused()
  // the scrim closes it too
  await menu.click()
  await expect(menu).toHaveAttribute('aria-expanded', 'true')
  await page.mouse.click(375, 500)
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
  await ctx.close()
})

test('phone header: search and menu never squash; 44 px targets from 380 px, at least 24 px below', async ({
  browser,
}) => {
  once()
  for (const width of [320, 360, 375, 390, 414, 767]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } })
    const page = await ctx.newPage()
    await page.goto('/quickstart')
    const r = await page.evaluate(() => {
      const b = (s: string) => document.querySelector(s)!.getBoundingClientRect()
      const items = [
        '.dx-hdr .brand',
        '.dx-hdr .hdr-s',
        '.dx-hdr .nav-cta .btn.accent',
        '.dx-hdr .menu-btn',
      ].map(b)
      return {
        search: [b('.dx-hdr .hdr-s').width, b('.dx-hdr .hdr-s').height],
        menu: [b('.dx-hdr .menu-btn').width, b('.dx-hdr .menu-btn').height],
        apart: items.every((x, i) => i === 0 || x.left >= items[i - 1]!.right),
        right: b('.dx-hdr .menu-btn').right,
      }
    })
    const min = width >= 380 ? 44 : 24
    for (const [w, h] of [r.search, r.menu]) {
      expect(w, `${width}`).toBeGreaterThanOrEqual(min)
      expect(h, `${width}`).toBeGreaterThanOrEqual(min)
    }
    expect(r.apart, `${width}: header items overlap`).toBe(true)
    expect(r.right, `${width}`).toBeLessThanOrEqual(width - 12)
    await ctx.close()
  }
})

test('from 768 the article column keeps a gutter from the sidebar and from the rail or window edge', async ({
  browser,
}) => {
  once()
  for (const width of [768, 900, 1024, 1279, 1280, 1440]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } })
    const page = await ctx.newPage()
    for (const path of ['/connect-clouds/aws', '/changelog']) {
      await page.goto(path)
      const g = await page.evaluate(() => {
        const main = document
          .querySelector('article.nextra-content > main')!
          .getBoundingClientRect()
        const side = document.querySelector('.nextra-sidebar-container')!.getBoundingClientRect()
        const rail = document.querySelector('aside.dx-toc')
        const right =
          rail && rail.getBoundingClientRect().width > 0
            ? rail.getBoundingClientRect().left
            : document.documentElement.clientWidth
        return { left: main.left - side.right, right: right - main.right, w: main.width }
      })
      expect(g.left, `${path} at ${width}: ${JSON.stringify(g)}`).toBeGreaterThanOrEqual(24)
      expect(g.right, `${path} at ${width}: ${JSON.stringify(g)}`).toBeGreaterThanOrEqual(24)
    }
    await ctx.close()
  }
})
