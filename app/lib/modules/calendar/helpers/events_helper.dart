import 'package:timecalendar/modules/calendar/models/event_interface.dart';

bool eventsOverlap(EventInterface event1, EventInterface event2) {
  return event1.startsAt.isBefore(event2.endsAt) &&
      event2.startsAt.isBefore(event1.endsAt);
}

double eventStartsAtHour(EventInterface event) {
  return event.startsAt.hour + (event.startsAt.minute * 10 / 6) / 100;
}

double eventEndsAtHour(EventInterface event) {
  return event.endsAt.hour + (event.endsAt.minute * 10 / 6) / 100;
}
