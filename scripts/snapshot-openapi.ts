import fs from 'node:fs/promises'
import path from 'node:path'

interface OpenAPIOperation {
  tags?: string[]
  [key: string]: unknown
}

interface OpenAPISpec {
  openapi?: string
  info?: unknown
  servers?: unknown
  components?: unknown
  paths?: Record<string, Record<string, OpenAPIOperation>>
  [key: string]: unknown
}

const HTTP_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'])

export function filterInternalTags(spec: OpenAPISpec): OpenAPISpec {
  const paths = spec.paths ?? {}
  const filtered: Record<string, Record<string, OpenAPIOperation>> = {}

  for (const [pathKey, methods] of Object.entries(paths)) {
    const filteredMethods: Record<string, OpenAPIOperation> = {}
    for (const [method, op] of Object.entries(methods)) {
      if (!HTTP_METHODS.has(method.toLowerCase())) {
        filteredMethods[method] = op
        continue
      }
      const tags = op.tags ?? []
      if (tags.includes('internal')) continue
      filteredMethods[method] = op
    }
    const hasHttpMethod = Object.keys(filteredMethods).some((m) => HTTP_METHODS.has(m.toLowerCase()))
    if (hasHttpMethod) {
      filtered[pathKey] = filteredMethods
    }
  }

  return { ...spec, paths: filtered }
}

async function main() {
  const url = process.env.OPENAPI_SOURCE_URL ?? 'https://backend.hivedeploy.in/openapi.json'
  console.log(`[snapshot-openapi] fetching ${url}`)

  let spec: OpenAPISpec
  if (url.startsWith('file://')) {
    // Node fetch doesn't support file:// — read directly. Useful for CI builds without network.
    const filePath = url.replace(/^file:\/\//, '')
    const raw = await fs.readFile(filePath, 'utf8')
    spec = JSON.parse(raw) as OpenAPISpec
  } else {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Failed to fetch OpenAPI spec from ${url}: ${res.status} ${res.statusText}`)
    }
    spec = (await res.json()) as OpenAPISpec
  }

  const filtered = filterInternalTags(spec)

  const outPath = path.join(process.cwd(), 'public', 'openapi.json')
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, JSON.stringify(filtered, null, 2))
  console.log(`[snapshot-openapi] wrote ${outPath} (${Object.keys(filtered.paths ?? {}).length} paths)`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
