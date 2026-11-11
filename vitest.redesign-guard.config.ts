import { defineConfig } from 'vitest/config'
import { REDESIGN_GUARD } from './vitest.config'

/** `pnpm test:redesign-guard`: run before merging feat/docs-v2; delete this file, the script, the test and
 *  tests/fixtures/mdx-manifest.json after the merge. */
export default defineConfig({
  test: {
    environment: 'node',
    include: [REDESIGN_GUARD],
  },
})
