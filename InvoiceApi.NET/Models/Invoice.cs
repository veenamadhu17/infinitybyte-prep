namespace InvoiceApi.NET.Models;

public class Invoice
{
    public string InvoiceId { get; set; } = string.Empty;
    public string Customer { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateOnly DueDate { get; set; }
    public string Status { get; set; } = "open"; // open | paid | cancelled
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}