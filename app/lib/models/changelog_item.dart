import 'package:flutter/material.dart';

class ChangelogItem {
  final String title;
  final String subtitle;
  final Icon icon;

  const ChangelogItem({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  @override
  String toString() {
    return 'title: $title, subtitle: $subtitle, icon: ${icon.semanticLabel}';
  }
}
