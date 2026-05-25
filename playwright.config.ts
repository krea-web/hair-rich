import { defineConfig, devices } from "@playwright/test";

// Hair Rich · Playwright E2E config.
//
// Run locally:
//   npm install                      # picks up @playwright/test from devDeps
//   npm run test:e2e:install         # downloads Chromium browser
//   npm run dev                      # in a separate terminal
//   npm run test:e2e
//
// Run in CI: see .github/workflows/e2e.yml
//
// Tests live in `tests/e2e/`. Three critical-flow specs ship by default:
// booking-flow.spec, profile-auth.spec, admin-auth.spec.

const PORT = 4321;

export default defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? "github" : "list",

    use: {
        baseURL: process.env.BASE_URL ?? `http://localhost:${PORT}`,
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },

    projects: [
        {
            name: "chromium-desktop",
            use: { ...devices["Desktop Chrome"] },
        },
        {
            name: "mobile-safari",
            use: { ...devices["iPhone 14"] },
        },
    ],

    webServer: process.env.BASE_URL
        ? undefined
        : {
              command: "npm run dev",
              url: `http://localhost:${PORT}`,
              reuseExistingServer: !process.env.CI,
              timeout: 120_000,
          },
});
