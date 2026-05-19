import 'package:flutter_test/flutter_test.dart';
import 'package:timecalendar/modules/calendar/helpers/events_for_week_view_helper.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

import '../../../support/fixtures.dart';

void main() {
  // Anchor every fixture to the week's Monday so the test is deterministic and
  // timezone-independent. `getEventsForWeekView` keeps an event only when it
  // starts strictly after the day boundary, hence the `+ 9h` offsets.
  const weekNumber = 1000;
  final monday = AppDateUtils.dayAtWeekNumber(weekNumber);

  group('getEventsForWeekView', () {
    test('returns one bucket per day of the week', () {
      final result = getEventsForWeekView([], weekNumber);

      expect(result, hasLength(7));
      expect(result.every((day) => day.isEmpty), isTrue);
    });

    test('places an event in the bucket for its start day', () {
      final mondayEvent = buildCalendarEvent(
        uid: 'monday',
        startsAt: monday.add(const Duration(hours: 9)),
        endsAt: monday.add(const Duration(hours: 10)),
      );
      final wednesdayEvent = buildCalendarEvent(
        uid: 'wednesday',
        startsAt: monday.add(const Duration(days: 2, hours: 9)),
        endsAt: monday.add(const Duration(days: 2, hours: 10)),
      );

      final result = getEventsForWeekView(
        [mondayEvent, wednesdayEvent],
        weekNumber,
      );

      expect(result[0].map((e) => e.uid), ['monday']);
      expect(result[2].map((e) => e.uid), ['wednesday']);
    });

    test('excludes events outside the requested week', () {
      final beforeWeek = buildCalendarEvent(
        uid: 'before',
        startsAt: monday.subtract(const Duration(days: 1)),
        endsAt: monday.subtract(const Duration(hours: 23)),
      );
      final afterWeek = buildCalendarEvent(
        uid: 'after',
        startsAt: monday.add(const Duration(days: 8)),
        endsAt: monday.add(const Duration(days: 8, hours: 1)),
      );

      final result = getEventsForWeekView([beforeWeek, afterWeek], weekNumber);

      expect(result.every((day) => day.isEmpty), isTrue);
    });
  });
}
