import 'package:flutter/material.dart';
import 'package:timecalendar/models/changelog_item.dart';

class ChangelogItemNewFeatures extends StatelessWidget {
  final ChangelogItem changelogItem;
  const ChangelogItemNewFeatures({Key? key, required this.changelogItem})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          SizedBox(
            width: 40,
            child: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Icon(
                changelogItem.icon.icon,
                size: 30,
              ),
            ),
          ),
          SizedBox(
            width: 15,
          ),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  changelogItem.title,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(
                  height: 5,
                ),
                Text(
                  changelogItem.subtitle,
                  style: TextStyle(
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
