import { useEffect, useState } from "react";
import { invoices, payments } from "../api/client.js";
import { Money, ConfidenceBar, ReviewChip, Button } from "../components/Primitives.jsx";

// This tab shows all payments that require a review due to a fuzzy match, the invoices remain open until human intervention

export default function ReviewPage() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [toast, setToast] = useState(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await payments.list();

            const fuzzy = (res.items || []).filter(
                (p) => p.match_rule === "fuzzy_match" && p.matched_invoice_id
            );

            const enriched = await Promise.all(
                fuzzy.map(async (p) => {
                    try {
                        const inv = await invoices.get(p.matched_invoice_id);
                        return inv.status === "open" ? { payment: p, invoice: inv } : null;
                    } catch {
                        return null;
                    }
                })
            );

            setRows(enriched.filter(Boolean));
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function confirm(row) {
        setBusyId(row.payment.payment_id);
        try {
            await invoices.setStatus(row.invoice.invoice_id, "paid");
            setToast(`Confirmed: ${row.payment.payment_id} → ${row.invoice.invoice_id}`);
            setRows((rs) => rs.filter((r) => r.payment.payment_id !== row.payment.payment_id));
        } catch (e) {
            setError(e.message);
        } finally {
            setBusyId(null);
        }
    }

    async function reject(row) {
        setBusyId(row.payment.payment_id);
        try {
            await payments.unmatch(row.payment.payment_id);
            setToast(`Rejected: ${row.payment.payment_id} returned to unallocated queue`);
            setRows((rs) => rs.filter((r) => r.payment.payment_id !== row.payment.payment_id));
        } catch (e) {
            setError(e.message);
        } finally {
            setBusyId(null);
        }
    }

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(t);
    }, [toast]);

    return(
        <div>
            <header className="flex items-end justify-between border-b border-hair pb-4 mb-6">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Needs Review</h2>
                    <p className="text-sm text-graphite mt-1">
                        Fuzzy Matches awaiting confirmation.{" "}
                        <span className="tabular font-mono">{rows.length}</span> open.
                    </p>
                </div>
                <Button variant="secondary" onClick={load} disabled={loading}>
                    {loading ? "Refreshing..." : "Refresh"}
                </Button>
            </header>

            {error && (
                <div className="mb-4 px-3 py-2 bg-chip-cancelBg text-chip-cancelText text-sm">
                    {error}
                </div>
            )}

            {toast && (
                <div className="mb-4 px-3 py-2 bg-chip-paidBg text-chip-paidText text-sm">
                    {toast}
                </div>
            )}

            {loading && rows.length === 0 && (
                <div className="border border-hair px-4 py-12 text-center text-sm text-graphite">
                    Loading...
                </div>
            )}

            {!loading && rows.length === 0 && (
                <div className="border border-hair px-4 py-12 text-center">
                    <p className="text-sm text-graphite">No fuzzy matches awaiting review</p>
                    <p className="text-xs text-graphite/70 mt-2"> 
                        New fuzzy matches will appear here when payments arrive whose payer name does not exactly match a customer record.
                    </p>
                </div>
            )}

            <div className="space-y-3">
                {rows.map(({ payment, invoice }) => (
                 <article
                    key={payment.payment_id}
                    className="border border-hair p-5 grid grid-cols-12 gap-6 items-start"
                >

                    <div className="col-span-5">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs uppercase tracking-wider text-graphite">Payment Received</span>
                            <ReviewChip />
                        </div>
                        <div className="font-mono tabular text-xs text-graphite mb-1">{payment.payment_id}</div>
                        <div className="text-base font-medium">{payment.payer_name}</div>
                        <div className="mt-2"><Money value={payment.amount} className="text-lg" /></div>
                        {payment.reference && (
                            <div className="mt-1 text-xs text-graphite italic">"{payment.reference}"</div>
                        )}
                    </div>

                    <div className="col-span-2 flex flex-col items-center justify-center pt-6">
                        <div className="text-graphite text-xl mb-3">→</div>
                        <ConfidenceBar value={payment.confidence ?? 0} />
                        <div className="mt-1 text-[10px] uppercase tracking-wider text-graphite">confidence</div>
                    </div>

                    <div className="col-span-5">
                        <div className="text-xs uppercase tracking-wider text-graphite mb-2">
                            Proposed invoice
                        </div>
                        <div className="font-mono tabular text-xs text-graphite mb-1">{invoice.invoice_id}</div>
                        <div className="text-base font-medium">{invoice.customer}</div>
                        <div className="mt-2"><Money value={invoice.amount} className="text-lg" /></div>
                        <div className="mt-1 text-xs text-graphite font-mono tabular">due {invoice.due_date}</div>
                    </div>

                    <div className="col-span-12 flex items-center justify-end gap-2 pt-3 border-t border-hair">
                        <Button
                            variant="danger"
                            disabled={busyId === payment.payment_id}
                            onClick={() => reject({ payment, invoice })}
                        >
                            Reject
                        </Button>
                        <Button
                            variant="primary"
                            disabled={busyId === payment.payment_id}
                            onClick={() => confirm({ payment, invoice })}
                        >
                            {busyId === payment.payment_id ? "Working..." : "Confirm match"}
                        </Button>
                    </div>
                </article>   
                ))}
            </div>
        </div>
    );
}