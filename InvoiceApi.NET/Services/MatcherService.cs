using System.Text.RegularExpressions;
using InvoiceApi.NET.Models;

namespace InvoiceApi.NET.Services;

// Reused matcher from cash-allocator project

public class MatcherService
{
    private const double FuzzyThreshold = 0.75; 

    private static readonly string[] CompanySuffixes = new[]
    {
      " bv", " b v", " ltd", " limited", " corp", "corporation", 
      " inc", " incorporated", " industries", " ind", " gmbh", " sa", " ag",  
    };

    public static string Normalise(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var t = text.ToLowerInvariant().Trim();
        t = Regex.Replace(t, @"[^\w\s]", " ");
        foreach (var suffix in CompanySuffixes)
        {
            if (t.EndsWith(suffix))
            {
                t = t[..^suffix.Length];
                break;
            }
        }
        return Regex.Replace(t, @"\s+", " ").Trim();
    }

    public static double Similarity(string a, string b)
    {
        var s1 = Normalise(a);
        var s2 = Normalise(b);
        if (s1.Length == 0 && s2.Length == 0) return 1.0;
        if (s1.Length == 0 || s2.Length == 0) return 0.0;

        int m = s1.Length;
        int n = s2.Length;
        var dp = new int[m + 1, n + 1];
        for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            {
                dp[i, j] = s1[i-1] == s2[j-1]
                    ? dp[i-1, j-1] + 1
                    : Math.Max(dp[i-1, j], dp[i, j-1]);
            }
        return 2.0 * dp[m, n] / (m + n);
    }

    public static bool ReferenceMatchesInvoice(string? reference, string invoiceId)
    {
        if (string.IsNullOrWhiteSpace(reference)) return false;
        var refClean = Regex.Replace(reference.ToUpperInvariant(), @"[^A-Z0-9]", "");
        var invClean = Regex.Replace(invoiceId.ToUpperInvariant(), @"[^A-Z0-9]", "");
        return refClean.Contains(invClean);
    }

    public record Match(Invoice Invoice, string Rule, double Confidence);

    public Match? FindMatch(Payment payment, IEnumerable<Invoice> openInvoices)
    {
        var invoices = openInvoices.ToList();

        foreach (var inv in invoices)
        {
            if (ReferenceMatchesInvoice(payment.Reference, inv.InvoiceId)
                && payment.Amount == inv.Amount)
            {
                return new Match(inv, "reference_match", 1.0);
            } 
        }

        var payerNorm = Normalise(payment.PayerName);
        foreach (var inv in invoices)
        {
            if (payment.Amount == inv.Amount && Normalise(inv.Customer) == payerNorm)
            {
                return new Match(inv, "exact_amount_name", 0.95);
            }
        }

        Match? best = null;
        foreach (var inv in invoices)
        {
            if (payment.Amount != inv.Amount) continue;
            var score = Similarity(payment.PayerName, inv.Customer);
            if (score >= FuzzyThreshold && (best is null || score > best.Confidence))
            {
                best = new Match(inv, "fuzzy_match", score);
            }
        }
        return best;
    }
}