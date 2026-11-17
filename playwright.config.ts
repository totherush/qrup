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
    baseURL: 'http://qrup.test:3000',
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
    command: 'bun run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
