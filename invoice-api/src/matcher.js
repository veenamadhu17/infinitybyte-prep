// reuses code from cash_allocator

const FUZZY_NAME_THRESHOLD = 0.75;

const COMPANY_SUFFIXES = [
    ' bv', ' b v', ' ltd', ' limited', ' corp', ' corporation', 
    ' inc', ' incorporated', ' industries', ' ind', ' gmbh', ' sa', ' ag',
];

export function normalise(text) {
    if (!text) return '';
    let t = text.toLowerCase().trim();
    t = t.replace(/[^\w\s]/g, '');
    for (const suffix of COMPANY_SUFFIXES) {
        if (t.endsWith(suffix)) {
            t = t.slice(0, -suffix.length);
            break;
        }
    }
    return t.replace(/\s+/g, ' ').trim();
}

export function similarity(a, b) {
    const s1 = normalise(a);
    const s2 = normalise(b);

    if (!s1 && !s2) return 1.0;
    if (!s1 || !s2) return 0.0;

    const m = s1.length;
    const n = s2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = s1[i-1] === s2[j-1] 
                ? dp[i-1][j-1] + 1
                : Math.max(dp[i-1][j], dp[i][j-1]);
        }
    }
    return (2.0 *dp[m][n]) / (m + n);
}

export function referenceMatchesInvoice(reference, invoiceId) {
    if (!reference) return false;
    const ref = reference.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const inv = invoiceId.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return ref.includes(inv);
}

function tryReferenceMatch(payment, openInvoices) {
    for (const inv of openInvoices) {
        if (referenceMatchesInvoice(payment.reference, inv.invoice_id) && 
            payment.amount === inv.amount) {
                return { invoice: inv, rule: 'reference_match', confidence: 1.0 };
            }
    }
    return null;
}

function tryExactAmountAndName(payment, openInvoices) {
    const payer = normalise(payment.payer_name);
    for (const inv of openInvoices) {
        if (payment.amount === inv.amount && normalise(inv.customer) === payer) {
            return { invoice: inv, rule: 'exact_amount_name', confidence: 0.95 };
        }
    }
    return null;
}

function tryFuzzyMatch(payment, openInvoices) {
    let best = null;
    for (const inv of openInvoices) {
        if (payment.amount !== inv.amount) continue;
        const score = similarity(payment.payer_name, inv.customer);
        if (score >= FUZZY_NAME_THRESHOLD && (!best || score > best.confidence)) {
            best = { invoice: inv, rule: 'fuzzy_match', confidence: score };
        }
    }
    return best;
}

export function findMatch(payment, openInvoices) {
    return tryReferenceMatch(payment, openInvoices) 
        || tryExactAmountAndName(payment, openInvoices)
        || tryFuzzyMatch(payment, openInvoices);
}