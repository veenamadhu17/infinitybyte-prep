# cash-allocator-mobile

Flutter companion to the cash allocator. Connects to the **ASP.NET Core API**
on `http://localhost:5251`. Two screens:

1. **Invoices** — list with status filter and customer search
2. **Needs review** — fuzzy matches awaiting confirmation, with confirm/reject

## Why this targets the .NET API, not the Node one

Both backends were written to expose an identical API contract — same paths,
same request/response shapes, same auth header. The Flutter app proves the
contract holds: pointing it at either backend produces the same UI behaviour.
Targeting .NET specifically is the more business-relevant choice for this
project, and "the same Flutter client works against both backends" is the
proof that the cross-stack design was deliberate.

## Run as a web app (recommended)

```bash
cd ../InvoiceApi.NET
dotnet run

cd ../cash-allocator-mobile
flutter pub get
flutter run -d chrome
```

A Chrome window opens with the Flutter app. Hot reload works on save.


## Project structure

```
cash-allocator-mobile/
├── pubspec.yaml             # dependencies
├── analysis_options.yaml    # linter config
└── lib/
    ├── main.dart            # entry point, theme, tab navigation
    ├── api/
    │   └── client.dart      # HTTP client + endpoints
    ├── models/
    │   ├── invoice.dart     # JSON parsing (camelCase from .NET)
    │   └── payment.dart
    ├── pages/
    │   ├── invoices_page.dart
    │   └── review_page.dart
    └── widgets/
        └── primitives.dart  # StatusChip, ConfidenceBar, Money
```

## Differences from the Node-targeted version of this app

| Concern         | Node version      | .NET version      |
|-----------------|-------------------|-------------------|
| Default port    | 3000              | 5251              |
| JSON casing     | snake_case        | camelCase         |
| Date type       | string YYYY-MM-DD | string YYYY-MM-DD |
| Auth header     | X-API-Key         | X-API-Key         |
| Response shape  | `{ items: [...] }` | `{ items: [...] }` |

Most of the differences live in `lib/models/*.dart` (JSON key strings) and
`lib/api/client.dart` (one constant). The page and widget code is untouched.
That's a deliberate property: the page logic is independent of which backend
it talks to.

## Design decisions worth calling out

### `FutureBuilder` instead of Riverpod / BLoC
Async data flows in Flutter are well-served by the built-in `FutureBuilder`,
which handles loading, error, and success states without boilerplate. State
libraries solve a problem this app doesn't have yet — only two screens, no
shared state. If this grew, Riverpod would be the natural next step.

### Visual continuity with the React app
Same off-white paper background, same near-black ink, same amber accent,
same confidence-bar gradient. Two clients that look like they belong to
the same product is a deliberate product decision.

### camelCase to PascalCase translation at the model boundary
The .NET API serialises C# `PascalCase` to JSON `camelCase` (the default
`System.Text.Json` policy). We translate at the `fromJson` boundary so the
rest of the Dart code uses idiomatic Dart camelCase too.

### Tabular figures for money
`FontFeature.tabularFigures()` ensures amounts in adjacent rows align
vertically. The same detail is in the React UI for the same reason.

## Limitations (intentional)

- No persistence of user preferences (status filter resets on restart)
- No offline support — requires a live API connection
- No optimistic updates on confirm/reject; UI waits for the API
- Web target only by default; Android works with the 10.0.2.2 swap
- No tests yet — `flutter test` is set up but no widget tests written

## Possible next steps

- Widget tests for `_ReviewCard` and `_InvoiceTile` using `WidgetTester`
- Integration test driving the full flow with `integration_test`
- Riverpod for shared state when the app grows beyond two screens
- Pull-to-refresh is implemented; a websocket subscription for live updates
  would be the next step
- A "Simulate payment" form for in-app demos where a real bank file
  isn't being ingested
- Dark mode