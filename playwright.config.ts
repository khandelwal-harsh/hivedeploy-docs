import { defineConfig } from '@playwright/test'

const baseURL = 'http://127.0.0.1:3320'

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL, channel: 'chrome' },
  projects: [
    { name: 'desktop', use: { channel: 'chrome', viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { channel: 'chrome', viewport: { width: 390, height: 844 } } },
  ],
  webServer: { command: 'pnpm e2e:serve', url: baseURL, reuseExistingServer: true, timeout: 300_000 },
})
