import Database from 'better-sqlite3';

const db = new Database('invoices.db');

db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
        invoice_id TEXT PRIMARY KEY,
        customer   TEXT NOT NULL,
        amount     REAL NOT NULL CHECK (amount > 0),
        due_date   TEXT NOT NULL,
        status     TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open', 'paid', 'cancelled')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    
    CREATE TABLE IF NOT EXISTS payments (
        payment_id   TEXT PRIMARY KEY,
        payer_name   TEXT NOT NULL,
        amount       REAL NOT NULL CHECK (amount > 0),
        reference    TEXT,
        payment_date TEXT NOT NULL,
        matched_invoice_id TEXT,
        match_rule   TEXT,
        confidence   REAL,
        created_at   TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (matched_invoice_id) REFERENCES invoices(invoice_id)
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_status   ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer);
`);

export default db;