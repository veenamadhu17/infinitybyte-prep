import { Router } from "express";
import db from "./db.js"
import { CreatePayment } from "./schemas.js";
import { findMatch } from "./matcher.js";

const router = Router();

// POST - payment creation
router.post('/', (req, res) => {
    const parsed = CreatePayment.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'validation_failed', details: parsed.error.issues});
    }

    const pmt = parsed.data;

    const txn = db.transaction(() => {
        const existing = db.prepare('SELECT 1 FROM payments WHERE payment_id = ?').get(pmt.payment_id);
        if (existing) return { conflict: true };

        const openInvoices = db.prepare(`
            SELECT invoice_id, customer, amount, due_date, status
            FROM invoices WHERE status = 'open'    
        `).all();

        const result = findMatch(pmt, openInvoices);

        db.prepare(`
            INSERT INTO payments (payment_id, payer_name, amount, reference, payment_date, 
                                  matched_invoice_id, match_rule, confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)    
        `).run(
            pmt.payment_id, pmt.payer_name, pmt.amount, pmt.reference, pmt.payment_date,
            result?.invoice.invoice_id ?? null, 
            result?.rule ?? null,
            result?.confidence ?? null,
        );

        // High confidence payments automatically closes invoices, fuzzy matches
        // are recorded but invoice stays open until human confirms.
        if (result) {
            if (result.rule !== 'fuzzy_match') {
                db.prepare("UPDATE invoices SET status = 'paid' WHERE invoice_id = ?")
                    .run(result.invoice.invoice_id);
            }
        }

        return { result };
    });

    const outcome = txn();
    if (outcome.conflict) {
        return res.status(409).json({ error: 'conflict', message: `Payment ${pmt.payment_id} already exists` });
    }

    const stored = db.prepare('SELECT * FROM payments WHERE payment_id = ?').get(pmt.payment_id);

    res.status(201).json({
        payment: stored,
        match: outcome.result ? {
            rule: outcome.result.rule,
            confidence: Number(outcome.result.confidence.toFixed(3)),
            invoice_id: outcome.result.invoice.invoice_id,
            auto_closed: outcome.result.rule !== 'fuzzy_match',
            requires_review: outcome.result.rule === 'fuzzy_match',
        } : null,
    });
});

// GET - gets list of payments
router.get('/', (req, res) => {
    const rows = db.prepare(`
        SELECT * FROM payments ORDER BY created_at DESC LIMIT 100    
    `).all();
    res.json({ items: rows });
});

// POST - rejects a fuzzy match
router.post('/:id/unmatch', (req, res) => {
    const result = db.prepare(`
        UPDATE payments
        SET matched_invoice_id = NULL,
            match_rule         = NULL,
            confidence         = NULL
        WHERE payment_id = ?
    `).run(req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({ error: "not_found" });
    }

    const updated = db.prepare('SELECT * FROM payments WHERE payment_id = ?').get(req.params.id);
    res.json(updated);
});

export default router;