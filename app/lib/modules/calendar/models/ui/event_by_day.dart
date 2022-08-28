import 'package:timecalendar/modules/calendar/models/deprecated_event.dart';

class EventByDay {
  final DateTime day;
  final List<DeprecatedEvent?> events;

  void clear() {
    events.clear();
  }

  EventByDay(this.day, this.events);
}
