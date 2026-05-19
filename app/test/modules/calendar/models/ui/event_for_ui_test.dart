import 'package:flutter_test/flutter_test.dart';
import 'package:timecalendar/modules/calendar/models/ui/event_for_ui.dart';

import '../../../../support/fixtures.dart';

void main() {
  group('EventForUI.listFromEvents', () {
    test('gives each non-overlapping event a single full-width column', () {
      final morning = buildCalendarEvent(
        startsAt: DateTime(2024, 1, 1, 9, 0),
        endsAt: DateTime(2024, 1, 1, 10, 0),
      );
      final afternoon = buildCalendarEvent(
        startsAt: DateTime(2024, 1, 1, 14, 0),
        endsAt: DateTime(2024, 1, 1, 15, 0),
      );

      final result = EventForUI.listFromEvents([morning, afternoon]);

      for (final event in result) {
        expect(event.columns, 1);
        expect(event.startColumn, 0);
        expect(event.endColumn, 1);
      }
    });

    test('places two overlapping events in distinct columns', () {
      final first = buildCalendarEvent(
        startsAt: DateTime(2024, 1, 1, 9, 0),
        endsAt: DateTime(2024, 1, 1, 10, 30),
      );
      final second = buildCalendarEvent(
        startsAt: DateTime(2024, 1, 1, 10, 0),
        endsAt: DateTime(2024, 1, 1, 11, 0),
      );

      final result = EventForUI.listFromEvents([first, second]);

      expect(result.every((e) => e.columns == 2), isTrue);
      expect(
        result.map((e) => e.startColumn).toSet(),
        {0, 1},
        reason: 'overlapping events must occupy different columns',
      );
    });

    test('orders the result by event startsAt', () {
      final early = buildCalendarEvent(
        uid: 'early',
        startsAt: DateTime(2024, 1, 1, 9, 0),
        endsAt: DateTime(2024, 1, 1, 10, 0),
      );
      final late = buildCalendarEvent(
        uid: 'late',
        startsAt: DateTime(2024, 1, 1, 11, 0),
        endsAt: DateTime(2024, 1, 1, 12, 0),
      );

      final result = EventForUI.listFromEvents([late, early]);

      expect(result.map((e) => e.event.uid), ['early', 'late']);
    });
  });
}
