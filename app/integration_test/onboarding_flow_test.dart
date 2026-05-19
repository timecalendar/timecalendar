import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:timecalendar/modules/shared/test_utils/test_utils.dart';

/// E2E smoke flow: **onboarding** + **add school**.
///
/// One flow per entrypoint file, run as its own `flutter test` process — see
/// `integration_test/README.md`. With an empty local database the app boots to
/// the onboarding screen; this flow walks the onboarding pages, loads the
/// seeded schools over the live backend, and asserts that picking a school
/// advances the native add-school assistant flow.
void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.fullyLive;

  testWidgets('onboarding walkthrough then add-school entry', (tester) async {
    // Empty local DB → the splash controller routes to onboarding.
    await resetLocalAppState();
    await waitAppInitialized(tester);

    // Onboarding page 1.
    expect(find.text('Consultez votre agenda'), findsOneWidget);

    // Page 2 — advance with "Suivant".
    await tester.tap(find.text('Suivant'));
    await tester.pumpAndSettle();
    expect(find.text('Recevez des notifications'), findsOneWidget);

    // Page 3 — advance with "Suivant"; the last page has no "Suivant" button,
    // it shows the "C'est parti !" call-to-action in a bottom sheet instead.
    await tester.tap(find.text('Suivant'));
    await tester.pumpAndSettle();
    expect(find.text('Bienvenue dans TimeCalendar !'), findsOneWidget);

    // Finish onboarding → routes to the SelectSchool screen.
    await tester.tap(find.text('C\'est parti !'));

    // SchoolList shows a CircularProgressIndicator while GET /schools is in
    // flight, so wait for the seeded school text with the bounded-pump helper
    // rather than pumpAndSettle — the spinner is a perpetual animation that
    // pumpAndSettle never settles against (see integration_test/README.md).
    final firstSchool = find.text('My Gaming Academia');
    await pumpUntilFound(tester, firstSchool);

    // Both schools seeded by `npm run db:init` must round-trip from the backend
    // through the generated API client into the UI.
    expect(
      firstSchool,
      findsOneWidget,
      reason: 'GET /schools did not render within the ~30s budget',
    );
    expect(find.text('Université Gustave Eiffel'), findsOneWidget);

    // Tap a school → the add-school assistant flow advances. `My Gaming
    // Academia` uses the `generic` assistant (requireCalendarName: true), so
    // the next native screen is AddGradeScreen. The assistant WebView itself is
    // out of scope (see design.md Decision 2) — this only asserts the native
    // routing advanced.
    await tester.tap(firstSchool);
    await pumpUntilFound(tester, find.text('Importer votre calendrier'));
    expect(
      find.text('Importer votre calendrier'),
      findsOneWidget,
      reason: 'tapping a school did not advance to AddGradeScreen',
    );
  }, timeout: const Timeout(Duration(minutes: 4)));
}
