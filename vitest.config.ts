import { configDefaults, defineConfig } from 'vitest/config'

/** The redesign's content guard (every MDX page and build script pinned to base 95cfb46) is not a lasting rule: it
 *  would fail every real content edit after the merge. It runs only as `pnpm test:redesign-guard`
 *  (vitest.redesign-guard.config.ts), never in `pnpm test` or CI. */
export const REDESIGN_GUARD = 'tests/mdx-untouched.test.ts'

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: [...configDefaults.exclude, REDESIGN_GUARD],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
})
