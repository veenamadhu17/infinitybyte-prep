class Invoice {
  final String invoiceId;
  final String customer;
  final double amount;
  final String dueDate;
  final String status;
  final String createdAt;

  Invoice({
    required this.invoiceId,
    required this.customer,
    required this.amount,
    required this.dueDate,
    required this.status,
    required this.createdAt,
  });

  factory Invoice.fromJson(Map<String, dynamic> json) {
    return Invoice(
      invoiceId: json['invoiceId'] as String,
      customer: json['customer'] as String,
      amount: (json['amount'] as num).toDouble(),
      dueDate: json['dueDate'] as String,
      status: json['status'] as String,
      createdAt: json['createdAt'] as String,
    );
  }

  bool get isOpen => status == 'open';
  bool get isPaid => status == 'paid';
  bool get isCancelled => status == 'cancelled';
}