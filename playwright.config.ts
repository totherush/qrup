import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    // Phones open the app over plain HTTP on a LAN address, which is not a secure context,
    // so APIs such as crypto.randomUUID() are missing. A non-localhost host reproduces that.
    baseURL: 'http://qrup.test:3100',
    launchOptions: { args: ['--host-resolver-rules=MAP qrup.test 127.0.0.1'] },
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // QRUP_BINARY runs the suite against a compiled binary instead, such as `dist/qrup`.
    command: process.env.QRUP_BINARY ?? 'bun run start',
    url: 'http://localhost:3100',
    // A port and upload folder of its own, so a qrup you run on port 3000 and its uploads/ are never touched.
    env: { PORT: '3100', UPLOAD_FOLDER: 'tmp/e2e-uploads' },
    reuseExistingServer: !process.env.CI,
  },
});
