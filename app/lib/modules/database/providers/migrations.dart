import 'package:sembast/sembast.dart';
import 'package:timecalendar/modules/database/providers/migrations/002_migrate_personal_events.dart';
import 'package:timecalendar/modules/database/providers/migrations/003_convert_user_calendar_to_record.dart';

const CURRENT_VERSION = 3;

final Map<int, List<Future<void> Function(Database)>> migrationsByVersion = {
  2: [migratePersonalEvents],
  3: [converUserCalendarsToRecord],
};
