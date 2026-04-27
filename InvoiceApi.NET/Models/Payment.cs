namespace InvoiceApi.NET.Models;

public class Payment
{
    public string PaymentId { get; set; } = string.Empty;
    public string PayerName { get; set; } = string.Empty;
    public decimal Amount { get; set; } 
    public string? Reference { get; set; }
    public DateOnly PaymentDate { get; set; }

    // if matched, the following is recorded
    public string? MatchedInvoiceId { get; set; }
    public string? MatchRule { get; set; }
    public double? Confidence { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}