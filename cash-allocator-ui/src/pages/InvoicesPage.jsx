import { use, useEffect, useState } from "react";
import { invoices } from "../api/client.js";
import { Money, StatusChip } from "../components/Primitives.jsx";

export default function InvoicesPage() {
    const [data, setData] = useState({ items: [], total: 0 });
    const [filters, setFilters] = useState({ status: "", customer: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    async function  load() {
        setLoading(true);
        setError(null);
        try {
            const res = await invoices.list({
                status: filters.status || undefined,
                customer: filters.customer || undefined,
                limit: 100,
            });
            setData(res);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, [filters.status]);

    return (
        <div>
            <header className="flex items-end justify-between border-b border-hair pb-4 mb-6">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Invoices</h2>
                    <p className="text-sm text-graphite mt-1">
                        <span className="tabular font-mono">{data.total}</span> total
                    </p>
                </div>
                <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search customer..."
                      value={filters.customer}
                      onChange={(e) => setFilters((f) => ({ ...f, customer: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && load()}
                      className="px-3 py-1.5 text-sm bg-paper border border-hair focus:outline-none focus:border-ink min-w-[16rem]" 
                    />
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                      className="px-3 py-1.5 text-sm bg-paper border border-hair focus:outline-none focus:border-ink"
                    >
                        <option value="">All statuses</option>
                        <option value="open">Open</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </header>

            {error && (
                <div className="mb-4 px-3 py-2 bg-chip-cancelBg text-chip-cancelText text-sm">
                    {error}
                </div>
            )}

            <div className="border border-hair">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-hair text-left text-xs uppercase tracking-wider text-graphite">
                            <th className="px-4 py-3 font-medium">Invoice</th>
                            <th className="px-4 py-3 font-medium">Customer</th>
                            <th className="px-4 py-3 font-medium text-right">Amount</th>
                            <th className="px-4 py-3 font-medium">Due</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-graphite">Loading...</td></tr>
                        )}
                        {!loading && data.items.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-graphite">
                                No invoices match these filters.
                            </td></tr>
                        )}
                        {data.items.map((i) => (
                            <tr key={i.invoice_id} className="border-b border-hair last:border-0 hover:bg-rule/30">
                                <td className="px-4 py-3 font-mono tabular text-sm">{i.invoice_id}</td>
                                <td className="px-4 py-3 text-sm">{i.customer}</td>
                                <td className="px-4 py-3 text-right"><Money value={i.amount} /></td>
                                <td className="px-4 py-3 font-mono tabular text-sm text-graphite">{i.due_date}</td>
                                <td className="px-4 py-3"><StatusChip status={i.status} /></td>
                            </tr>
                        ))} 
                    </tbody>
                </table>
            </div>
        </div>
    )
}