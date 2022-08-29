import 'package:timecalendar/modules/calendar/models/event_interface.dart';

class EventsByDay {
  final DateTime day;
  final List<EventInterface> events;

  EventsByDay(this.day, this.events);
}
