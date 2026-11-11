import { test, expect } from '@playwright/test'

test('the build wrote every generated file, and llms.txt still lists 39 pages', async ({ request }) => {
  for (const p of ['/openapi.json', '/llms.txt', '/llms-full.txt', '/index.md', '/quickstart.md', '/reference/webhooks.md', '/changelog.xml', '/sitemap.xml', '/sitemap-0.xml', '/robots.txt'])
    expect((await request.get(p)).status(), p).toBe(200)
  expect((await (await request.get('/llms.txt')).text()).match(/^- \[/gm)!.length).toBe(39)
  expect((await (await request.get('/sitemap-0.xml')).text()).match(/<loc>/g)!.length).toBe(39)
  expect(await (await request.get('/quickstart.md')).text()).toContain('> **Note:** the orchestrator never holds long-lived')
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /api/')
})

test('social card and feedback routes still answer', async ({ request }) => {
  const og = await request.get('/api/og?title=Quickstart&section=quickstart')
  expect(og.status()).toBe(200)
  expect(og.headers()['content-type']).toContain('image/png')
  // Never send a valid feedback body: a server holding real credentials would post a real message.
  // pages/api/feedback.ts rejects both requests below before it reads the webhook variable or calls fetch:
  //   `if (req.method !== 'POST') return 405`   (GET)
  //   `if (!isValidBody(body)) return 400`      (POST, verdict is neither 'up' nor 'down')
  expect((await request.get('/api/feedback')).status()).toBe(405)
  expect((await request.post('/api/feedback', { data: { page: '/quickstart', verdict: 'invalid' } })).status()).toBe(400)
})
