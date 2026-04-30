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
├── cash-allocator/          # Python prototype — core matching algorithm, CSV in/out
├── invoice-api/             # Node.js + Express REST API with SQLite
├── cash-allocator-ui/       # React + Vite frontend for finance clerks
├── InvoiceApi.NET/          # ASP.NET Core port of invoice-api
├── cash_allocator_mobile/   # Flutter mobile app — connects to the ASP.NET Core API
└── cash-allocator-tests/    # Playwright end-to-end tests for the React UI + Node API
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

### cash-allocator-tests (Playwright)

End-to-end UI regression suite for the React app + Node API. Tests run against the real stack — no mocks — so integration bugs can't hide behind faked responses.

**Stack**: Playwright · Node.js · Page Object Model

```bash
cd cash-allocator-tests
npm install
npx playwright install   # one-time browser binary download (~300 MB)
npm test                 # headless run
```

`playwright.config.js` auto-starts both the API and the UI before running, so no manual setup is needed.

| Suite | Covers |
|-------|--------|
| `smoke.spec.js` | App loads, both tabs visible, tab switching |
| `invoices.spec.js` | Invoice list, status filter, customer search |
| `automatch.spec.js` | High-confidence matches auto-close without review |
| `review.spec.js` | Fuzzy matches surface in inbox; confirm/reject workflows |

See [cash-allocator-tests/README.md](cash-allocator-tests/README.md) for design decisions and additional run modes.

---

### InvoiceApi.NET (ASP.NET Core)

Port of `invoice-api` to .NET. Identical endpoints and matching algorithm; differences are idiomatic to the stack.

**Stack**: ASP.NET Core minimal APIs · SQLite (EF Core) · FluentValidation · Swashbuckle (auto-generated Swagger)

```bash
cd InvoiceApi.NET
dotnet run
```

Swagger UI at `http://localhost:5251/swagger`. API key configured in `appsettings.json`.

**Notable difference vs Node version**: uses `decimal` instead of JavaScript's `number` for all monetary values — exact arithmetic, no floating-point rounding errors. Matters in production fintech.

See [InvoiceApi.NET/README.md](InvoiceApi.NET/README.md) for the full Node → .NET translation comparison.

---

### cash_allocator_mobile (Flutter)

Flutter companion app that connects to the **ASP.NET Core API** (`http://localhost:5251`). Same two screens as the React UI — invoices and the review queue — proving the API contract holds across clients.

**Stack**: Flutter · Dart · `http` package · `FutureBuilder` for async state

```bash
# Terminal 1 — API
cd InvoiceApi.NET && dotnet run

# Terminal 2 — Flutter app (runs in Chrome)
cd cash_allocator_mobile && flutter pub get && flutter run -d chrome
```

**Two screens**:
- **Invoices** — list with status filter and customer search
- **Needs Review** — fuzzy matches awaiting confirmation or rejection

The app targets the .NET backend but is portable to the Node API — only two constants change (port and JSON casing). Visual language matches the React UI: same off-white background, amber accent, and tabular-figure money columns.

See [cash_allocator_mobile/README.md](cash_allocator_mobile/README.md) for design decisions and differences from the React frontend.

---

## Cross-stack comparison

| Concern | Python | Node.js | .NET | Flutter |
|---------|--------|---------|------|---------|
| Role | Batch processor | REST API | REST API | Mobile/web client |
| Web framework | — | Express 5 | ASP.NET Core minimal APIs | Flutter |
| Database | CSV | SQLite (raw SQL) | SQLite (EF Core) | — (API consumer) |
| Validation | — | Zod | FluentValidation | — |
| API docs | — | Hand-written OpenAPI YAML | Auto-generated Swashbuckle | — |
| Money type | `float` | `number` (lossy) | `decimal` (exact) | `double` (display only) |
| Matching logic | `allocator.py` | `matcher.js` | `MatcherService.cs` | — (server-side) |
| Async model | — | Promises / `async-await` | `async/await` | `FutureBuilder` |

The matching algorithm is identical across all three backends — same normalization rules, same suffix list, same LCS-based similarity scoring. The port was intentionally kept line-for-line faithful. The Flutter client proves the shared API contract by consuming the .NET backend interchangeably.

## Known limitations (intentional, scope was kept narrow)

- No partial-payment handling (one payment covering part of an invoice)
- No bundled-payment handling (one payment for multiple invoices)
- No multi-currency support or bank-rate conversion
- No bank-file ingestion (SEPA CAMT.053 / MT940)
- Single API key — production would use per-client hashed keys with rate limiting
- UI has no authentication layer (API key is hardcoded in `client.js`)
