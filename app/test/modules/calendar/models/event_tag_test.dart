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

    test(
      'falls back to a Material IconData when the icon name is unknown',
      () {
        // Regression: under font_awesome_flutter v11 the previous
        // FontAwesomeIcons.graduationCap fallback returned a FaIconData,
        // which made `late final IconData iconData = …` throw a TypeError
        // for every tag whose icon name was not in IconsMap.
        final tag = EventTag.fromDb(const {
          'name': 'Untracked',
          'color': '#00ff00',
          'icon': 'completely-unknown-zzz',
        });

        expect(tag.iconData, isA<IconData>());
        expect(tag.iconData, Icons.school);
      },
    );
  });
}
