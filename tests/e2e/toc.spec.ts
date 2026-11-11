import { expect, test } from '@playwright/test'

test('the rail is 232 px, lists the headings and marks the one in view', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1280)
  await page.goto('/connect-clouds/aws')
  const toc = page.getByTestId('toc')
  expect(Math.round((await toc.boundingBox())!.width)).toBe(232)
  await expect(toc.getByText('On this page')).toBeVisible()
  await page.locator('#verify').scrollIntoViewIfNeeded()
  await page.mouse.wheel(0, 400)
  await expect(toc.locator('a[aria-current="location"]')).toHaveCount(1)
  expect(
    await toc.locator('a.on').evaluate((e) => getComputedStyle(e, '::before').backgroundColor),
  ).toBe('rgb(245, 179, 1)')
  await expect(toc.getByRole('link', { name: 'Edit this page' })).toHaveAttribute(
    'href',
    /blob\/main\/pages\/connect-clouds\/aws\.mdx$/,
  )
})

test('the rail text is the heading text, depth 2 and 3 only, and the segment does not animate', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1280)
  await page.goto('/connect-clouds/aws')
  const toc = page.getByTestId('toc')
  const rail = await toc.locator('ol a').allInnerTexts()
  const heads = await page.locator('article.nextra-content :is(h2, h3)').allInnerTexts()
  expect(rail.map((t) => t.trim())).toEqual(heads.map((t) => t.trim()))
  expect(await toc.locator('ol li.l3').count()).toBeGreaterThan(0)
  await page.locator('#verify').scrollIntoViewIfNeeded()
  await page.mouse.wheel(0, 400)
  const dur = await toc.locator('a.on').evaluate((e) => getComputedStyle(e, '::before').transitionDuration)
  expect(dur).toBe('0s')
})

// Review Focus 5
for (const hash of ['step-2--create-the-iam-role-in-your-aws-account', 'verify'])
  test(`a link to #${hash} lands below the header`, async ({ page }) => {
    await page.goto('/connect-clouds/aws#' + hash)
    await page.waitForTimeout(500)
    const top = await page.locator('#' + hash).evaluate((e) => e.getBoundingClientRect().top)
    expect(top).toBeGreaterThanOrEqual(56)
    expect(top).toBeLessThan(200)
  })

test('phone: "On this page" opens above the first section', async ({ page }) => {
  test.skip(page.viewportSize()!.width >= 768)
  await page.goto('/quickstart')
  const s = page.locator('details.dx-mtoc > summary')
  await expect(s).toBeVisible()
  // The article node is replaced once just after load, so the check and the click retry together.
  await expect(async () => {
    expect((await s.boundingBox())!.y).toBeLessThan((await page.locator('article h2').first().boundingBox())!.y)
    if (!(await page.locator('details.dx-mtoc').evaluate((d: HTMLDetailsElement) => d.open))) await s.click()
    await expect(page.locator('details.dx-mtoc').getByRole('link', { name: /Step 1/ })).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 10_000 })
})
