// rehype plugin for the article body: numbered "Step N —" sections, agent quotes, (Task 10) changelog.
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

/** Task 10 implements this. */
export function wrapChangelog(tree) {
  return tree
}

export function rehypeDocs() {
  return (tree, file) => {
    wrapSteps(tree)
    markQuotes(tree)
    wrapChangelog(tree, file)
  }
}
