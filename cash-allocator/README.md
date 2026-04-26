# Mini Cash Allocator

A small Python prototype that demonstrates the core logic behind automated 
cash allocation — matching incoming customer payments to open AR invoices.

Built as a learning project to better understand the AR reconciliation 
problem space.

## What it does

Reads two CSV inputs:
- `data/invoices.csv` — open invoices (id, customer, amount, due date)
- `data/payments.csv` — bank payments (id, payer name, amount, reference, date)

Applies three matching strategies in priority order:
1. **Reference match** — payment reference contains an invoice ID, amounts agree
2. **Exact amount + normalised name** — strict case/punctuation/suffix-tolerant
3. **Fuzzy name + exact amount** — uses sequence similarity above 0.75

Writes three outputs:
- `output/matched.csv` — confident matches
- `output/partial_matches.csv` — fuzzy matches flagged for human review
- `output/unmatched_payments.csv` — payments that need manual investigation

Prints a summary with auto-match rate and total unallocated value.

## Run

```bash
python allocator.py
```

No dependencies beyond the Python standard library.

## Design notes

- Matching rules are separate functions — easy to add, tune, or reorder.
- Once an invoice is matched, it's removed from the open pool — prevents 
  one invoice being claimed by two payments.
- Name normalisation strips common legal-entity suffixes (BV, Ltd, Corp, 
  GmbH, etc.). New suffixes can be added in one place.
- Fuzzy threshold (0.75) is configurable at the top of the file.

## Known limitations (intentional — this is a prototype)

- Doesn't handle partial payments (one payment covering only part of an invoice)
- Doesn't handle bundled payments (one payment covering multiple invoices)
- Doesn't handle currency conversion or multi-currency reconciliation
- No persistence — runs from CSV each time
- No SEPA/CAMT.053/MT940 bank-file parsing yet

## Possible next steps

- Bundled-payment matching (combinations of invoices summing to payment amount)
- Plug in `sentence-transformers` for semantic name matching at scale
- Parse real CAMT.053 / MT940 bank statement files instead of CSV
- Self-learning: when a user manually matches an unmatched payment, save 
  the payer→customer mapping for next time