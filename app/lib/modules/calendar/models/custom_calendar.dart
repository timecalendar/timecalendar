import 'package:timecalendar/modules/calendar/models/deprecated_calendar.dart';

class CustomCalendar extends DeprecatedCalendar {
  final List<String?> customCalendars;

  CustomCalendar(this.customCalendars);

  @override
  List<Object?> getCalendarIds() {
    return customCalendars;
  }

  @override
  String getMode() {
    return 'custom';
  }

  @override
  Map<String, Object> getRequestMap() {
    return {'customCalendars': customCalendars};
  }
}
