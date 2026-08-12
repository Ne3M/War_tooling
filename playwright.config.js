import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 300000,
  name: 'chromium',
  use: {
    // channel: 'chromium', // full browser even in headless
    retries: process.env.CI ? 2 : 0,
    permissions: ['storage-access'],
    viewport: { width: 1280, height: 720 },
    // headless: false,
    launchOptions: {
      // args: ['--headless','--no-sandbox','--use-angle=gl']
      args: ['--headless','--no-sandbox','--use-angle=gl'],
    },
  },
});
