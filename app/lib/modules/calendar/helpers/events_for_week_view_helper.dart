import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

List<List<EventInterface>> getEventsForWeekView(
  List<EventInterface> events,
  int weekNumber,
) {
  var start = AppDateUtils.dayAtWeekNumber(weekNumber);
  var end = start.add(Duration(days: 7));

  var eventsInTheWeek = events
      .where(
        (event) =>
            start.isBefore(event.startsAt) && event.startsAt.isBefore(end),
      )
      .toList();

  final List<List<EventInterface>> dayEvents = [];
  for (var day = 0; day < 7; day++) {
    var startOfDay = start.add(Duration(days: day));
    var endOfDay = startOfDay.add(Duration(days: 1));
    var currentDayEvents = [];
    currentDayEvents.addAll(
      eventsInTheWeek
          .where(
            (event) =>
                startOfDay.isBefore(event.startsAt) &&
                event.startsAt.isBefore(endOfDay),
          )
          .toList(),
    );
    dayEvents.add(List<EventInterface>.from(currentDayEvents));
  }

  return dayEvents;
}
