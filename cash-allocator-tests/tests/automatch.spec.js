import { test, expect } from "@playwright/test";
import { api } from "./fixtures/api.js";
import { InvoicesPage } from "./pages/InvoicesPage.js";
import { ReviewPage } from "./pages/ReviewPage.js";

test.describe("Auto-matching", () => {
    test("reference match auto-closes the invoice without review", async ({ page }) => {
        const invoiceId = api.uniqueId("INV");
        const paymentId = api.uniqueId("PAY");

        await api.createInvoice({
            invoice_id: invoiceId,
            customer: "Acme Corp",
            amount: 1500,
            due_date: "2026-12-31"
        });

        await api.createPayment({
            payment_id: paymentId,
            payer_name: "Acme Corp",
            amount: 1500,
            reference: invoiceId,
            payment_date: "2026-12-15",
        });

        const invoice = await api.getInvoice(invoiceId);
        expect(invoice.status).toBe("paid");

        const reviewPage = new ReviewPage(page);
        await reviewPage.goto();
        await expect(reviewPage.cardForPayment(paymentId)).not.toBeVisible();
    });

    test("exact name + amount match auto-closes the invoice", async ({ page }) => {
        const invoiceId = api.uniqueId("INV");
        const paymentId = api.uniqueId("PAY");

        await api.createInvoice({
            invoice_id: invoiceId,
            customer: "Umbrella Corp",
            amount: 675.25,
            due_date: "2026-12-31",
        });

        await api.createPayment({
            payment_id: paymentId,
            payer_name: "Umbrella Corporation",
            amount: 675.25,
            reference: "",
            payment_date: "2026-12-15",
        });

        const invoice = await api.getInvoice(invoiceId);
        expect(invoice.status).toBe("paid");

        const reviewPage = new ReviewPage(page);
        await reviewPage.goto();
        await expect(reviewPage.cardForPayment(paymentId)).not.toBeVisible();
    });

    test("unmatched payment leaves invoice open and does not appear in review", async ({ page }) => {
        const invoiceId = api.uniqueId("INV");
        const paymentId = api.uniqueId("PAY");

        await api.createInvoice({
            invoice_id: invoiceId,
            customer: "Stark Industries",
            amount: 12500,
            due_date: "2026-12-31"
        });

        await api.createPayment({
            payment_id: paymentId,
            payer_name: "Random Mystery Payer",
            amount: 9999.99,
            reference: "Unknown",
            payment_date: "2026-12-15",
        });

        const invoice = await api.getInvoice(invoiceId);
        expect(invoice.status).toBe("open");

        const reviewPage = new ReviewPage(page);
        await reviewPage.goto();
        await expect(reviewPage.cardForPayment(paymentId)).not.toBeVisible();
    });
});