import 'package:flutter/material.dart';
import 'api/client.dart';
import 'pages/invoices_page.dart';
import 'pages/review_page.dart';
import 'widgets/primitives.dart';

void main() {
  runApp(const CashAllocatorApp());
}

class CashAllocatorApp extends StatelessWidget {
  const CashAllocatorApp({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ApiClient();

    return MaterialApp(
      title: 'Cash Allocator',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.paper,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.amber,
          surface: AppColors.paper,
          background: AppColors.paper,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.paper,
          surfaceTintColor: Colors.transparent,
          foregroundColor: AppColors.ink,
          elevation: 0,
          centerTitle: false,
        ),
        textTheme: const TextTheme(
          bodyMedium: TextStyle(color: AppColors.ink, fontSize: 14),
          titleLarge: TextStyle(color: AppColors.ink, fontWeight: FontWeight.w600),
        ),
      ),
      home: HomeScreen(api: api),
    );
  }
}

class HomeScreen extends StatelessWidget {
  final ApiClient api;
  const HomeScreen({super.key, required this.api});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                'Cash Allocator',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
              ),
              SizedBox(width: 8),
              Text(
                'V0.1',
                style: TextStyle(
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: AppColors.graphite,
                ),
              ),
            ],
          ),
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(48),
            child: Column(
              children: [
                TabBar(
                  isScrollable: true,
                  labelColor: AppColors.ink,
                  unselectedLabelColor: AppColors.graphite,
                  indicatorColor: AppColors.ink,
                  labelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
                  tabs: [
                    Tab(text: 'Invoices'),
                    Tab(text: 'Needs review'),
                  ],
                ),
                Divider(height: 1, color: AppColors.rule),
              ],
            ),
          ),
        ),
        body: TabBarView(
          children: [
            InvoicesPage(api: api),
            ReviewPage(api: api),
          ],
        ),
      ),
    );
  }
}