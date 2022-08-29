import 'package:sembast/sembast.dart';
import 'package:timecalendar/modules/database/providers/migrations/002_migrate_personal_events.dart';

const CURRENT_VERSION = 2;

final Map<int, List<Future<void> Function(Database)>> migrationsByVersion = {
  2: [migratePersonalEvents]
};
