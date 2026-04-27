using InvoiceApi.NET.Models;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApi.NET.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Invoice>(e =>
        {
            e.ToTable("invoices");
            e.HasKey(x => x.InvoiceId);
            e.Property(x => x.InvoiceId).HasColumnName("invoice_id").HasMaxLength(50);
            e.Property(x => x.Customer).HasColumnName("customer").HasMaxLength(200).IsRequired();
            e.Property(x => x.Amount).HasColumnName("amount").HasColumnType("REAL");
            e.Property(x => x.DueDate).HasColumnName("due_date");
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");

            e.HasIndex(x => x.Status).HasDatabaseName("idx_invoices_status");
            e.HasIndex(x => x.Customer).HasDatabaseName("idx_invoices_customer");
        });

        b.Entity<Payment> (e =>
        {
            e.ToTable("payments");
            e.HasKey(x => x.PaymentId);
            e.Property(x => x.PaymentId).HasColumnName("payment_id").HasMaxLength(50);
            e.Property(x => x.PayerName).HasColumnName("payer_name").HasMaxLength(200).IsRequired();
            e.Property(x => x.Amount).HasColumnName("amount").HasColumnType("REAL");
            e.Property(x => x.Reference).HasColumnName("reference");
            e.Property(x => x.PaymentDate).HasColumnName("payment_date");
            e.Property(x => x.MatchedInvoiceId).HasColumnName("matched_invoice_id");
            e.Property(x => x.MatchRule).HasColumnName("match_rule");
            e.Property(x => x.Confidence).HasColumnName("confidence");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
        });

    }
}