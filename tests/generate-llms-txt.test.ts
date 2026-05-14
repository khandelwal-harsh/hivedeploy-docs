import { describe, it, expect } from 'vitest'
import { flattenMdx, pagePathToUrl, renderLlmsTxt } from '../scripts/generate-llms-txt'

describe('flattenMdx', () => {
  it('converts <Callout type="warning"> to blockquote', () => {
    const input = '<Callout type="warning">Watch out</Callout>'
    expect(flattenMdx(input)).toContain('> **Warning:** Watch out')
  })

  it('converts <Callout type="info"> to blockquote with Note prefix', () => {
    const input = '<Callout type="info">Heads up</Callout>'
    expect(flattenMdx(input)).toContain('> **Note:** Heads up')
  })

  it('converts <Callout type="error"> to blockquote with Error prefix', () => {
    const input = '<Callout type="error">Broken</Callout>'
    expect(flattenMdx(input)).toContain('> **Error:** Broken')
  })

  it('converts <Callout type="success"> to blockquote with Success prefix', () => {
    const input = '<Callout type="success">Done</Callout>'
    expect(flattenMdx(input)).toContain('> **Success:** Done')
  })

  it('omits FeedbackWidget', () => {
    expect(flattenMdx('<FeedbackWidget />')).not.toContain('FeedbackWidget')
  })

  it('replaces ScalarReference with a link', () => {
    expect(flattenMdx('<ScalarReference />')).toContain('/reference/api-reference')
  })

  it('preserves regular markdown', () => {
    const input = '# Title\n\nSome **bold** text.\n\n```bash\nls\n```'
    expect(flattenMdx(input)).toBe(input)
  })
})

describe('pagePathToUrl', () => {
  it('maps index.mdx to /', () => {
    expect(pagePathToUrl('pages/index.mdx')).toBe('/')
  })

  it('maps section/page.mdx to /section/page', () => {
    expect(pagePathToUrl('pages/concepts/gates.mdx')).toBe('/concepts/gates')
  })

  it('maps section/index.mdx to /section', () => {
    expect(pagePathToUrl('pages/changelog/index.mdx')).toBe('/changelog')
  })
})

describe('renderLlmsTxt', () => {
  it('renders the Anthropic-format index', () => {
    const pages = [
      { url: '/quickstart', title: 'Quickstart', description: 'Get your first deployment running in 10 minutes' },
      { url: '/concepts/gates', title: 'Gates', description: 'The 6-stage deployment flow' },
    ]
    const txt = renderLlmsTxt(pages)
    expect(txt).toContain('# hivedeploy')
    expect(txt).toContain('## Documentation')
    expect(txt).toContain('- [Quickstart](https://docs.hivedeploy.in/quickstart): Get your first deployment running in 10 minutes')
    expect(txt).toContain('- [Gates](https://docs.hivedeploy.in/concepts/gates): The 6-stage deployment flow')
  })
})
