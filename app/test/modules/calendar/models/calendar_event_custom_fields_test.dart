import 'package:flutter_test/flutter_test.dart';
import 'package:timecalendar/modules/calendar/models/calendar_event_custom_fields.dart';

void main() {
  group('CalendarEventCustomFields', () {
    test('fromInternalDb then toDbMap round-trips every field', () {
      final dbMap = <String, dynamic>{
        'canceled': true,
        'shortDescription': 'Cours annulé',
        'subject': 'Mathématiques',
        'groupColor': '#e66b9a',
      };

      final roundTripped =
          CalendarEventCustomFields.fromInternalDb(dbMap).toDbMap();

      expect(roundTripped, equals(dbMap));
    });
  });
}
