export class InvoicesPage {
    constructor(page) {
        this.page = page;

        this.tab = page.getByRole("button", { name: "Invoices" });

        this.searchBox = page.getByPlaceholder("Search Customer...");
        this.statusFilter = page.locator("select").first();

        this.heading = page.getByRole("heading", { name: "Invoices" });
        this.totalText = page.locator("text=/\d+ total/");

        this.table = page.getByRole("table");
        this.rows = this.table.locator("tbody tr");
    }

    async goto() {
        await this.page.goto("/");
        await this.tab.click();
        await this.heading.waitFor();
    }

    async filterByStatus(status) {
        await this.statusFilter.selectOption(status);
    }

    async searchCustomer(text) {
        await this.searchBox.fill(text);
        await this.searchBox.press("Enter");
    }

    async rowCount() {
        return await this.rows.filter({ hasNot: this.page.getByText(/loading | no invoices/i) }).count();
    }

    rowByInvoiceId(invoiceId) {
        return this.rows.filter({ hasText: invoiceId });
    }
}