import 'package:flutter_test/flutter_test.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:timecalendar/modules/activity/models/calendar_log_event.dart'
    as model;
import 'package:timecalendar/modules/activity/widgets/calendar_log_event.dart';

import '../../../support/pump_app.dart';

/// Regression coverage for the font_awesome_flutter v10→v11 migration.
///
/// Under v11 every `FontAwesomeIcons.X` constant is a `FaIconData` (not an
/// `IconData`), so the previous `Icon(types[type]!['icon'] as IconData?)`
/// pattern blew up at runtime for every entry of this widget. Pumping all
/// three [CalendarLogEventType] values exercises that exact path.
void main() {
  group('CalendarLogEventWidget', () {
    final event = model.CalendarLogEvent(
      uid: 'event-1',
      title: 'Cours de mathématiques',
      startsAt: DateTime(2024, 1, 1, 9, 0),
      endsAt: DateTime(2024, 1, 1, 10, 0),
      location: 'Salle A1',
    );

    for (final type in CalendarLogEventType.values) {
      testWidgets('renders without throwing for $type', (tester) async {
        await tester.pumpApp(
          CalendarLogEventWidget(event: event, type: type),
        );

        expect(find.byType(CalendarLogEventWidget), findsOneWidget);
        expect(find.byType(FaIcon), findsOneWidget);
        expect(find.text('Cours de mathématiques'), findsOneWidget);
      });
    }
  });
}
