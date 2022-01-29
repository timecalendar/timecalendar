import 'package:timecalendar/models/calendar.dart';

/// Deprecated
class UnitCalendar extends Calendar {
  final List<int> units;

  UnitCalendar(this.units);

  @override
  Map<String, Object> getRequestMap() {
    return {'ids': units};
  }

  @override
  List<Object> getCalendarIds() {
    return units;
  }

  @override
  String getMode() {
    return 'unit';
  }
}
