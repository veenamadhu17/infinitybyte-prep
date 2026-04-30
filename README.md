# infinitybyte-prep

AR (accounts receivable) cash allocation and invoice reconciliation system, built as a learning project to demonstrate the same domain logic implemented across three different tech stacks.

## What it does

Finance teams receive bank payments and need to match them against open invoices. This is called **cash allocation**. The core challenge is that customer names on bank statements rarely match invoice records exactly — they're abbreviated, use different punctuation, or omit legal suffixes (Ltd, BV, GmbH).

The matching engine applies three rules in priority order:

| Priority | Rule | Confidence | Action |
|----------|------|-----------|--------|
| 1 | Payment reference contains invoice ID + exact amount | 1.00 | Auto-close invoice |
| 2 | Exact amount + normalised customer name (case-insensitive, suffix-stripped) | 0.95 | Auto-close invoice |
| 3 | Exact amount + fuzzy name similarity ≥ 0.75 | 0.75–0.99 | Queue for human review |

Payments that don't meet any threshold are left unmatched for investigation.

## Modules

```
infinitybyte-prep/
├── cash-allocator/        # Python prototype — core matching algorithm, CSV in/out
├── invoice-api/           # Node.js + Express REST API with SQLite
├── cash-allocator-ui/     # React + Vite frontend for finance clerks
└── InvoiceApi.NET/        # ASP.NET Core port of invoice-api
```

### cash-allocator (Python)

Pure proof-of-concept with no external dependencies. Reads `data/invoices.csv` and `data/payments.csv`, writes three output files:

- `output/matched.csv` — high-confidence matches
- `output/partial_matches.csv` — fuzzy matches flagged for human review
- `output/unmatched_payments.csv` — payments needing investigation

```bash
cd cash-allocator
python allocator.py
```

See [cash-allocator/README.md](cash-allocator/README.md) for CSV formats and matching rule details.

---

### invoice-api (Node.js + Express)

REST API with persistent SQLite storage and auto-matching on payment ingestion.

**Stack**: Express 5 · SQLite (better-sqlite3) · Zod · Swagger UI

```bash
cd invoice-api
npm install
npm run dev        # starts on :3000 with --watch
```

Swagger UI available at `http://localhost:3000/docs`.

**Key endpoints**:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/invoices` | Create invoice |
| `GET` | `/invoices` | List with `?status=` and `?customer=` filters |
| `GET` | `/invoices/:id` | Fetch single invoice |
| `PATCH` | `/invoices/:id/status` | Update status (`open` / `paid` / `cancelled`) |
| `POST` | `/payments` | Record payment + auto-match |
| `GET` | `/payments` | List recent payments |
| `POST` | `/payments/:id/unmatch` | Clear fuzzy match, reopen invoice |
| `GET` | `/health` | Health check (no auth) |

All `/invoices` and `/payments` routes require `X-API-Key: dev-key-change-me` (override with `API_KEY` env var).

See [invoice-api/README.md](invoice-api/README.md) for design decisions and data shapes.

---

### cash-allocator-ui (React + Vite)

Dense internal tool UI for finance clerks. Connects to `invoice-api`.

**Stack**: React 19 · Vite · Tailwind CSS · IBM Plex Mono (tabular figures for money columns)

```bash
# Terminal 1 — API
cd invoice-api && npm run dev

# Terminal 2 — UI
cd cash-allocator-ui && npm install && npm run dev
```

UI runs on `http://localhost:5173`. Vite proxies `/api/*` to the Node API so there's no CORS issue in development.

**Two screens**:
- **Invoices** — paginated list, searchable by customer, filterable by status
- **Needs Review** — fuzzy matches awaiting human confirmation or rejection

See [cash-allocator-ui/README.md](cash-allocator-ui/README.md) for UI design decisions.

---

### InvoiceApi.NET (ASP.NET Core)

Port of `invoice-api` to .NET. Identical endpoints and matching algorithm; differences are idiomatic to the stack.

**Stack**: ASP.NET Core minimal APIs · SQLite (EF Core) · FluentValidation · Swashbuckle (auto-generated Swagger)

```bash
cd InvoiceApi.NET
dotnet run
```

Swagger UI at `http://localhost:5000/swagger`. API key configured in `appsettings.json`.

**Notable difference vs Node version**: uses `decimal` instead of JavaScript's `number` for all monetary values — exact arithmetic, no floating-point rounding errors. Matters in production fintech.

See [InvoiceApi.NET/README.md](InvoiceApi.NET/README.md) for the full Node → .NET translation comparison.

---

## Cross-stack comparison

| Concern | Python | Node.js | .NET |
|---------|--------|---------|------|
| Web framework | — | Express 5 | ASP.NET Core minimal APIs |
| Database | CSV | SQLite (raw SQL) | SQLite (EF Core) |
| Validation | — | Zod | FluentValidation |
| API docs | — | Hand-written OpenAPI YAML | Auto-generated Swashbuckle |
| Money type | `float` | `number` (lossy) | `decimal` (exact) |
| Matching logic | `allocator.py` | `matcher.js` | `MatcherService.cs` |

The matching algorithm is identical across all three — same normalization rules, same suffix list, same LCS-based similarity scoring. The port was intentionally kept line-for-line faithful.

## Known limitations (intentional, scope was kept narrow)

- No partial-payment handling (one payment covering part of an invoice)
- No bundled-payment handling (one payment for multiple invoices)
- No multi-currency support or bank-rate conversion
- No bank-file ingestion (SEPA CAMT.053 / MT940)
- Single API key — production would use per-client hashed keys with rate limiting
- UI has no authentication layer (API key is hardcoded in `client.js`)
