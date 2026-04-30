import { test, expect } from "@playwright/test";

test.describe("Smoke", () =>{
    test("app loads with both tabs visible", async ({ page }) => {
        await page.goto("/");

        await expect(page.getByRole("heading", { level: 1, name: "Cash Allocator" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Invoices" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Needs Review" })).toBeVisible();
    });

    test("can switch between tabs", async ({ page }) => {
        await page.goto("/");

        await page.getByRole("button", { name: "Needs Review" }).click();
        await expect(page.getByRole("heading", { name: "Needs Review" })).toBeVisible();

        await page.getByRole("button", { name: "Invoices" }).click();
        await expect(page.getByRole("heading", { name: "Invoices" })).toBeVisible();
    });
});