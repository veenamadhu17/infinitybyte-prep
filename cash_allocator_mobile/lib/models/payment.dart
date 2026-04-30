class Payment {
  final String paymentId;
  final String payerName;
  final double amount;
  final String? reference;
  final String paymentDate;

  final String? matchedInvoiceId;
  final String? matchRule;
  final double? confidence;

  final String createdAt;

  Payment({
    required this.paymentId,
    required this.payerName,
    required this.amount,
    required this.reference,
    required this.paymentDate,
    required this.matchedInvoiceId,
    required this.matchRule,
    required this.confidence,
    required this.createdAt,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      paymentId: json['paymentId'] as String,
      payerName: json['payerName'] as String,
      amount: (json['amount'] as num).toDouble(),
      reference: json['reference'] as String?,
      paymentDate: json['paymentDate'] as String,
      matchedInvoiceId: json['matchedInvoiceId'] as String?,
      matchRule: json['matchRule'] as String?,
      confidence: (json['confidence'] as num).toDouble(),
      createdAt: json['createdAt'] as String,
    );
  }

  bool get needsReview => matchRule == 'fuzzy_match' && matchedInvoiceId != null;
  bool get isAutoMatched => matchRule == 'reference_match' || matchRule == 'exact_amount_name';
  bool get isUnmatched => matchRule == null;
}