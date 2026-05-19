import 'package:flutter_test/flutter_test.dart';
import 'package:timecalendar/modules/calendar/helpers/events_for_planning_view_helper.dart';

import '../../../support/fixtures.dart';

void main() {
  group('getEventsForPlanningView', () {
    test('returns an empty list for empty input', () {
      expect(getEventsForPlanningView([]), isEmpty);
    });

    test('groups events into one EventsByDay entry per day', () {
      final morning = buildCalendarEvent(
        uid: 'day1-morning',
        startsAt: DateTime(2024, 1, 1, 9, 0),
        endsAt: DateTime(2024, 1, 1, 10, 0),
      );
      final afternoon = buildCalendarEvent(
        uid: 'day1-afternoon',
        startsAt: DateTime(2024, 1, 1, 14, 0),
        endsAt: DateTime(2024, 1, 1, 15, 0),
      );
      final nextDay = buildCalendarEvent(
        uid: 'day2',
        startsAt: DateTime(2024, 1, 2, 9, 0),
        endsAt: DateTime(2024, 1, 2, 10, 0),
      );

      final result = getEventsForPlanningView([morning, afternoon, nextDay]);

      expect(result, hasLength(2));
      expect(result[0].events.map((e) => e.uid), [
        'day1-morning',
        'day1-afternoon',
      ]);
      expect(result[1].events.map((e) => e.uid), ['day2']);
    });

    test('sorts the input by startsAt before grouping', () {
      final first = buildCalendarEvent(
        uid: 'first',
        startsAt: DateTime(2024, 1, 1, 9, 0),
        endsAt: DateTime(2024, 1, 1, 10, 0),
      );
      final second = buildCalendarEvent(
        uid: 'second',
        startsAt: DateTime(2024, 1, 1, 11, 0),
        endsAt: DateTime(2024, 1, 1, 12, 0),
      );

      final result = getEventsForPlanningView([second, first]);

      expect(result, hasLength(1));
      expect(result[0].events.map((e) => e.uid), ['first', 'second']);
    });
  });
}
