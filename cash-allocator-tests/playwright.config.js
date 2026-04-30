import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./tests",
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [
        ["list"],
        ["html", { open: "never" }],
    ],

    use: {
        baseURL: "http://localhost:5173",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
        actionTimeout: 10_000,
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        }
    ],

    webServer: [
        {
            command: "npm --prefix ../invoice-api run dev",
            url: "http://localhost:3000/health",
            reuseExistingServer: !process.env.CI,
            timeout: 30_000,
        },
        {
            command: "npm --prefix ../cash-allocator-ui run dev",
            url: "http://localhost:5173",
            reuseExistingServer: !process.env.CI,
            timeout: 30_000,
        },
    ],
});