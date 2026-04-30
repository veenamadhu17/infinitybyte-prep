import { test, expect } from "@playwright/test";
import { api } from "./fixtures/api.js";
import { InvoicesPage } from "./pages/InvoicesPage.js";

test.describe("Invoices list", () => {
    let invoicesPage;
    let invoiceId;

    test.beforeEach(async ({ page }) => {
        invoicesPage = new InvoicesPage(page);
        invoiceId = api.uniqueId("INV");
        await api.createInvoice({
            invoice_id: invoiceId,
            customer: "Test Customer Ltd",
            amount: 1234.56,
            due_date: "2026-12-31",
        });
    });

    test("newly created invoices appear in the list", async () => {
        await invoicesPage.goto();
        await expect(invoicesPage.rowByInvoiceId(invoiceId)).toBeVisible();
    });

    test("invoice row shows customer, amount and Open status", async () => {
        await invoicesPage.goto();
        const row = invoicesPage.rowByInvoiceId(invoiceId);

        await expect(row).toContainText("Test Customer Ltd");
        await expect(row).toContainText("1,234.56");
        await expect(row).toContainText(/open/i);
    });

    test("status filter narrows results to matching invoices", async () => {
        const paidId = api.uniqueId("INV");
        await api.createInvoice({
            invoice_id: paidId,
            customer: "Paid Customer",
            amount: 999.99,
            due_date: "2026-12-31",
        });

        await fetch(`http://localhost:3000/invoices/${paidId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "X-API-Key": "dev-key-change-me" },
            body: JSON.stringify({ status: "paid" }),
        });

        await invoicesPage.goto();
        await invoicesPage.filterByStatus("paid");

        await expect(invoicesPage.rowByInvoiceId(paidId)).toBeVisible();
        await expect(invoicesPage.rowByInvoiceId(invoiceId)).not.toBeVisible();
    });

    test("customer search filters rows in real time", async () => {
        const otherId = api.uniqueId("INV");
        await api.createInvoice({
            invoice_id: otherId,
            customer: "Globex Industries",
            amount: 500.00,
            due_date: "2026-12-31",
        });

        await invoicesPage.goto();
        await invoicesPage.searchCustomer("Globex");

        await expect(invoicesPage.rowByInvoiceId(otherId)).toBeVisible();
        await expect(invoicesPage.rowByInvoiceId(invoiceId)).not.toBeVisible();
    });
});