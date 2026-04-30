# cash-allocator-tests

Playwright end-to-end UI regression tests for the `cash-allocator-ui` React app.

Tests run against the real UI and the real Node API — no mocks. The whole
point of UI tests is to catch integration bugs, and mocks would hide those.

## Run

From this directory:

```bash
npm install
npx playwright install   # downloads browser binaries (~300MB, one-time)
npm test                 # runs the full suite headlessly
```

Other useful commands:

| Command           | What it does                                              |
|-------------------|-----------------------------------------------------------|
| `npm test`        | Headless run, fastest                                     |
| `npm run test:ui` | Opens Playwright's interactive UI mode — best for debugging |
| `npm run test:headed` | Watch tests run in a visible browser                  |
| `npm run test:debug`  | Step through tests with the inspector                 |
| `npm run report`      | Open the HTML report from the last run                |
| `npm run codegen`     | Record clicks and generate test code                  |

The `playwright.config.js` auto-starts the Node API and the React UI before
tests run, so you don't need to start them manually.

## What's tested

| Suite           | What it covers                                                |
|-----------------|---------------------------------------------------------------|
| `smoke.spec.js` | App loads, both tabs visible, tab switching                  |
| `invoices.spec.js` | Invoice list rendering, status filter, customer search    |
| `automatch.spec.js` | High-confidence matches auto-close without review        |
| `review.spec.js` | Fuzzy matches surface in inbox; confirm/reject workflows    |

## Design decisions worth calling out

### Real backend, not mocks
Mocking the API would hide integration bugs — exactly the class of bug
UI tests exist to catch. Tests seed data via the real API before each
test and tear down with unique IDs to avoid collisions.

### Page Object Model
Selectors live in `tests/pages/*.js` rather than scattered across test
files. When the UI restyles, one file changes; tests stay green.

### Semantic selectors
`getByRole("button", { name: "Confirm match" })` survives a CSS rewrite.
A class-based selector (`.btn-primary-3`) breaks the moment a designer
touches the file. Tests should describe what a user sees, not what the
DOM happens to look like today.

### Serial execution
Tests share a single SQLite database, so we run with `workers: 1` to
keep state deterministic. In a real CI setup, each test worker would
get its own isolated DB instance — but for a small suite, serial is
faster overall (no setup/teardown overhead per worker).

### Unique IDs per test
Rather than truncating tables between tests, each test generates IDs
like `INV-1730384029-451`. This sidesteps the lack of a DELETE endpoint
on the API and means tests can run against any state the DB happens
to be in.

## Limitations

- **No cross-browser run by default.** Chromium only. Firefox and WebKit
  projects are scaffolded but commented out — uncomment for a CI matrix.
- **No visual regression tests.** Pixel snapshots are flaky and add CI
  cost; semantic assertions (this row contains "Paid") are more durable.
- **Tests assume the dev API key.** Production runs would inject a real
  key via env var.
- **No accessibility tests yet.** Adding `@axe-core/playwright` would be
  a small, high-value next step.
- **No separate Database for testing.** When running the tests, it creates cases using the existing database instead of creating one specifically for testing. Need to ensure there is no database or that it is empty before running tests.

## Possible next steps

- Add cross-browser run in CI (uncomment the firefox/webkit projects)
- Add `@axe-core/playwright` for accessibility regression
- Add visual baselines for the confidence bar (the most visually distinctive
  element, where pixel snapshots are actually useful)
- Wire up GitHub Actions workflow to run the suite on every PR
- Add a `tests/perf/` suite with `page.metrics()` to track render time
  on tables of 1000+ invoices