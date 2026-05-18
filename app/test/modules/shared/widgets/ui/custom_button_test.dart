import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:timecalendar/modules/shared/widgets/ui/custom_button.dart';

import '../../../../support/pump_app.dart';

/// Exemplar **widget test**.
///
/// Uses the shared `pumpApp` harness to render the widget with the app theme,
/// then drives it with the `WidgetTester` and asserts on the widget tree.
/// Follow this shape for widgets: pump via `pumpApp`, find, interact, expect.
void main() {
  group('CustomButton', () {
    testWidgets('renders its label', (tester) async {
      await tester.pumpApp(
        CustomButton(text: 'Valider', onPressed: () {}),
      );

      expect(find.text('Valider'), findsOneWidget);
    });

    testWidgets('invokes onPressed when tapped', (tester) async {
      var taps = 0;
      await tester.pumpApp(
        CustomButton(text: 'Valider', onPressed: () => taps++),
      );

      await tester.tap(find.byType(CustomButton));
      await tester.pump();

      expect(taps, 1);
    });

    testWidgets('ignores taps and shows a spinner while loading', (
      tester,
    ) async {
      var taps = 0;
      await tester.pumpApp(
        CustomButton(
          text: 'Valider',
          loading: true,
          onPressed: () => taps++,
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      await tester.tap(find.byType(CustomButton));
      await tester.pump();

      expect(taps, 0);
    });
  });
}
