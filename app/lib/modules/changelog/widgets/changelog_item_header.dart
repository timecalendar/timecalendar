import 'package:flutter/material.dart';
import 'package:timecalendar/modules/changelog/models/changelog.dart';

class ChangelogItemHeader extends StatelessWidget {
  final Changelog? changelog;
  const ChangelogItemHeader({Key? key, required this.changelog})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 15.0),
      child: Text(
        'Version ' + changelog!.version,
        style: TextStyle(fontSize: 18),
      ),
    );
  }
}
