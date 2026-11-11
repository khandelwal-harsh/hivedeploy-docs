// rehype plugin for the article body: numbered "Step N —" sections, agent quotes, (Task 10) changelog, table names.
// Nextra runs user rehype plugins before its own code-meta and pretty-code plugins, so `pre` is still raw here.
// Real MDX hast has whitespace-only text nodes between elements; they are never content.

const isWs = (n) => n.type === 'text' && /^\s*$/.test(n.value ?? '')
const isEl = (n, tag) => n.type === 'element' && n.tagName === tag
const textOf = (n) => (n.type === 'text' ? (n.value ?? '') : (n.children ?? []).map(textOf).join(''))
const STEP = /^Step (\d+) — /

/** Wrap each root-level `h2` "Step N — …" and the siblings up to the next root-level h2 or hr in `div.dx-step`. */
export function wrapSteps(tree) {
  const out = []
  const kids = tree.children
  for (let i = 0; i < kids.length; i++) {
    const n = kids[i]
    const m = isEl(n, 'h2') ? STEP.exec(textOf(n)) : null
    if (!m) {
      out.push(n)
      continue
    }
    const body = [n]
    let j = i + 1
    while (j < kids.length && !isEl(kids[j], 'h2') && !isEl(kids[j], 'hr')) body.push(kids[j++])
    const tail = []
    while (body.length > 1 && isWs(body[body.length - 1])) tail.unshift(body.pop())
    out.push({
      type: 'element',
      tagName: 'div',
      properties: { className: ['dx-step'], dataStep: String(Number(m[1])).padStart(2, '0') },
      children: body,
    })
    out.push(...tail)
    i = j - 1
  }
  tree.children = out
  return tree
}

function beginsWithEm(p) {
  const first = (p.children ?? []).find((c) => !isWs(c))
  return !!first && isEl(first, 'em')
}

/** A blockquote whose every paragraph begins with an `em` is the agent speaking; any other is a note. */
export function markQuotes(tree) {
  const walk = (n) => {
    if (isEl(n, 'blockquote')) {
      const paras = (n.children ?? []).filter((c) => isEl(c, 'p'))
      const agent = paras.length > 0 && paras.every(beginsWithEm)
      n.properties = { ...(n.properties ?? {}), className: agent ? ['dx-quote', 'agent'] : ['dx-quote'] }
    }
    for (const c of n.children ?? []) walk(c)
  }
  walk(tree)
  return tree
}

const ENTRY = /^(\d{4}-\d{2}-\d{2}(?: → \S+)?) — (.+)$/
const el = (tagName, properties, children) => ({ type: 'element', tagName, properties, children })

function entryOf(n) {
  return isEl(n, 'h2') ? ENTRY.exec(textOf(n)) : null
}

/** Only the changelog page: each dated `h2` and its siblings up to the next hr or h2 become `article.dx-cl-entry` with a sticky date column. */
export function wrapChangelog(tree, file) {
  const path = String(file?.path ?? '').replace(/\\/g, '/')
  if (!path.endsWith('pages/changelog/index.mdx')) return tree
  const out = []
  const kids = tree.children
  let first = true
  for (let i = 0; i < kids.length; i++) {
    const n = kids[i]
    const m = entryOf(n)
    if (isEl(n, 'hr')) {
      // the rules between entries (and the one under the intro) are replaced by each entry's own top border
      let k = i + 1
      while (k < kids.length && isWs(kids[k])) k++
      if (k < kids.length && entryOf(kids[k])) continue
    }
    if (!m) {
      out.push(n)
      continue
    }
    const body = []
    let j = i + 1
    while (j < kids.length && !isEl(kids[j], 'h2') && !isEl(kids[j], 'hr')) body.push(kids[j++])
    const tail = []
    while (body.length && isWs(body[body.length - 1])) tail.unshift(body.pop())
    for (const c of body) {
      const real = isEl(c, 'p') ? c.children.filter((x) => !isWs(x)) : []
      if (real.length === 1 && isEl(real[0], 'strong') && textOf(real[0]).length <= 40) {
        c.properties = { ...(c.properties ?? {}), className: ['dx-kind'] }
      }
    }
    // the heading keeps its whole text; the date and dash are read, not seen, because the date column shows them
    const lead = `${m[1]} — `
    const t0 = n.children[0]
    if (t0?.type === 'text' && t0.value.startsWith(lead)) {
      n.children = [el('span', { className: ['sr'] }, [{ type: 'text', value: lead }]), { type: 'text', value: t0.value.slice(lead.length) }, ...n.children.slice(1)]
    }
    out.push(
      el('article', { className: first ? ['dx-cl-entry', 'first'] : ['dx-cl-entry'] }, [
        el('div', { className: ['dx-cl-date'], ariaHidden: 'true' }, [{ type: 'text', value: m[1] }]),
        n,
        ...body,
      ]),
    )
    out.push(...tail)
    first = false
    i = j - 1
  }
  tree.children = out
  return tree
}

const HEADING = /^h[1-6]$/

/** Give each table the text of the nearest heading before it, in document order (`data-heading`): DocsTable names its scroll region from it. */
export function nameTables(tree) {
  let last = ''
  const walk = (n) => {
    if (n.type === 'element' && HEADING.test(n.tagName)) {
      last = textOf(n).replace(/\s+/g, ' ').trim()
      return
    }
    if (isEl(n, 'table') && last) n.properties = { ...(n.properties ?? {}), dataHeading: last }
    for (const c of n.children ?? []) walk(c)
  }
  walk(tree)
  return tree
}

export function rehypeDocs() {
  return (tree, file) => {
    nameTables(tree)
    wrapSteps(tree)
    markQuotes(tree)
    wrapChangelog(tree, file)
  }
}
