import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:timecalendar/modules/shared/test_utils/test_utils.dart';

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.fullyLive;

  // One happy-path flow, one `testWidgets` — see design.md Decision 5.
  // `app.main()` boots process-wide singletons (`SettingsProvider`,
  // `SimpleDatabase`, the Firebase app). A second `testWidgets` calling
  // `app.main()` again re-enters that init against already-open singletons
  // and never reaches a fresh, settled state — it hangs the run. So
  // onboarding and the seeded-schools round-trip are asserted in a single
  // launch. A4 (TIM-7) owns cross-test isolation before adding more flows.
  testWidgets("end-to-end: onboarding then seeded schools load", (
    tester,
  ) async {
    await waitAppInitialized(tester);

    // The app boots into onboarding on first launch (no calendar stored).
    expect(find.text("Consultez votre agenda"), findsOneWidget);

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
}
