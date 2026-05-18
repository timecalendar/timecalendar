import 'package:flutter_test/flutter_test.dart';
import 'package:timecalendar/modules/calendar/helpers/events_helper.dart';

import '../../../support/fixtures.dart';

void main() {
  group('eventsOverlap', () {
    test('is true when two events share part of their time range', () {
      final event1 = buildCalendarEvent(
        startsAt: DateTime(2024, 1, 1, 9, 0),
        endsAt: DateTime(2024, 1, 1, 10, 30),
      );
      final event2 = buildCalendarEvent(
        startsAt: DateTime(2024, 1, 1, 10, 0),
        endsAt: DateTime(2024, 1, 1, 11, 0),
      );

      expect(eventsOverlap(event1, event2), isTrue);
      expect(eventsOverlap(event2, event1), isTrue);
    });

    test('is false for disjoint events', () {
      final event1 = buildCalendarEvent(
        startsAt: DateTime(2024, 1, 1, 9, 0),
        endsAt: DateTime(2024, 1, 1, 10, 0),
      );
      final event2 = buildCalendarEvent(
        startsAt: DateTime(2024, 1, 1, 11, 0),
        endsAt: DateTime(2024, 1, 1, 12, 0),
      );

      expect(eventsOverlap(event1, event2), isFalse);
      expect(eventsOverlap(event2, event1), isFalse);
    });
  });

  group('eventStartsAtHour / eventEndsAtHour', () {
    test('return the fractional hour of the event boundaries', () {
      final event = buildCalendarEvent(
        startsAt: DateTime(2024, 1, 1, 9, 30),
        endsAt: DateTime(2024, 1, 1, 11, 15),
      );

      expect(eventStartsAtHour(event), 9.5);
      expect(eventEndsAtHour(event), 11.25);
    });

    test('return a whole number when the event starts on the hour', () {
      final event = buildCalendarEvent(
        startsAt: DateTime(2024, 1, 1, 8, 0),
        endsAt: DateTime(2024, 1, 1, 10, 0),
      );

      expect(eventStartsAtHour(event), 8.0);
      expect(eventEndsAtHour(event), 10.0);
    });
  });
}
