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

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "Invoice API",
        Version = "v1",
        Description = "Mini AR invoice API with auto-matching of payments to open invoices",
    });

    c.AddSecurityDefinition("ApiKey", new()
    {
        Name = "X-API-Key",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "API key. Default in dev: dev-key-change-me",
    });

    c.AddSecurityRequirement(new ()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new()
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "ApiKey"
                }
            }, Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// DB creation
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Invoice API v1");
    c.RoutePrefix = "swagger";
});

app.UseMiddleware<ApiKeyMiddleware>();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithTags("Meta")
    .AllowAnonymous();

app.MapInvoiceEndpoints();
app.MapPaymentEndpoints();

app.Run();
