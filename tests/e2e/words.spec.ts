import { globSync } from 'glob'
import { expect, test } from '@playwright/test'
import { inOrder, mdxWords, toks, unpainted, wordDiff } from '../lib/words'

/** Every MDX page and the route the build serves it at (the sitemap is made from the same files; checked below). */
const PAGES = globSync('pages/**/*.mdx')
  .sort()
  .map((file) => ({ file, path: '/' + file.replace(/^pages\//, '').replace(/\.mdx$/, '').replace(/(^|\/)index$/, '') }))
  .map(({ file, path }) => ({ file, path: path.length > 1 ? path.replace(/\/$/, '') : '/' }))

/** What the redesign wraps around the words: the page head, the collapsed contents list, the page foot, code-block and
 *  callout labels, the changelog's visual date (the heading keeps the date for assistive tech) and the Scalar widget. */
const CHROME = ['.nextra-breadcrumb', '.dx-title', '.dx-meta', '.dx-mtoc', '.dx-pagefoot', '.dx-code-head', '.dx-callout-label', '.dx-cl-date', '.dx-scalar']
/** For the painted pass the visual date counts: it is where the eye reads the date the heading keeps clipped. */
const CHROME_PAINTED = CHROME.filter((s) => s !== '.dx-cl-date')

test('the sitemap lists exactly the MDX pages', async ({ request }) => {
  const xml = await (await request.get('/sitemap-0.xml')).text()
  const paths = [...xml.matchAll(/<loc>https:\/\/docs\.hivedeploy\.in([^<]*)<\/loc>/g)].map((m) => m[1] || '/').sort()
  expect(paths).toEqual(PAGES.map((p) => p.path).sort())
  expect(paths).toHaveLength(39)
})

for (const { file, path } of PAGES)
  test(`every word of ${file}, once each, painted: ${path}`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const { all, painted } = await page.evaluate(
      ({ chrome, chromePainted }) => {
        const root = (document.querySelector('.dx-homebody') ?? document.querySelector('article.nextra-content')) as HTMLElement
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
        const texts: Text[] = []
        for (let n = walker.nextNode(); n; n = walker.nextNode()) if ((n as Text).data.trim()) texts.push(n as Text)
        const under = (t: Text, sels: string[]) => sels.some((s) => !!t.parentElement?.closest(s))
        const alpha = (c: string) => (/^rgba?\(/.test(c) ? Number(c.match(/[\d.]+/g)![3] ?? 1) : 1)
        // An element hides everything inside it when it is fully transparent, clipped, or a clipping box of 1 px or less.
        const hides = new Map<Element, boolean>()
        const hidesAll = (a: Element) => {
          if (!hides.has(a)) {
            const s = getComputedStyle(a)
            const box = a.getBoundingClientRect()
            hides.set(a, Number(s.opacity) === 0 || s.clipPath !== 'none' || (!!s.clip && s.clip !== 'auto') || (s.overflowX !== 'visible' && s.overflowY !== 'visible' && (box.width <= 1 || box.height <= 1)))
          }
          return hides.get(a)!
        }
        // A text node is painted when its glyphs can be seen: not transparent, not zero-size, not clipped away.
        const seen = (t: Text) => {
          const el = t.parentElement!
          const cs = getComputedStyle(el)
          if (cs.visibility !== 'visible' || alpha(cs.color) === 0 || alpha(cs.webkitTextFillColor) === 0) return false
          const r = document.createRange()
          r.selectNodeContents(t)
          const rects = [...r.getClientRects()].filter((b) => b.width > 1 && b.height > 1)
          if (!rects.length || rects.every((b) => b.right + scrollX <= 0 || b.bottom + scrollY <= 0)) return false
          for (let a: Element | null = el; a; a = a.parentElement) if (hidesAll(a)) return false
          return true
        }
        const visible = new Map(texts.map((t) => [t, seen(t)]))
        // Read innerText (block breaks between words kept) with some text nodes blanked for the moment of the read.
        const read = (blank: (t: Text) => boolean) => {
          const saved: [Text, string][] = []
          for (const t of texts) if (blank(t)) saved.push([t, t.data])
          for (const [t] of saved) t.data = ''
          const out = root.innerText
          for (const [t, d] of saved) t.data = d
          return out
        }
        return {
          all: read((t) => under(t, chrome)),
          painted: read((t) => under(t, chromePainted) || !visible.get(t)),
        }
      },
      { chrome: CHROME, chromePainted: CHROME_PAINTED },
    )
    const src = mdxWords(file)
    const got = toks(all)
    expect(src.length, 'the source has words').toBeGreaterThan(50)
    // Soft, so one run reports every check that fails. Nothing dropped, nothing shown twice or added:
    expect.soft(wordDiff(src, got), 'multiset').toEqual({ missing: [], extra: [] })
    expect.soft(inOrder(src, got), 'order').toEqual({ ok: true })
    // no source word lives only in transparent, zero-size or clipped text
    expect.soft(unpainted(src, toks(painted)), 'painted').toEqual([])
  })
