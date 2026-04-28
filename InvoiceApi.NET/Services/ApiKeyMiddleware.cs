namespace InvoiceApi.NET.Services;

public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string _expectedKey;

    public ApiKeyMiddleware(RequestDelegate next, IConfiguration config)
    {
        _next = next;
        _expectedKey = config["ApiKey"] ?? "dev-key-change-me";
    }

    public async Task InvokeAsync(HttpContext ctx)
    {
        var path = ctx.Request.Path.Value ?? "";
        if (path.StartsWith("/health") || path.StartsWith("/swagger"))
        {
            await _next(ctx);
            return;
        }

        if (!ctx.Request.Headers.TryGetValue("X-API-Key", out var provided)
            || provided != _expectedKey)
        {
            ctx.Response.StatusCode = 401;
            await ctx.Response.WriteAsJsonAsync(new
            {
               error = "unauthorized",
               message = "Missing or invalid X-API-Key header", 
            });
            return;
        }

        await _next(ctx);
    }
}