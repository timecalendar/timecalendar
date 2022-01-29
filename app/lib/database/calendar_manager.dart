import 'package:timecalendar/database/selected_calendar_manager.dart';
import 'package:timecalendar/models/calendar.dart';
import 'package:timecalendar/models/selected_calendar.dart';

class CalendarManager {
  // static Future<void> migrateFromSqliteToSembast() async {
  //   final selectedCalendarManager = SelectedCalendarManager();

  //   // Old sqlite database
  //   // ignore: deprecated_member_use_from_same_package
  //   var db = await AppDatabase().db;
  //   final List<Map<String, dynamic>> selectedUnitsDb =
  //       await db.rawQuery('SELECT unit_id, type FROM selected_units');
  //   if (selectedUnitsDb.length > 0) {
  //     // Migrate to sembast
  //     for (final unit in selectedUnitsDb) {
  //       List<String> calendarIds = unit['unit_id'].split(';');
  //       if (unit['type'] == 'unit') {
  //         calendarIds = calendarIds.toList();
  //       }
  //       final calendar = SelectedCalendar(
  //         type: unit['type'],
  //         name: 'TimeCalendar',
  //         enabled: true,
  //         calendarIds: calendarIds,
  //       );

  //       await selectedCalendarManager.addSelectedCalendar(calendar);
  //     }

  //     // Delete old data
  //     await db.rawDelete('DELETE FROM selected_units');
  //   }
  // }

  static Future<List<Calendar>> loadCalendars() async {
    // try {
    //   await migrateFromSqliteToSembast();
    // } on Exception {}

    final selectedCalendarManager = SelectedCalendarManager();

    // Find selected calendars
    final selectedCalendars =
        await selectedCalendarManager.getSelectedCalendars();

    return selectedCalendars.map((calendar) => calendar.calendar).toList();
  }

  static Future<void> setCalendar(SelectedCalendar calendar) async {
    // To be done in multi calendar feature
    // Delete all selected calendars
    final selectedCalendarManager = SelectedCalendarManager();
    await selectedCalendarManager.deleteAllSelectedCalendars();
    // Insert new calendar
    await selectedCalendarManager.addSelectedCalendar(calendar);
  }
}
