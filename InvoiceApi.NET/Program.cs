using FluentValidation;
using InvoiceApi.NET.Data;
using InvoiceApi.NET.Endpoints;
using InvoiceApi.NET.Services;
using InvoiceApi.NET.Validation;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(opt => 
    opt.UseSqlite("Data Source=invoices.db"));

builder.Services.AddValidatorsFromAssemblyContaining<CreateInvoiceValidator>();
builder.Services.AddSingleton<MatcherService>();

var app = builder.Build();

// DB creation
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.UseMiddleware<ApiKeyMiddleware>();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithTags("Meta")
    .AllowAnonymous();

app.MapInvoiceEndpoints();
app.MapPaymentEndpoints();

app.Run();
