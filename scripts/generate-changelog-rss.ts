import fs from 'node:fs/promises'
import path from 'node:path'

interface Entry {
  date: string
  title: string
  body: string
}

export function parseChangelog(mdx: string): Entry[] {
  const stripped = mdx.replace(/^---\n[\s\S]*?\n---\n/, '')
  const sections = stripped.split(/\n## /).slice(1)
  const entries: Entry[] = []
  for (const section of sections) {
    const match = section.match(/^(\d{4}-\d{2}-\d{2})\s*—\s*(.+?)\n/)
    if (!match) continue
    const [, date, title] = match
    if (!date || !title) continue
    const body = section
      .slice(match[0].length)
      .split(/\n---\n/)[0]
      ?.trim() ?? ''
    entries.push({ date, title, body })
  }
  return entries
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    const map: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    }
    return map[c]!
  })
}

export function renderRss(entries: Entry[]): string {
  const items = entries
    .map(
      (e) => `
    <item>
      <title>${escapeXml(e.title)}</title>
      <link>https://docs.hivedeploy.in/changelog#${e.date}</link>
      <guid isPermaLink="false">hivedeploy-changelog-${e.date}</guid>
      <pubDate>${new Date(e.date).toUTCString()}</pubDate>
      <description><![CDATA[${e.body}]]></description>
    </item>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Hivedeploy Changelog</title>
    <link>https://docs.hivedeploy.in/changelog</link>
    <description>Notable changes to the Hivedeploy platform.</description>
    <language>en-us</language>${items}
  </channel>
</rss>
`
}

async function main() {
  const cwd = process.cwd()
  const mdxPath = path.join(cwd, 'pages', 'changelog', 'index.mdx')

  let mdx: string
  try {
    mdx = await fs.readFile(mdxPath, 'utf8')
  } catch {
    console.log('[generate-changelog-rss] no changelog/index.mdx yet — skipping')
    return
  }

  const entries = parseChangelog(mdx)
  const rss = renderRss(entries)
  const outPath = path.join(cwd, 'public', 'changelog.xml')
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, rss)
  console.log(`[generate-changelog-rss] wrote ${outPath} (${entries.length} entries)`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
