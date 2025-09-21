import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://localhost:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "pnpm next dev -p 3001",
    url: "http://localhost:3001",
    reuseExistingServer: true,
    timeout: 120_000,
    env: { NODE_ENV: "test", E2E_BYPASS_AUTH: "1" },
  },
  projects: [
    { 
      name: "chromium", 
      use: { ...devices["Desktop Chrome"] },
      testMatch: /simple\.spec\.ts|api-simple\.spec\.ts/
    },
  ],
});