import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:timecalendar/modules/onboarding/screens/onboarding_screen.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';

import '../../../support/pump_app.dart';
import '../../../support/settings_provider.dart';

void main() {
  // `OnboardingScreen.initState` reads `SettingsProvider` through Riverpod, so
  // the test overrides `settingsProvider` with a provider that has already
  // loaded its settings.
  late SettingsProvider settings;

  setUp(() async {
    settings = await loadSettingsProvider();
  });

  Widget buildSubject() => OnboardingScreen();

  group('OnboardingScreen', () {
    testWidgets('renders the first page and its navigation controls', (
      tester,
    ) async {
      await tester.pumpApp(
        buildSubject(),
        overrides: [settingsProvider.overrideWith((ref) => settings)],
      );
      await tester.pumpAndSettle();

      expect(find.text('Consultez votre agenda'), findsOneWidget);
      expect(find.text('Passer'), findsOneWidget);
      expect(find.text('Suivant'), findsOneWidget);

      final pageView = tester.widget<PageView>(find.byType(PageView));
      expect(pageView.controller!.page, 0);
    });

    testWidgets('advances to the second page when "Suivant" is tapped', (
      tester,
    ) async {
      await tester.pumpApp(
        buildSubject(),
        overrides: [settingsProvider.overrideWith((ref) => settings)],
      );
      await tester.pumpAndSettle();

      await tester.tap(find.widgetWithText(TextButton, 'Suivant'));
      await tester.pumpAndSettle();

      final pageView = tester.widget<PageView>(find.byType(PageView));
      expect(pageView.controller!.page, 1);
    });
  });
}
