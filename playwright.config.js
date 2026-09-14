// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const PORT = process.env.PORT || 4173;

/*
 * Real-browser layer, complementing (not replacing) the Jest/jsdom layer
 * in test/unit/. Exists specifically to cover what jsdom cannot (see
 * AGENTS.md's testing section and REFACTOR_NOTES.md's self-critique of the
 * Jest suite): real mouse drag-select, real select2 dropdown rendering,
 * and multi-instance-on-one-page scenarios.
 *
 * Chromium only for now (not the full cross-browser matrix) -- this is a
 * characterization layer for an internal refactor baseline, not a browser-
 * compatibility suite. Add firefox/webkit projects later if that changes.
 */
module.exports = defineConfig({
  testDir: './test/e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `node test/e2e/server.js`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) },
  },
});
