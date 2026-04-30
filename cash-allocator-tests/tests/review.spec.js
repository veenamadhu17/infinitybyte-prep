import { test, expect } from "@playwright/test";
import { api } from "./fixtures/api.js";
import { InvoicesPage } from "./pages/InvoicesPage.js";
import { ReviewPage } from "./pages/ReviewPage.js";

test.describe("Review inbox", () => {
  let invoicesPage, reviewPage;

  test.beforeEach(async ({ page }) => {
    invoicesPage = new InvoicesPage(page);
    reviewPage   = new ReviewPage(page);
  });

  test("shows empty state when no fuzzy matches exist", async () => {
    await reviewPage.goto();
    
    const count = await reviewPage.cardCount();
    if (count === 0) {
      await expect(reviewPage.emptyState).toBeVisible();
    }
  });

  test("fuzzy match appears in the inbox with payer, invoice, and confidence", async () => {
    const invoiceId = api.uniqueId("INV");
    const paymentId = api.uniqueId("PAY");

    await api.createInvoice({
      invoice_id: invoiceId,
      customer:   "Globex Holdings",
      amount:     2750.50,
      due_date:   "2026-12-31",
    });

    await api.createPayment({
      payment_id:   paymentId,
      payer_name:   "Globex Holds",
      amount:       2750.50,
      reference:    "Invoice payment",
      payment_date: "2026-12-15",
    });

    await reviewPage.goto();
    const card = reviewPage.cardForPayment(paymentId);

    await expect(card).toBeVisible();
    await expect(card).toContainText("Globex Holdings");
    await expect(card).toContainText("Globex Holds");
    await expect(card).toContainText(invoiceId);
    await expect(card).toContainText(/confidence/i);
    await expect(card).toContainText(/\d{2}%/);
  });

  test("confirming a fuzzy match closes the invoice and removes the card", async () => {
    const invoiceId = api.uniqueId("INV");
    const paymentId = api.uniqueId("PAY");

    await api.createInvoice({
      invoice_id: invoiceId,
      customer:   "Acme Hold",
      amount:     800,
      due_date:   "2026-12-31",
    });
    await api.createPayment({
      payment_id:   paymentId,
      payer_name:   "ACME Holdings",     
      amount:       800,
      reference:    "",
      payment_date: "2026-12-15",
    });

    await reviewPage.goto();
    const card = reviewPage.cardForPayment(paymentId);
    await expect(card).toBeVisible();

    await reviewPage.confirm(paymentId);

    await expect(card).not.toBeVisible({ timeout: 5000 });

    const invoice = await api.getInvoice(invoiceId);
    expect(invoice.status).toBe("paid");
  });

  test("rejecting a fuzzy match removes the card but leaves the invoice open", async () => {
    const invoiceId = api.uniqueId("INV");
    const paymentId = api.uniqueId("PAY");

    await api.createInvoice({
      invoice_id: invoiceId,
      customer:   "Wayne Inc.",
      amount:     3200,
      due_date:   "2026-12-31",
    });
    await api.createPayment({
      payment_id:   paymentId,
      payer_name:   "Waynne Inc.",     
      amount:       3200,
      reference:    "",
      payment_date: "2026-12-15",
    });

    await reviewPage.goto();
    const card = reviewPage.cardForPayment(paymentId);

    const cardVisible = await card.isVisible().catch(() => false);
    if (!cardVisible) {
      test.fail(true, "Fuzzy match did not surface — fixture below 0.75 threshold?");
      return;
    }

    await reviewPage.reject(paymentId);
    await expect(card).not.toBeVisible({ timeout: 5000 });

    const invoice = await api.getInvoice(invoiceId);
    expect(invoice.status).toBe("open");
  });

  test("after confirming, invoice shows as Paid in the Invoices tab", async ({ page }) => {
    const invoiceId = api.uniqueId("INV");
    const paymentId = api.uniqueId("PAY");

    await api.createInvoice({
      invoice_id: invoiceId,
      customer:   "Initech BV",
      amount:     1100,
      due_date:   "2026-12-31",
    });
    await api.createPayment({
      payment_id:   paymentId,
      payer_name:   "Initecch B.V.",
      amount:       1100,
      reference:    "",
      payment_date: "2026-12-15",
    });

    await reviewPage.goto();
    await reviewPage.confirm(paymentId);
    await expect(reviewPage.cardForPayment(paymentId)).not.toBeVisible({ timeout: 5000 });

    await invoicesPage.goto();
    const row = invoicesPage.rowByInvoiceId(invoiceId);
    await expect(row).toBeVisible();
    await expect(row).toContainText(/paid/i);
  });
});