import csv
import re
from difflib import SequenceMatcher
from pathlib import Path

INVOICES_FILE = Path("data/invoices.csv")
PAYMENTS_FILE = Path("data/payments.csv")
OUTPUT_DIR = Path("output")
FUZZY_NAME_THRESHOLD = 0.75

def load_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))
    
def write_csv(path: Path, rows: list[dict], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
def normalise(text: str) -> str:
    if not text:
        return ""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", " ", text)
    suffixes = [" bv", " b v", " ltd", " limited", " corp", " corporation",
                " inc", " incorporated", " industries", " ind", " gmbh", " sa", " ag"]
    for suffix in suffixes:
        if text.endswith(suffix):
            text = text[:-len(suffix)]
    return re.sub(r"\s+", " ", text).strip()

def name_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, normalise(a), normalise(b)).ratio()

def reference_matches_invoice(reference: str, invoice_id: str) -> bool:
    if not reference:
        return False
    ref_clean = re.sub(r"[^A-Z0-9]", "", reference.upper())
    inv_clean = re.sub(r"[^A-Z0-9]", "", invoice_id.upper())
    return inv_clean in ref_clean

def try_reference_match(payment, invoices):
    for invoice in invoices:
        if reference_matches_invoice(payment["reference"], invoice["invoice_id"]):
            if float(payment["amount"]) == float(invoice["amount"]):
                return {"invoice": invoice, "rule": "reference_match", "confidence": 1.0}
    return None

def try_exact_amount_and_name(payment, invoices):
    payer = normalise(payment["payer_name"])
    for invoice in invoices:
        if float(payment["amount"]) == float(invoice["amount"]):
            if normalise(invoice["customer"]) == payer:
                return {"invoice": invoice, "rule": "exact_amount_name", "confidence": 0.95}
    return None

def try_fuzzy_match(payment, invoices):
    best = None
    for invoice in invoices:
        if float(payment["amount"]) == float(invoice["amount"]):
            score = name_similarity(payment["payer_name"], invoice["customer"])
            if score >= FUZZY_NAME_THRESHOLD and (best is None or score > best["confidence"]):
                best = {"invoice": invoice, "rule": "fuzzy_match", "confidence": score}
    return best

def allocate(payments, invoices):
    open_invoices = invoices.copy()
    matched, partial, unmatched = [], [], []

    for payment in payments:
        result = (
            try_reference_match(payment, open_invoices)
            or try_exact_amount_and_name(payment, open_invoices)
            or try_fuzzy_match(payment, open_invoices)
        )

        if result is None:
            unmatched.append(payment)
            continue

        record = {
            "payment_id": payment["payment_id"],
            "payer_name": payment["payer_name"],
            "payment_amount": payment["amount"],
            "invoice_id": result["invoice"]["invoice_id"],
            "customer": result["invoice"]["customer"],
            "rule": result["rule"],
            "confidence": round(result["confidence"], 3),
        }

        if result["rule"] == "fuzzy_match":
            partial.append(record)
        else:
            matched.append(record)

        open_invoices.remove(result["invoice"])

    return matched, partial, unmatched

def print_summary(payments, matched, partial, unmatched):
    total = len(payments)
    print("\n" + "=" * 50)
    print("CASH ALLOCATION SUMMARY")
    print("=" * 50)
    print(f"Total payments processed : {total}")
    print(f"Auto-matched (high conf) : {len(matched)} ({len(matched)/total:.0%})")
    print(f"Partial matches (review) : {len(partial)} ({len(partial)/total:.0%})")
    print(f"Unmatched                : {len(unmatched)} ({len(unmatched)/total:.0%})")
    print(f"Unallocated value        : EUR {sum(float(p['amount']) for p in unmatched):,.2f}")
    print("=" * 50 + "\n")

def main():
    invoices = load_csv(INVOICES_FILE)
    payments = load_csv(PAYMENTS_FILE)
    print(f"Loaded {len(invoices)} invoices and {len(payments)} payments.")

    matched, partial, unmatched = allocate(payments, invoices)

    write_csv(OUTPUT_DIR / "matched.csv", matched,
        ["payment_id", "payer_name", "payment_amount", "invoice_id", "customer", "rule", "confidence"])
    write_csv(OUTPUT_DIR / "partial_matches.csv", partial,
        ["payment_id", "payer_name", "payment_amount", "invoice_id", "customer", "rule", "confidence"])
    write_csv(OUTPUT_DIR / "unmatched_payments.csv", unmatched,
        ["payment_id", "payer_name", "amount", "reference", "date"])

    print_summary(payments, matched, partial, unmatched)
    print(f"Output written to: {OUTPUT_DIR.resolve()}")

if __name__ == "__main__":
    main()