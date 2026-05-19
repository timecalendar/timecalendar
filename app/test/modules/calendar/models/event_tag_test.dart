import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:timecalendar/modules/calendar/models/event_tag.dart';

void main() {
  group('EventTag', () {
    test('fromDb then toDbMap round-trips name, color and icon', () {
      final dbMap = <String, dynamic>{
        'name': 'Travaux dirigés',
        'color': '#00ff00',
        'icon': 'book',
      };

      final roundTripped = EventTag.fromDb(dbMap).toDbMap();

      expect(roundTripped, equals(dbMap));
    });

    test('resolves iconData from the icon string', () {
      final tag = EventTag.fromDb(const {
        'name': 'Travaux dirigés',
        'color': '#00ff00',
        'icon': 'book',
      });

      expect(tag.iconData, isA<IconData>());
      expect(tag.iconData, Icons.book);
    });
  });
}
