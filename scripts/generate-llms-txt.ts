import fs from 'node:fs/promises'
import path from 'node:path'
import { glob } from 'glob'
import matter from 'gray-matter'

interface PageInfo {
  url: string
  title: string
  description: string
  markdown?: string
  pageFile?: string
}

export function flattenMdx(body: string): string {
  let out = body

  out = out.replace(
    /<Callout\s+type="warning"[^>]*>([\s\S]*?)<\/Callout>/g,
    (_, inner: string) => `> **Warning:** ${inner.trim()}`,
  )
  out = out.replace(
    /<Callout\s+type="info"[^>]*>([\s\S]*?)<\/Callout>/g,
    (_, inner: string) => `> **Note:** ${inner.trim()}`,
  )
  out = out.replace(
    /<Callout\s+type="error"[^>]*>([\s\S]*?)<\/Callout>/g,
    (_, inner: string) => `> **Error:** ${inner.trim()}`,
  )
  out = out.replace(
    /<Callout\s+type="success"[^>]*>([\s\S]*?)<\/Callout>/g,
    (_, inner: string) => `> **Success:** ${inner.trim()}`,
  )
  out = out.replace(
    /<Callout(?!\s+type=)[^>]*>([\s\S]*?)<\/Callout>/g,
    (_, inner: string) => `> **Note:** ${inner.trim()}`,
  )

  out = out.replace(/<FeedbackWidget\s*\/?>/g, '')

  out = out.replace(
    /<ScalarReference\s*\/?>/g,
    '*(See [the interactive API reference](https://docs.hivedeploy.in/reference/api-reference).)*',
  )

  out = out.replace(/<DiataxisBadge[^/]*\/>/g, '')

  out = out.replace(/<([A-Z][A-Za-z0-9]*)([^>]*?)\/>/g, '<!-- omitted: <$1$2/> -->')

  return out
}

export function pagePathToUrl(pageFile: string): string {
  let url = pageFile.replace(/^pages\//, '').replace(/\.mdx?$/, '')
  if (url === 'index') return '/'
  if (url.endsWith('/index')) url = url.replace(/\/index$/, '')
  return '/' + url
}

export function renderLlmsTxt(pages: PageInfo[]): string {
  const lines: string[] = [
    '# hivedeploy',
    '',
    '> AI-orchestrated multi-cloud deployment. Domain-expert agents own the full lifecycle of each resource (Postgres, Kafka, frontend, etc.) — deploy, monitor, scale, tune.',
    '',
    '## Documentation',
    '',
  ]
  for (const p of pages) {
    if (p.url === '/changelog' || p.url === '/reference/api-reference') continue
    const desc = p.description ? `: ${p.description}` : ''
    lines.push(`- [${p.title}](https://docs.hivedeploy.in${p.url})${desc}`)
  }
  const changelog = pages.find((p) => p.url === '/changelog')
  const apiRef = pages.find((p) => p.url === '/reference/api-reference')
  if (changelog || apiRef) {
    lines.push('', '## Optional', '')
    if (changelog) {
      lines.push(
        `- [${changelog.title}](https://docs.hivedeploy.in${changelog.url}): ${changelog.description}`,
      )
    }
    if (apiRef) {
      lines.push(
        `- [${apiRef.title}](https://docs.hivedeploy.in${apiRef.url}): ${apiRef.description}`,
      )
    }
  }
  return lines.join('\n') + '\n'
}

function bySidebarOrder(metaIndex: Map<string, string[]>) {
  return (a: PageInfo, b: PageInfo) => {
    const aDir = path.dirname(a.pageFile ?? '')
    const bDir = path.dirname(b.pageFile ?? '')
    if (aDir === bDir) {
      const order = metaIndex.get(aDir) ?? []
      const aName = path.basename(a.pageFile ?? '', '.mdx')
      const bName = path.basename(b.pageFile ?? '', '.mdx')
      return order.indexOf(aName) - order.indexOf(bName)
    }
    return aDir.localeCompare(bDir)
  }
}

async function loadMetaIndex(pagesRoot: string): Promise<Map<string, string[]>> {
  const metaFiles = await glob('**/_meta.json', { cwd: pagesRoot })
  const index = new Map<string, string[]>()
  for (const mf of metaFiles) {
    const full = path.join(pagesRoot, mf)
    const raw = await fs.readFile(full, 'utf8')
    const parsed = JSON.parse(raw) as Record<string, string | object>
    const dir = path.dirname(path.join('pages', mf))
    index.set(dir, Object.keys(parsed))
  }
  return index
}

async function main() {
  const cwd = process.cwd()
  const pagesRoot = path.join(cwd, 'pages')
  const outDir = path.join(cwd, 'public')
  const pageFiles = await glob('pages/**/*.mdx', { cwd })

  const pages: PageInfo[] = []

  for (const pageFile of pageFiles) {
    if (pageFile.includes('/api/')) continue
    const raw = await fs.readFile(path.join(cwd, pageFile), 'utf8')
    const { data: frontmatter, content: body } = matter(raw)
    if (frontmatter['draft'] === true) continue

    const url = pagePathToUrl(pageFile)
    const flatMd = flattenMdx(body)

    const title =
      typeof frontmatter['title'] === 'string'
        ? frontmatter['title']
        : path.basename(pageFile, '.mdx')
    const description =
      typeof frontmatter['description'] === 'string' ? frontmatter['description'] : ''

    pages.push({
      url,
      title,
      description,
      markdown: flatMd,
      pageFile,
    })

    const mdOutPath = path.join(outDir, url === '/' ? 'index.md' : url + '.md')
    await fs.mkdir(path.dirname(mdOutPath), { recursive: true })
    await fs.writeFile(mdOutPath, flatMd)
  }

  const metaIndex = await loadMetaIndex(pagesRoot)
  pages.sort(bySidebarOrder(metaIndex))

  const llmsTxt = renderLlmsTxt(pages)
  await fs.writeFile(path.join(outDir, 'llms.txt'), llmsTxt)

  const full = pages.map((p) => p.markdown ?? '').join('\n\n---\n\n')
  await fs.writeFile(path.join(outDir, 'llms-full.txt'), full)

  console.log(`[generate-llms-txt] wrote ${pages.length} pages to public/`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
