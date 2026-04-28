const BASE = import.meta.env.VITE_API_BASE || "/api";
const API_KEY = import.meta.env.VITE_API_KEY || "dev-key-change-me";

async function request(path, { method = "GET", body } = {}) {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": API_KEY,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
        const err = new Error(data?.message || data?.error ||`Request failed: ${res.status}`);
        err.status = res.status;
        err.body = data;
        throw err;
    }
    return data;
}

export const invoices = {
    list: ({ status, customer, limit = 50, offset = 0 } = {}) => {
        const q = new URLSearchParams();
        if (status) q.set("status", status);
        if (customer) q.set("customer", customer);
        q.set("limit", limit);
        q.set("offset", offset);
        return request(`/invoices?${q}`);
    },
    get: (id) => request(`/invoices/${encodeURIComponent(id)}`),
    create: (payload) => request(`/invoices`, { method: "POST", body: payload }),
    setStatus: (id, status) => 
        request(`/invoices/${encodeURIComponent(id)}/status`, {
            method: "PATCH",
            body: { status },
        }),
};

export const payments = {
    list: () => request("/payments"),
    create: (payload) => request("/payments", { method: "POST", body: payload }),
    unmatch: (id) => request(`/payments/${encodeURIComponent(id)}/unmatch`, { method: "POST" }), 
};