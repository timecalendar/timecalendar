import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/modules/school/screens/school_selection/school_item.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

import '../../../../support/fixtures.dart';
import '../../../../support/pump_app.dart';
import '../../../../support/settings_provider.dart';

void main() {
  // `SchoolItem` reads `SettingsProvider` through the legacy `provider`
  // package, so the widget needs a `ChangeNotifierProvider` wrapper around a
  // provider that has already loaded its settings.
  late SettingsProvider settings;

  setUp(() async {
    settings = await loadSettingsProvider();
  });

  Widget buildSubject(SchoolForList school) =>
      ChangeNotifierProvider<SettingsProvider>.value(
        value: settings,
        child: SchoolItem(school: school, onSchoolSelect: (_) {}),
      );

  group('SchoolItem', () {
    testWidgets('renders the school name', (tester) async {
      await tester.pumpApp(buildSubject(buildSchoolForList(name: 'Sorbonne')));

      expect(find.text('Sorbonne'), findsOneWidget);
    });

    testWidgets('degrades a failed logo load to the placeholder', (
      tester,
    ) async {
      // An unreachable logo URL is the exact case the E2E backend produces.
      await tester.pumpApp(
        buildSubject(
          buildSchoolForList(imageUrl: 'http://127.0.0.1:9/missing.png'),
        ),
      );

      final fadeInImage = tester.widget<FadeInImage>(
        find.byType(FadeInImage),
      );
      expect(
        fadeInImage.imageErrorBuilder,
        isNotNull,
        reason: 'a failed school-logo load must degrade gracefully, not throw',
      );

      // Invoking the error builder must yield the placeholder asset — this is
      // the path a dead/unresolvable logo URL takes at runtime.
      final fallback = fadeInImage.imageErrorBuilder!(
        tester.element(find.byType(FadeInImage)),
        Exception('host lookup failed'),
        StackTrace.current,
      );
      expect(fallback, isA<Image>());
      expect(
        (fallback as Image).image,
        const AssetImage('assets/images/school.png'),
      );
    });
  });
}
