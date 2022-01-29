import 'package:timecalendar/models/event.dart';

class EventByDay {
  final DateTime day;
  final List<Event> events;

  void clear() {
    events.clear();
  }

  EventByDay(this.day, this.events);
}
