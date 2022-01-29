import 'package:flutter/material.dart';
import 'package:timecalendar/models/list_item.dart';

class UnitHeadingItem extends ListItem {
  final String title;

  UnitHeadingItem(this.title);

  @override
  Widget buildItem(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: 15,
        vertical: 5,
      ),
      child: Text(
        this.title,
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
