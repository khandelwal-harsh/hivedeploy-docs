import { test, expect } from '@playwright/test'

const OWN_EXTERNAL = /^https:\/\/((www|docs|proof|app|backend)\.hivedeploy\.in|github\.com\/khandelwal-harsh\/hivedeploy-docs)(\/|#|\?|$)/
const OWN_MAIL = /^mailto:[^@\s]+@hivedeploy\.in$/

// Vendor and cloud-console hosts the MDX links to, one per line, with the page that uses it.
// These are matched by hostname only and are never fetched.
const ALLOWED_EXTERNAL: string[] = [
  'docs.aws.amazon.com', // /connect-clouds/aws (IAM confused-deputy guide)
  'learn.microsoft.com', // /connect-clouds/azure (OAuth client credentials, workload identity federation)
  'resend.com', // /guides/self-host (email provider)
  'www.cloudflare.com', // /guides/self-host (Turnstile product page)
  'console.cloud.google.com', // /troubleshooting/gcp-project-setup (billing console)
  'client.scalar.com', // /reference/api-reference (Scalar widget's own "open in client" button, not MDX)
  'www.scalar.com', // /reference/api-reference (Scalar widget's own footer link, not MDX)
]

// Links broken inside MDX. The MDX is pinned and not edited here, so each is asserted as still broken
// and reported to the owner. Format: `${page} -> ${href}`.
const KNOWN_BROKEN: string[] = [
  '/troubleshooting/gcp-project-setup -> /connect-clouds/gcp#enable-apis', // MDX line 201: the GCP page has no #enable-apis; the heading is "Step 0 — Enable required GCP APIs"
  '/troubleshooting/reading-audit-logs -> /cloud-403', // MDX lines 129 and 225: the page lives at /troubleshooting/cloud-403
]

const REGIONS = ['article.nextra-content', 'main', 'header', 'footer', '.nextra-sidebar-container']

interface Found { region: string; href: string }

test('every link on all 39 pages resolves', async ({ page, request, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'links are checked once, on desktop')
  test.setTimeout(300_000)
  const sitemap = await (await request.get('/sitemap-0.xml')).text()
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname)
  expect(paths).toHaveLength(39)

  const links = new Map<string, Found[]>()
  const ids = new Map<string, Set<string>>()
  for (const p of paths) {
    await page.goto(p, { waitUntil: 'load' })
    const got = await page.evaluate((regions) => {
      const out: { region: string; href: string }[] = []
      const seen = new Set<Element>()
      for (const r of regions)
        for (const a of document.querySelectorAll(`${r} a[href]`)) {
          if (seen.has(a)) continue
          seen.add(a)
          out.push({ region: r === 'article.nextra-content' ? 'main' : r, href: a.getAttribute('href')! })
        }
      return { out, ids: [...document.querySelectorAll('[id]')].map((e) => e.id) }
    }, REGIONS)
    links.set(p, got.out)
    ids.set(p, new Set(got.ids))
  }

  const status = new Map<string, number>()
  const failures: string[] = []
  const origin = new URL(baseURL!).origin
  for (const [p, found] of links) {
    for (const { region, href } of found) {
      const key = `${p} -> ${href}`
      if (href === '#') { if (region !== 'footer') failures.push(key); continue }
      if (OWN_MAIL.test(href)) continue
      const url = new URL(href, origin + p)
      if (url.protocol === 'mailto:') { failures.push(key); continue }
      if (url.origin !== origin) {
        if (!OWN_EXTERNAL.test(url.href) && !ALLOWED_EXTERNAL.includes(url.hostname)) failures.push(key)
        continue
      }
      const target = url.pathname
      if (!status.has(target)) status.set(target, (await request.get(target)).status())
      if (status.get(target) !== 200) { failures.push(key); continue }
      if (url.hash.length > 1) {
        const want = decodeURIComponent(url.hash.slice(1))
        if (!paths.includes(target)) { failures.push(key); continue }
        if (!ids.get(target)!.has(want)) failures.push(key)
      }
    }
  }
  expect([...new Set(failures)].sort()).toEqual([...KNOWN_BROKEN].sort())
})
