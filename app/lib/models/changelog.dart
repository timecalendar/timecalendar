import 'package:timecalendar/models/changelog_item.dart';

class Changelog {
  final String version;
  final List<ChangelogItem> changelogItems;

  const Changelog({
    required this.version,
    required this.changelogItems,
  });

  @override
  String toString() {
    return 'version: $version, changelogItems: $changelogItems';
  }
}
