# Invoice API
 
A small Node.js + Express REST API that manages invoices and auto-matches
incoming payments to open invoices using a three-tier rule engine.
 
Built as the second iteration of a learning project around accounts-receivable
reconciliation. Pairs with the [cash-allocator](#) Python prototype.
 
## What it does
 
- **Invoices**: create, list (filtered + paginated), fetch one, update status
- **Payments**: record a payment — the API automatically tries to match it
  to an open invoice using three rules in priority order:
  1. **Reference match** (confidence 1.00) — payment reference contains the
     invoice ID and amounts agree. Auto-closes the invoice.
  2. **Exact amount + normalised name** (confidence 0.95) — strict match
     after normalising case, punctuation, and legal-entity suffixes
     (BV, Ltd, Corp, GmbH, ...). Auto-closes the invoice.
  3. **Fuzzy name + exact amount** (confidence 0.75–0.99) — sequence
     similarity above threshold. Recorded but **flagged for human review**.
     The invoice stays open until a person confirms.
This split — auto-close on high confidence, queue for review on fuzzy
matches — is the same trade-off any production AR product makes: false
positives in cash allocation are worse than missed matches.
 
## Run
 
```bash
npm install
npm start
```
 
Then open http://localhost:3000/docs for the Swagger UI.
 
Default API key is `dev-key-change-me`. Override with:
 
```bash
API_KEY=my-secret-key npm start
```
 
## API at a glance
 
| Method | Path                           | Description                              |
|--------|--------------------------------|------------------------------------------|
| POST   | `/invoices`                    | Create invoice                           |
| GET    | `/invoices?status=&customer=`  | List with filters and pagination         |
| GET    | `/invoices/{id}`               | Fetch one                                |
| PATCH  | `/invoices/{id}/status`        | Update status (open / paid / cancelled)  |
| POST   | `/payments`                    | Record payment + auto-match              |
| GET    | `/payments`                    | List recent payments                     |
| GET    | `/health`                      | Health check (no auth)                   |
| GET    | `/docs`                        | Swagger UI (no auth)                     |
 
All `/invoices` and `/payments` endpoints require `X-API-Key` header.
 
## Project structure
 
```
invoice-api/
├── openapi.yaml          # OpenAPI 3.0 spec — drives /docs
├── package.json
├── requests.http         # Ready-to-run requests (VS Code REST Client)
└── src/
    ├── server.js         # Express setup, routes wiring, /docs, /health
    ├── auth.js           # API key middleware
    ├── db.js             # SQLite connection + schema
    ├── schemas.js        # Zod input validation
    ├── matcher.js        # Pure matching logic — easy to test
    ├── invoices.js       # /invoices endpoints
    └── payments.js       # /payments endpoints (with auto-match)
```
 
## Design decisions worth calling out
 
- **SQLite + better-sqlite3** instead of Postgres: zero setup, real database,
  perfect for a prototype. Schema is recreated idempotently on startup.
- **Pure matching logic**: `matcher.js` has no DB or HTTP dependencies, so
  it's trivial to unit-test or port to another stack (e.g. the Python
  cash-allocator uses the same algorithm).
- **Transactions** around the payment + match + invoice-update sequence so
  a partial failure can never leave the DB in an inconsistent state.
- **Fuzzy matches don't auto-close invoices** — they're flagged and surfaced
  via the `requires_review` flag in the response.
- **Validation with Zod** rather than hand-rolled `if (!req.body.x)` chains,
  so error messages are consistent and machine-readable.
## Known limitations (intentional — this is a prototype)
 
- No partial-payment handling (one payment covering only part of an invoice)
- No bundled-payment handling (one payment covering multiple invoices)
- No multi-currency support
- API key auth is single-key — production would use per-client hashed keys
- No rate limiting, no request logging beyond default Express behaviour
- No bank-file ingestion (CAMT.053 / MT940) — invoices and payments come in
  via REST only
## Possible next steps
 
- Bundled-payment matching: try combinations of open invoices that sum to
  the payment amount, scoped to the same customer
- Webhook on successful match so downstream ERPs can be notified
- Self-learning fuzzy matches: when a human confirms a fuzzy match, store
  the payer-name → customer mapping so the next payment from that payer
  matches automatically
- Replace `SequenceMatcher`-style similarity with embedding-based name
  matching for higher precision at scale