import { Router } from "express";
import db from "./db.js";
import { CreateInvoice, UpdateInvoiceStatus, ListInvoicesQuery } from "./schemas.js"; 

const router = Router();

// POST - invoice creation
router.post("/", (req, res) => {
    const parsed = CreateInvoice.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'validation_failed', details: parsed.error.issues });
    }

    const inv = parsed.data;
    try {
        db.prepare(`
            INSERT INTO invoices (invoice_id, customer, amount, due_date)
            VALUES (?, ?, ?, ?)
        `).run(inv.invoice_id, inv.customer, inv.amount, inv.due_date);
    } catch (e) {
        if (String(e.message).includes('UNIQUE')) {
            return res.status(409).json({ error: 'conflict', message: 'Invoice ${inv.invoice_id} already exists' });
        }
        throw e;
    }

    const created = db.prepare('SELECT * FROM invoices WHERE invoice_id = ?').get(inv.invoice_id);
    res.status(201).json(created);
});

// GET - get open invoices 
router.get("/", (req, res) => {
    const parsed = ListInvoicesQuery.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ error: 'validation_failed', details: parsed.error.issues });
    }

    const { status, customer, limit, offset } = parsed.data;

    const conditions = [];
    const params = {};
    if (status) {
        conditions.push('status = @status');
        params.status = status;
    }
    if (customer) {
        conditions.push('customer LIKE @customer');
        params.customer = `%${customer}`;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = db.prepare(`SELECT COUNT(*) AS c FROM invoices ${where}`).get(params).c;

    const rows = db.prepare(`
        SELECT * FROM invoices ${where}
        ORDER BY created_at DESC
        LIMIT @limit OFFSET @offset
    `).all({ ...params, limit, offset});

    res.json({ total, limit, offset, items: rows });
});

// GET - get invoice by id
router.get('/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM invoices WHERE invoice_id = ?').get(req.params.id);
    if (!row) {
        return res.status(404).json({ error: 'not_found' });
    }
    res.json(row);
});

// PATCH - update invoice status
router.patch('/:id/status', (req, res) => {
    const parsed = UpdateInvoiceStatus.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'validation_failed', message: parsed.error.issues });
    }

    const result = db.prepare(`
        UPDATE invoices SET status = ? WHERE invoice_id = ?    
    `).run(parsed.data.status, req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'not_found' });
    }
    res.json(db.prepare('SELECT * FROM invoices WHERE invoice_id = ?').get(req.params.id));
});

export default router;