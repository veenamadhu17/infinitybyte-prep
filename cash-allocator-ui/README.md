# Cash Allocator — UI
 
React frontend for the AR cash-allocation system. Two screens:
 
1. **Invoices** — paginated list with status filter and customer search
2. **Needs review** — fuzzy matches awaiting human confirmation
Designed as a tight, dense internal tool for finance clerks.
 
## Run
 
In one terminal, start the Node API:
 
```bash
cd ../invoice-api
npm start
```
 
In another terminal, start the UI:
 
```bash
npm install
npm run dev
```
 
Open http://localhost:5173. Vite proxies `/api/*` to the Node API on port 3000.
 
## Stack
 
- **Vite + React 18** — fast HMR, no build complexity
- **Tailwind CSS** — utility-first; the visual system lives in `tailwind.config.js`
- **Inter Tight + IBM Plex Mono** — display + tabular figures for money columns
- No state management library — `useState` is enough for two screens
- No router — simple tab state, also enough for two screens
## Why proxy in dev instead of CORS
 
In development, `vite.config.js` proxies all `/api/*` requests to the Node API.
The browser sees only same-origin requests, so CORS never enters the picture.
In production you'd configure a reverse proxy (nginx, Cloudflare) the same way,
or set `VITE_API_BASE` to the deployed API URL and configure CORS on the server.
 
## Design decisions worth calling out
 
- **Tabular figures everywhere money appears.** `font-variant-numeric: tabular-nums`
  on `.tabular` ensures amounts in adjacent rows align column-perfectly.
- **No status colours on row backgrounds.** Status is communicated via small
  chips. Colouring entire rows feels like Excel from 2003.
- **Confidence bar uses linear interpolation between amber and forest green.**
  A 75% match is amber; a 99% match is green. Quick visual triage.
- **Two-column "received → proposed" layout for review items.** Mirrors how
  a clerk thinks about the decision: "this thing on the left, is it the same
  as this thing on the right?"
- **Review actions are below a hairline rule** so the destructive button
  (Reject) is visually separate from the data being decided on.

## Limitations
 
- No auth on the UI itself — the API key is hardcoded. Real version would have
  a login screen.
- No optimistic updates on Confirm/Reject. The list waits for the API call.
- Rejecting payments just leads to an unmatched payment, no separate unmatched payments tab
- Polling not implemented — refresh button only. Production would use WebSockets
  or SSE for new fuzzy matches arriving live.
- No mobile layout. Internal tools for a desk-based job; explicit non-goal.

## Possible next steps
 
- Add a "create payment" form to demonstrate auto-matching live in the UI
- Add a detail view per invoice with payment history
- Optimistic mutations with rollback on error
- A small dashboard widget on the invoices page: total open value, % auto-matched this week
- Dark mode