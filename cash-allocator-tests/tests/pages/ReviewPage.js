export class ReviewPage {
    constructor(page) {
        this.page = page;

        this.tab = page.getByRole("button" , { name: "Needs Review" });
        this.heading = page.getByRole("heading", { name: "Needs Review" });
        this.refreshBtn = page.getByRole("button", { name: /refresh/i });
        this.emptyState = page.getByText("No fuzzy matches awaiting review");

        this.cards = page.locator("article");
    }

    async goto() {
        await this.page.goto("/");
        await this.tab.click();
        await this.heading.waitFor();
        // Wait for the initial data load to complete before the caller inspects cards
        await this.page.getByRole("button", { name: "Refresh" }).waitFor({ timeout: 10000 });
    }

    async refresh() {
        await this.refreshBtn.click();
    }

    async cardCount() {
        return await this.cards.count();
    }

    cardForPayment(paymentId) {
        return this.cards.filter({ hasText: paymentId });
    }

    async confirm(paymentId) {
        const card = this.cardForPayment(paymentId);
        await card.getByRole("button", { name: /confirm match/i }).click();
    }

    async reject(paymentId) {
        const card = this.cardForPayment(paymentId);
        await card.getByRole("button", { name: /reject/i }).click();
    }

    async expectToast(text) {
        await this.page.getByText(text).waitFor({ state: "visible", timeout: 5000 });
    }
}