using System.ComponentModel.DataAnnotations;
using FluentValidation;
using InvoiceApi.NET.Data;
using InvoiceApi.NET.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApi.NET.Endpoints;

public static class InvoiceEndpoints
{
    public static void MapInvoiceEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/invoices").WithTags("Invoices");

        // POST
        group.MapPost("/", async (
            CreateInvoiceRequest req,
            IValidator<CreateInvoiceRequest> validator,
            AppDbContext db
        ) =>
        {
            var validation = await validator.ValidateAsync(req);
            if (!validation.IsValid)
                return Results.BadRequest(new { error = "validation_failed", details = validation.Errors });
            
            if (await db.Invoices.AnyAsync(i => i.InvoiceId == req.InvoiceId))
                return Results.Conflict(new ErrorResponse("conflict", $"Invoice {req.InvoiceId} already exists"));

            var entity = new Invoice
            {
                InvoiceId = req.InvoiceId,
                Customer = req.Customer,
                Amount = req.Amount,
                DueDate = req.DueDate,
                Status = "open",
                CreatedAt = DateTime.UtcNow,
            };
            db.Invoices.Add(entity);
            await db.SaveChangesAsync();

            return Results.Created($"/invoices/{entity.InvoiceId}", InvoiceResponse.From(entity));
        });

        // GET - all invoices
        group.MapGet("/", async (
            string? status,
            string? customer,
            int? limit,
            int? offset,
            AppDbContext db 
        ) =>
        {
           var take = Math.Clamp(limit ?? 20, 1, 100);
           var skip = Math.Max(offset ?? 0, 0); 

           var q = db.Invoices.AsQueryable();
           if (!string.IsNullOrWhiteSpace(status)) q = q.Where(i => i.Status == status); 
           if (!string.IsNullOrWhiteSpace(customer)) q = q.Where(i => i.Customer.Contains(customer));

           var total = await q.CountAsync();
           var rows = await q.OrderByDescending(i => i.CreatedAt)
                             .Skip(skip).Take(take).ToListAsync();
           return Results.Ok(new PagedResult<InvoiceResponse>(
            total, take, skip, rows.Select(InvoiceResponse.From)
           ));
        });

        // GET - invoice by id
        group.MapGet("/{id}", async (string id, AppDbContext db) =>
        {
           var inv = await db.Invoices.FindAsync(id);
           return inv is null
            ? Results.NotFound(new ErrorResponse("not_found", $"Invoice {id} not found"))
            : Results.Ok(InvoiceResponse.From(inv)); 
        });

        // PATCH - update invoice status
        group.MapPatch("/{id}/status", async (
            string id,
            UpdateInvoiceStatusRequest req,
            IValidator<UpdateInvoiceStatusRequest> validator,
            AppDbContext db
        ) =>
        {
           var validation = await validator.ValidateAsync(req);
           if (!validation.IsValid)
            return Results.BadRequest(new { error = "validation_failed", details = validation.Errors });

            var inv = await db.Invoices.FindAsync(id);
            if (inv is null)
                return Results.NotFound(new ErrorResponse("not_found", $"Invoice {id} not found"));

            inv.Status = req.Status;
            await db.SaveChangesAsync();
            return Results.Ok(InvoiceResponse.From(inv)); 
        });
    }
}