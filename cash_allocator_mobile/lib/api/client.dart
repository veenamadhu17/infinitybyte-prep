import 'dart:convert';
import 'package:http/http.dart' as http;

import '../models/invoice.dart';
import '../models/payment.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException(this.statusCode, this.message);

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiClient {
  final String baseUrl;
  final String apiKey;

  ApiClient({
    this.baseUrl = 'http://localhost:5251',
    this.apiKey = 'dev-key-change-me'
  });

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
  };

  Future<dynamic> _request(
    String method,
    String path, {
      Map<String, dynamic>? body,
    }) async {
      final uri = Uri.parse('$baseUrl$path');
      late http.Response res;

      switch (method) {
        case 'GET':
          res = await http.get(uri, headers: _headers);
          break;
        case 'POST':
          res = await http.post(
            uri,
            headers: _headers,
            body: body == null ? null : jsonEncode(body)
          );
          break;
        case 'PATCH':
          res = await http.patch(uri, headers: _headers, body: jsonEncode(body));
          break;
        default:
          throw ArgumentError('Unsupported method: $method');
      }

      if (res.statusCode >= 200 && res.statusCode < 300) {
        return res.body.isEmpty ? null : jsonDecode(res.body);
      }

      String message = 'Request failed';
      try {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        message = body['message'] ?? body['error'] ?? message;
      } catch (_) {}

      throw ApiException(res.statusCode, message);
    }

    Future<List<Invoice>> listInvoices({String? status, String? customer}) async {
      final params = <String, String>{};
      if (status != null) params['status'] = status;
      if (customer != null) params['customer'] = customer;
      params['limit'] = '100';

      final query = params.entries
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
        .join('&');
      final json = await _request('GET', '/invoices?$query') as Map<String, dynamic>;

      final items = json['items'] as List<dynamic>;
      return items.map((e) => Invoice.fromJson(e as Map<String, dynamic>)).toList();
    }

    Future<Invoice> getInvoice(String id) async {
      final json = await _request('GET', '/invoices/${Uri.encodeComponent(id)}')
        as Map<String, dynamic>;
      return Invoice.fromJson(json);
    }

    Future<Invoice> setInvoiceStatus(String id, String status) async {
      final json = await _request(
        'PATCH', 
        '/invoices/${Uri.encodeComponent(id)}/status',
        body: {'status': status}
      ) as Map<String, dynamic>;
      return Invoice.fromJson(json);
    }

    Future<List<Payment>> listPayments() async {
      final json = await _request('GET', '/payments') as Map<String, dynamic>;
      final items = json['items'] as List<dynamic>;
      return items.map((e) => Payment.fromJson(e as Map<String, dynamic>)).toList();
    }

    Future<void> unmatchPayment(String id) async {
      await _request('POST', '/payments/${Uri.encodeComponent(id)}/unmatch');
    }
}