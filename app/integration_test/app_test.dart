import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:timecalendar/modules/shared/test_utils/test_utils.dart';

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.fullyLive;

  group('end-to-end test', () {
    testWidgets("shows the onboarding screen", (tester) async {
      await waitAppInitialized(tester);

      expect(find.text("Consultez votre agenda"), findsOneWidget);
    });

    testWidgets("loads the seeded schools from the live backend", (
      tester,
    ) async {
      await waitAppInitialized(tester);

      // Skip onboarding → routes to the SelectSchool screen.
      await tester.tap(find.text('Passer'));

      // SchoolList shows a CircularProgressIndicator while the live
      // GET /schools request is in flight. pumpAndSettle never settles
      // against a running progress animation and would time out, so pump a
      // fixed step in a bounded loop until the seeded school text appears.
      // (See integration_test/README.md — this is the template for new flows.)
      final firstSchool = find.text('My Gaming Academia');
      for (var i = 0; i < 100; i++) {
        await tester.pump(const Duration(milliseconds: 300));
        if (firstSchool.evaluate().isNotEmpty) break;
      }

      // Both schools seeded by `npm run db:init` must round-trip from the
      // backend through the generated API client into the UI.
      expect(
        firstSchool,
        findsOneWidget,
        reason: 'GET /schools did not render within the ~30s budget',
      );
      expect(find.text('Université Gustave Eiffel'), findsOneWidget);
    });
  });
}
