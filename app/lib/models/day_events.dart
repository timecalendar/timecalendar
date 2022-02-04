import 'package:timecalendar/models/calendar_event.dart';
import 'package:timecalendar/models/event.dart';

class DayEvents {
  final List<CalendarEvent>? events;

  DayEvents._({ this.events });

  factory DayEvents(List<Event> events) {
    List<CalendarEvent> calendarEvents = [];

    for (Event event in events) {
      calendarEvents.add(CalendarEvent(event: event));
    }

    return DayEvents._(events: calendarEvents);
  }
}
