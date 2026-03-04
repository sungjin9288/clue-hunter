import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  retries: isCI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    testIdAttribute: "data-testid",
    screenshot: "only-on-failure",
    video: "off",
    trace: "retain-on-failure"
  },
  projects: isCI
    ? [
      {
        name: "mobile-chromium",
        use: {
          ...devices["Pixel 7"]
        }
      },
      {
        name: "mobile-webkit",
        use: {
          ...devices["iPhone 13"],
          browserName: "webkit"
        }
      }
    ]
    : [
      {
        name: "mobile-chrome",
        use: {
          ...devices["Pixel 7"],
          channel: "chrome"
        }
      }
    ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    port: 4173,
    reuseExistingServer: !isCI,
    timeout: 120_000
  }
});
