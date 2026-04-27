using FluentValidation;
using InvoiceApi.NET.Models;

namespace InvoiceApi.NET.Validation;

public class CreateInvoiceValidator : AbstractValidator<CreateInvoiceRequest>
{
    public CreateInvoiceValidator()
    {
        RuleFor(x => x.InvoiceId).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Customer).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.DueDate).NotEqual(default(DateOnly));
    }
}

public class UpdateInvoiceStatusValidator : AbstractValidator<UpdateInvoiceStatusRequest>
{
    private static readonly string[] Allowed = { "open", "paid", "cancelled" };

    public UpdateInvoiceStatusValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty()
            .Must(s => Allowed.Contains(s))
            .WithMessage("Status must be one of: open, paid, cancelled");

    }
}

public class CreatePaymentValidator : AbstractValidator<CreatePaymentRequest>
{
    public CreatePaymentValidator()
    {
        RuleFor(x => x.PaymentId).NotEmpty().MaximumLength(50);
        RuleFor(x => x.PayerName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.PaymentDate).NotEqual(default(DateOnly));
    }
}