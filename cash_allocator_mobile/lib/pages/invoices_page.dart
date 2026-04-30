import 'package:flutter/material.dart';
import '../api/client.dart';
import '../models/invoice.dart';
import '../widgets/primitives.dart';

class InvoicesPage extends StatefulWidget {
  final ApiClient api;
  const InvoicesPage({super.key, required this.api});

  @override
  State<InvoicesPage> createState() => _InvoicesPageState();
}

class _InvoicesPageState extends State<InvoicesPage> {
  late Future<List<Invoice>> _future;
  String? _statusFilter;
  String _customerSearch = '';

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Invoice>> _load() {
    return widget.api.listInvoices(
      status: _statusFilter,
      customer: _customerSearch.isEmpty ? null : _customerSearch,
    );
  }

  void _refresh() {
    setState(() {
      _future = _load();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(
                    hintText: 'Search Customer...',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    isDense: true, 
                  ),
                  onSubmitted: (value) {
                    setState(() {
                      _customerSearch = value;
                      _future = _load();
                    });
                  },
                ),
              ),
              const SizedBox(width: 12),
              DropdownButton<String?>(
                value: _statusFilter,
                hint: const Text('All statuses'),
                items: const [
                  DropdownMenuItem(value: null, child: Text('All statuses')),
                  DropdownMenuItem(value: 'open', child: Text('Open')),
                  DropdownMenuItem(value: 'paid', child: Text('Paid')),
                  DropdownMenuItem(value: 'cancelled', child: Text('Cancelled')),
                ],
                onChanged: (value) {
                  setState(() {
                    _statusFilter = value;
                    _future = _load();
                  });
                },
              ),
            ],
          ),
        ),

        Expanded(
          child: FutureBuilder<List<Invoice>>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return _ErrorState(
                  message: 'Failed to load invoices: ${snapshot.error}',
                  onRetry: _refresh,
                );
              }
              final invoices = snapshot.data ?? [];
              if (invoices.isEmpty) {
                return const Center(
                  child: Text(
                    'No invoices match these filters.',
                    style: TextStyle(color: AppColors.graphite),
                  ),
                );
              }
              return RefreshIndicator(
                onRefresh: () async => _refresh(),
                child: ListView.separated(
                  itemCount: invoices.length,
                  separatorBuilder: (_, __) => const Divider(height: 1, color: AppColors.rule),
                  itemBuilder: (context, i) => _InvoiceTile(invoice: invoices[i]),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _InvoiceTile extends StatelessWidget {
  final Invoice invoice;
  const _InvoiceTile({required this.invoice});

  @override 
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      title: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              invoice.invoiceId,
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 13,
                color: AppColors.graphite,
              ),
            ),
          ),
          Expanded(
            flex: 4,
            child: Text(
              invoice.customer,
              style: const TextStyle(fontWeight: FontWeight.w500),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Expanded(
            flex: 4,
            child: Align(
              alignment: Alignment.centerRight,
              child: Money(invoice.amount),
            ),
          ),
          const SizedBox(width: 12),
          StatusChip(invoice.status),
        ],
      ),
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 2),
        child: Text(
          'due ${invoice.dueDate}',
          style: const TextStyle(
            fontFamily: 'monospace',
            fontSize: 11,
            color: AppColors.graphite,
          ),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.cancelText),
            ),
            const SizedBox(height: 12),
            FilledButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}