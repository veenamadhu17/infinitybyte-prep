import 'package:flutter/material.dart';
import '../api/client.dart';
import '../models/invoice.dart';
import '../models/payment.dart';
import '../widgets/primitives.dart';

class _ReviewItem {
  final Payment payment;
  final Invoice invoice;
  _ReviewItem(this.payment, this.invoice);
}

class ReviewPage extends StatefulWidget {
  final ApiClient api;
  const ReviewPage({super.key, required this.api});

  @override
  State<ReviewPage> createState() => _ReviewPageState();
}

class _ReviewPageState extends State<ReviewPage> {
  late Future<List<_ReviewItem>> _future;
  final Set<String> _busyPaymentIds = {};

  @override 
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<_ReviewItem>> _load() async {
    final payments = await widget.api.listPayments();
    final fuzzy = payments.where((p) => p.needsReview).toList();

    final items = <_ReviewItem>[];
    for (final p in fuzzy) {
      try {
        final inv = await widget.api.getInvoice(p.matchedInvoiceId!);
        if (inv.isOpen) items.add(_ReviewItem(p, inv));
      } catch (_) {

      }
    }
    return items;
  }

  void _refresh() {
    setState(() {
      _future = _load();
    });
  }

  Future<void> _confirm(_ReviewItem item) async {
    setState(() => _busyPaymentIds.add(item.payment.paymentId));
    try {
      await widget.api.setInvoiceStatus(item.invoice.invoiceId, 'paid');
      _showSnack('Confirmed: ${item.payment.paymentId} → ${item.invoice.invoiceId}');
      _refresh();
    } on ApiException catch (e) {
      _showSnack('Failed: ${e.message}', isError: true);
    } finally {
      if (mounted) setState(() => _busyPaymentIds.remove(item.payment.paymentId));
    }
  }

  Future<void> _reject(_ReviewItem item) async {
    setState(() =>_busyPaymentIds.add(item.payment.paymentId));
    try {
      await widget.api.unmatchPayment(item.payment.paymentId);
      _showSnack('Rejected: ${item.payment.paymentId} returned to unallocated queue');
      _refresh();
    } on ApiException catch (e) {
      _showSnack('Failed: ${e.message}', isError: true);
    } finally {
      if (mounted) setState(() => _busyPaymentIds.remove(item.payment.paymentId));
    }
  }

  void _showSnack(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: isError ? AppColors.cancelText : AppColors.paidText,
      duration: const Duration(seconds: 3),
    ));
  }

  @override 
  Widget build(BuildContext context) {
    return FutureBuilder<List<_ReviewItem>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }
        final items  = snapshot.data ?? [];

        if (items.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'No fuzzy matches awaiting review.',
                    style: TextStyle(color: AppColors.graphite),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'New fuzzy matches appear here when payments arrive whose payer name doesn\'t exactly match a customer record.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.graphite, fontSize: 12),
                  ),
                ],
              ),
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async => _refresh(), 
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, i) {
              final item = items[i];
              final busy = _busyPaymentIds.contains(item.payment.paymentId);
              return _ReviewCard(
                item: item,
                busy: busy,
                onConfirm: busy ? null : () => _confirm(item),
                onReject: busy ? null : () => _reject(item),
              );
            },
          ),
        );     
      },
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final _ReviewItem item;
  final bool busy;
  final VoidCallback? onConfirm;
  final VoidCallback? onReject;

  const _ReviewCard({
    required this.item,
    required this.busy,
    required this.onConfirm,
    required this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    final p = item.payment;
    final inv = item.invoice;

    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.rule),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'PAYMENT RECEIEVED',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.5,
                  color: AppColors.graphite,
                ),
              ),
              const ReviewChip(),
            ],
          ),
          const SizedBox(height: 12),

          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 5,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p.paymentId,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: AppColors.graphite,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(p.payerName, style: const TextStyle(fontWeight: FontWeight.w500)),
                    const SizedBox(height: 6),
                    Money(p.amount, style: const TextStyle(fontSize: 16)),
                    const SizedBox(height: 4),
                    Text(
                      'due ${inv.dueDate}',
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: AppColors.graphite,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),
          const Divider(height: 1, color: AppColors.rule),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              OutlinedButton(
                onPressed: onReject,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.cancelText,
                  side: BorderSide(color: AppColors.cancelText.withOpacity(0.4)),
                ),
                child: const Text('REJECT'),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: onConfirm,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.ink,
                ),
                child: Text(busy ? 'WORKING...' : 'CONFIRM MATCH'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}