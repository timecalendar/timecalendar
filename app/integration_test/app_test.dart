import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:timecalendar/modules/shared/test_utils/test_utils.dart';

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.fullyLive;

  // A single happy-path test, by design. `waitAppInitialized` calls
  // `app.main()`, which calls `Firebase.initializeApp` — running that twice in
  // one process throws `[core/duplicate-app]`. Because `main.dart` installs a
  // `PlatformDispatcher.onError` handler that swallows errors, that throw never
  // surfaces as a failure: a second test would just hang until the CI job's
  // wall-clock timeout. So the whole end-to-end flow lives in one `testWidgets`
  // that boots the app exactly once. A4 / TIM-7 must solve app-restart
  // isolation before adding sibling tests — see integration_test/README.md.
  testWidgets(
    'end-to-end happy path: onboarding shows, skip loads seeded schools',
    (tester) async {
      await waitAppInitialized(tester);

      // The app boots to the onboarding screen.
      expect(find.text('Consultez votre agenda'), findsOneWidget);

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
    },
    // Backstop: if the flow hangs (e.g. the app never settles against a
    // network call), fail this test in minutes instead of letting
    // `flutter test` hang until the CI job's wall-clock timeout.
    timeout: const Timeout(Duration(minutes: 4)),
  );
}
