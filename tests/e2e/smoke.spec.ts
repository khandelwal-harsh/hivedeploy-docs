import { test, expect } from '@playwright/test'

test('a production build serves the quickstart and the files the build scripts write', async ({ page, request }) => {
  await page.goto('/quickstart'); await expect(page.getByRole('heading', { name: /^What you.ll build/ })).toBeVisible()
  for (const p of ['/llms.txt', '/llms-full.txt', '/quickstart.md', '/changelog.xml', '/sitemap.xml', '/sitemap-0.xml', '/robots.txt', '/openapi.json'])
    expect((await request.get(p)).status(), p).toBe(200)
  expect(await (await request.get('/changelog.xml')).text()).toContain('<rss')
  expect(await (await request.get('/llms.txt')).text()).toContain('/quickstart')
})
