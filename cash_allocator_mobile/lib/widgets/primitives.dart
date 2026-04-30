import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class AppColors {
  static const paper    = Color(0xFFFAFAF7);
  static const ink      = Color(0xFF1A1816);
  static const graphite = Color(0xFF4A4744);
  static const rule     = Color(0xFFE8E5DF);
  static const amber    = Color(0xFFC47D00);
  static const forest   = Color(0xFF2C5E3F);
 
  static const openBg     = Color(0xFFEEF0F2);
  static const openText   = Color(0xFF3A3936);
  static const paidBg     = Color(0xFFE6EFE8);
  static const paidText   = Color(0xFF2C4A35);
  static const cancelBg   = Color(0xFFF0E6E6);
  static const cancelText = Color(0xFF5C2A2A);
  static const reviewBg   = Color(0xFFFBF0D6);
  static const reviewText = Color(0xFF6B4A08);
}

final _eur = NumberFormat.currency(locale: 'en_IE', symbol: '€', decimalDigits: 2);

class Money extends StatelessWidget {
  final double value;
  final TextStyle? style;
  const Money(this.value, {super.key, this.style});

  @override
  Widget build(BuildContext context) {
    return Text(
      _eur.format(value),
      style: (style ?? const TextStyle()).copyWith(
        fontFamily: 'monospace',
        fontFeatures: const [FontFeature.tabularFigures()],
      ),
    );
  }
}

class StatusChip extends StatelessWidget {
  final String status;
  const StatusChip(this.status, {super.key});

  @override
  Widget build(BuildContext context) {
    final (bg, fg, label) = switch (status) {
      'open' => (AppColors.openBg, AppColors.openText, 'OPEN'),
      'paid' => (AppColors.paidBg, AppColors.paidText, 'PAID'),
      'cancelled' => (AppColors.cancelBg, AppColors.cancelText, 'CANCELLED'),
      _ => (AppColors.openBg, AppColors.openText, status.toUpperCase()),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: bg),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 1.2,
          color: fg,
        ),
      ),
    );
  }
}

class ReviewChip extends StatelessWidget {
  const ReviewChip({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: const BoxDecoration(color: AppColors.reviewBg),
      child: const Text(
        'NEEDS REVIEW',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 1.2,
          color: AppColors.reviewText,
        ),
      ),
    );
  }
}

class ConfidenceBar extends StatelessWidget {
  final double value;
  const ConfidenceBar({super.key, required this.value});

  @override
  Widget build(BuildContext context) {
    final pct = (value*100).round();
    final t = ((value - 0.7) / 0.3).clamp(0.0, 1.0);
    final color = Color.lerp(AppColors.amber, AppColors.forest, t)!;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: 36,
          child: Text(
            '$pct%',
            textAlign: TextAlign.right,
            style: const TextStyle(
              fontFamily: 'monospace',
              fontSize: 12,
              color: AppColors.graphite,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Container(
          width: 80,
          height: 6,
          color: AppColors.rule,
          child: FractionallySizedBox(
            alignment: Alignment.centerLeft,
            widthFactor: value,
            child: Container(color: color),
          ),
        ),
      ],
    );
  }
}