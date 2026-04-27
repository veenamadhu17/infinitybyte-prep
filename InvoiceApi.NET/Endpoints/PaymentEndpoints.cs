using System.ComponentModel.DataAnnotations;
using FluentValidation;
using InvoiceApi.NET.Data;
using InvoiceApi.NET.Models;
using InvoiceApi.NET.Services;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApi.NET.Endpoints;

public static class PaymentEnpoints
{
    public static void MapPaymentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/payments").WithTags("Payments");

        // POST
        group.MapPost("/", async (
            CreatePaymentRequest req,
            IValidator<CreatePaymentRequest> validator,
            AppDbContext db,
            MatcherService matcher
        ) =>
        {
            var validation = await validator.ValidateAsync(req);
            if (!validation.IsValid)
                return Results.BadRequest(new { error = "validation_failed", details = validation.Errors });
            
            if (await db.Payments.AnyAsync(p => p.PaymentId == req.PaymentId))
                return Results.Conflict(new ErrorResponse("conflict", $"Payment {req.PaymentId} already exists"));

            using var tx = await db.Database.BeginTransactionAsync();

            var openInvoices = await db.Invoices
                .Where(i => i.Status == "open")
                .ToListAsync();

            var payment = new Payment
            {
                PaymentId = req.PaymentId,
                PayerName = req.PayerName,
                Amount = req.Amount,
                Reference = req.Reference,
                PaymentDate = req.PaymentDate,
                CreatedAt = DateTime.UtcNow,
            };

            var match = matcher.FindMatch(payment, openInvoices);

            MatchResult? matchResult = null;
            if (match is not null)
            {
                payment.MatchedInvoiceId = match.Invoice.InvoiceId;
                payment.MatchRule = match.Rule;
                payment.Confidence = match.Confidence;

                var autoClose = match.Rule != "fuzzy_match";
                if (autoClose)
                {
                    match.Invoice.Status = "paid";
                }

                matchResult = new MatchResult(
                    Rule: match.Rule,
                    Confidence: match.Confidence,
                    InvoiceId: match.Invoice.InvoiceId,
                    AutoClosed: autoClose,
                    RequiresReview: match.Rule == "fuzzy_match"
                );
            }

            db.Payments.Add(payment);
            await db.SaveChangesAsync();
            await tx.CommitAsync();

            return Results.Created($"/payments/{payment.PaymentId}", 
                new CreatePaymentResponse(payment, matchResult));
        });

        // GET - get all payments
        group.MapGet("/", async (AppDbContext db) =>
        {
           var rows = await db.Payments 
                .OrderByDescending(p => p.CreatedAt)
                .Take(100)
                .ToListAsync();
           return Results.Ok(new { items = rows }); 
        });
    }
}