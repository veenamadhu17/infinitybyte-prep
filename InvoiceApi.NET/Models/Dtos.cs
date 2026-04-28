namespace InvoiceApi.NET.Models;

// requests
public record CreateInvoiceRequest(
    string InvoiceId,
    string Customer,
    decimal Amount,
    DateOnly DueDate
);

public record UpdateInvoiceStatusRequest(string Status);

public record CreatePaymentRequest(
    string PaymentId,
    string PayerName,
    decimal Amount,
    string? Reference,
    DateOnly PaymentDate
);

// responses
public record InvoiceResponse(
    string InvoiceId,
    string Customer,
    decimal Amount,
    DateOnly DueDate,
    string Status,
    DateTime CreatedAt
)
{
    public static InvoiceResponse From(Invoice i) => 
        new (i.InvoiceId, i.Customer, i.Amount, i.DueDate, i.Status, i.CreatedAt);
}

public record PagedResult<T>(int Total, int Limit, int Offset, IEnumerable<T> Items);

public record MatchResult(
    string Rule, 
    double Confidence,
    string InvoiceId,
    bool AutoClosed,
    bool RequiresReview
);

public record CreatePaymentResponse(
    Payment Payment,
    MatchResult? Match
);

public record ErrorResponse(string Error, string Message);