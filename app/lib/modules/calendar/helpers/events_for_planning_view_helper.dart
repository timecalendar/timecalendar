import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/calendar/models/ui/events_by_day.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

List<EventsByDay> getEventsForPlanningView(List<EventInterface> events) {
  var dayEvents = events.toList();
  dayEvents.sort((a, b) {
    return a.startsAt.compareTo(b.startsAt);
  });

  if (events.length == 0) return [];

  List<EventsByDay> dayEventsList = [];
  var currentDay = dayEvents[0].endsAt;
  List<EventInterface> currentDayEvents = [];
  dayEvents.forEach((event) {
    if (!AppDateUtils.isSameDate(event.startsAt, currentDay)) {
      dayEventsList.add(EventsByDay(currentDay, currentDayEvents));
      currentDayEvents = [];
    }
    currentDay = event.endsAt;
    currentDayEvents.add(event);
  });
  dayEventsList.add(EventsByDay(currentDay, currentDayEvents));
  return dayEventsList;
}
