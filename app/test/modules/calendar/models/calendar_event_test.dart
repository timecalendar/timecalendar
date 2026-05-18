import 'package:flutter_test/flutter_test.dart';
import 'package:timecalendar/modules/calendar/models/calendar_event.dart';

void main() {
  group('CalendarEvent DB serialization', () {
    test('fromInternalDb then toDbMap round-trips the core fields', () {
      // Dates are stored as UTC ISO strings, so a UTC input round-trips
      // exactly through the `toLocal()` / `toUtc()` conversion.
      final dbMap = <String, dynamic>{
        'uid': 'event-42',
        'title': 'Cours de physique',
        'color': '#3a7bd5',
        'groupColor': '#e66b9a',
        'startsAt': '2024-01-08T09:00:00.000Z',
        'endsAt': '2024-01-08T10:30:00.000Z',
        'location': 'Amphi B',
        'allDay': false,
        'description': 'Optique géométrique',
        'teachers': ['Mme Martin'],
        'tags': [
          {'name': 'TD', 'color': '#00ff00', 'icon': 'book'},
        ],
        'fields': {
          'canceled': false,
          'shortDescription': 'Optique',
          'subject': 'Physique',
          'groupColor': '#e66b9a',
        },
        'exportedAt': '2024-01-07T08:00:00.000Z',
        'userCalendarId': 'calendar-9',
      };

      final roundTripped = CalendarEvent.fromInternalDb(dbMap).toDbMap();

      expect(roundTripped, equals(dbMap));
    });
  });
}
