const API_BASE = process.env.API_BASE || "http://localhost:3000";
const API_KEY = process.env.API_KEY || "dev-key-change-me";

const headers = {
    "Content-Type": "application/json",
    "X-API-KEY": API_KEY,
};

async function  request(path, opts = {}) {
    const res = await fetch(`${API_BASE}${path}`, { headers, ...opts });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
        throw new Error(`API ${opts.method || "GET"} ${path} failed: ${res.status} ${text}`);
    }
    return data;
}

export const api = {
    async createInvoice(invoice) {
        return request("/invoices", {
            method: "POST",
            body: JSON.stringify(invoice),
        });
    },
    async listInvoices(params = {}) {
        const q = new URLSearchParams(params);
        return request(`/invoice?${q}`);
    },
    async getInvoice(id) {
        return request(`/invoices/${encodeURIComponent(id)}`);
    },

    async createPayment(payment) {
        return request("/payments", {
            method: "POST",
            body: JSON.stringify(payment),
        });
    },
    async listPayments() {
        return request("/payments");
    },

    async resetIfNeeded() {
        try {
            const { items = [] } = await this.listInvoices({ limit: 100 });
            return items.length
        } catch {
            return 0;
        }
    },

    uniqueId(prefix) {
        return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    },
};