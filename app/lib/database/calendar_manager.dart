import 'package:timecalendar/modules/calendar/repositories/selected_calendar_repository.dart';
import 'package:timecalendar/modules/calendar/models/calendar.dart';
import 'package:timecalendar/modules/calendar/models/selected_calendar.dart';

class CalendarManager {
  static Future<List<Calendar>> loadCalendars() async {
    final selectedCalendarManager = SelectedCalendarRepository();

    // Find selected calendars
    final selectedCalendars =
        await selectedCalendarManager.getSelectedCalendars();

    return selectedCalendars.map((calendar) => calendar.calendar).toList();
  }

  static Future<void> setCalendar(SelectedCalendar calendar) async {
    // To be done in multi calendar feature
    // Delete all selected calendars
    final selectedCalendarManager = SelectedCalendarRepository();
    await selectedCalendarManager.deleteAllSelectedCalendars();
    // Insert new calendar
    await selectedCalendarManager.addSelectedCalendar(calendar);
  }
}
