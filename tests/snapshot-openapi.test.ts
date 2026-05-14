import { describe, it, expect } from 'vitest'
import { filterInternalTags } from '../scripts/snapshot-openapi'

describe('filterInternalTags', () => {
  it('removes operations tagged "internal"', () => {
    const spec = {
      openapi: '3.0.0',
      paths: {
        '/api/public': {
          get: { tags: ['public'], summary: 'Public endpoint' },
        },
        '/api/private': {
          get: { tags: ['internal'], summary: 'Private endpoint' },
        },
      },
    }
    const result = filterInternalTags(spec)
    expect(result.paths!['/api/public']).toBeDefined()
    expect(result.paths!['/api/private']).toBeUndefined()
  })

  it('removes the entire path if all operations are internal', () => {
    const spec = {
      paths: {
        '/api/admin': {
          get: { tags: ['internal'] },
          post: { tags: ['internal'] },
        },
      },
    }
    const result = filterInternalTags(spec)
    expect(result.paths!['/api/admin']).toBeUndefined()
  })

  it('keeps the path when only some operations are internal', () => {
    const spec = {
      paths: {
        '/api/mixed': {
          get: { tags: ['public'] },
          delete: { tags: ['internal'] },
        },
      },
    }
    const result = filterInternalTags(spec)
    expect(result.paths!['/api/mixed']!.get).toBeDefined()
    expect(result.paths!['/api/mixed']!.delete).toBeUndefined()
  })

  it('preserves top-level fields like info, components, servers', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Hivedeploy API', version: '1.0' },
      servers: [{ url: 'https://backend.hivedeploy.in' }],
      paths: {},
    }
    const result = filterInternalTags(spec)
    expect(result.openapi).toBe('3.0.0')
    expect(result.info).toEqual({ title: 'Hivedeploy API', version: '1.0' })
    expect(result.servers).toEqual([{ url: 'https://backend.hivedeploy.in' }])
  })

  it('handles operations with no tags (treats as public)', () => {
    const spec = {
      paths: {
        '/api/untagged': {
          get: { summary: 'No tags' },
        },
      },
    }
    const result = filterInternalTags(spec)
    expect(result.paths!['/api/untagged']).toBeDefined()
  })
})
