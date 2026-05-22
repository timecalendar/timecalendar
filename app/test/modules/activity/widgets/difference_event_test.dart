import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:timecalendar/modules/activity/widgets/difference_event.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';

import '../../../support/fixtures.dart';
import '../../../support/pump_app.dart';
import '../../../support/settings_provider.dart';

/// Regression coverage for the font_awesome_flutter v10→v11 migration.
///
/// `DifferenceEvent` stores `FontAwesomeIcons.*` constants in its `types`
/// map and used to cast them back through `IconData?`, which throws under
/// v11 because the constants are now `FaIconData`.
void main() {
  late SettingsProvider settings;

  setUp(() async {
    settings = await loadSettingsProvider();
  });

  Widget buildSubject(DifferenceEventType type) => DifferenceEvent(
    event: buildCalendarEvent(title: 'Cours de mathématiques'),
    oldEvent: buildCalendarEvent(title: 'Cours de mathématiques'),
    type: type,
  );

  group('DifferenceEvent', () {
    for (final type in DifferenceEventType.values) {
      testWidgets('renders without throwing for $type', (tester) async {
        await tester.pumpApp(
          buildSubject(type),
          overrides: [settingsProvider.overrideWith((ref) => settings)],
        );

        expect(find.byType(DifferenceEvent), findsOneWidget);
        expect(find.byType(FaIcon), findsOneWidget);
        expect(find.text('Cours de mathématiques'), findsOneWidget);
      });
    }
  });
}
