import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:timecalendar/modules/shared/test_utils/test_utils.dart';

/// E2E smoke flow: **view calendar** + **event details** + **settings**.
///
/// One flow per entrypoint file, run as its own `flutter test` process — see
/// `integration_test/README.md`. A `UserCalendar` is seeded into the local DB
/// before boot, so the splash controller routes straight to `TabsScreen`; the
/// app then syncs the seeded events over `POST /calendars/sync`.
///
/// Every wait uses the bounded [pumpUntilFound] helper, never `pumpAndSettle`:
/// `TabsScreen` and the calendar screen run loading spinners (perpetual
/// animations) while the sync is in flight, and `pumpAndSettle` never settles
/// against those — it hangs to the test timeout (see `integration_test/
/// README.md`).
///
/// These constants mirror `server/src/scripts/seed-e2e-calendar.ts`
/// (`E2E_CALENDAR_ID` / `E2E_CALENDAR_TOKEN`). The id must match the backend
/// `Calendar.id` so the synced events — keyed by `userCalendarId` — render.
const _e2eCalendarId = 'e2e0e2e0-0000-4000-8000-000000000001';
const _e2eCalendarToken = 'e2e-smoke-calendar';

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.fullyLive;

  testWidgets('view calendar, open an event, toggle a setting', (
    tester,
  ) async {
    // Seed a local calendar before boot → splash routes to TabsScreen.
    await resetLocalAppState();
    await seedUserCalendar(id: _e2eCalendarId, token: _e2eCalendarToken);
    await waitAppInitialized(tester);

    // The seeded calendar boots the app into TabsScreen, whose bottom
    // navigation bar shows the three tab labels.
    await pumpUntilFound(tester, find.text('Calendrier'));
    // Diagnostic: which screen did the app actually land on?
    debugPrint(
      'E2E-DIAG calendar boot — '
      'TabsScreen(Calendrier)=${find.text('Calendrier').evaluate().length} '
      'Onboarding=${find.text('Consultez votre agenda').evaluate().length}',
    );
    expect(
      find.text('Calendrier'),
      findsWidgets,
      reason: 'the app did not boot to TabsScreen with the seeded calendar',
    );

    // Open the Calendrier tab.
    await tester.tap(find.text('Calendrier'));

    // The seeded events sync from POST /calendars/sync; wait for one to render.
    // They are seeded on the current week (seed-e2e-calendar.ts), so they land
    // in the default week view.
    final seededEvent = find.text('Cours E2E Test');
    await pumpUntilFound(tester, seededEvent);
    expect(
      seededEvent,
      findsWidgets,
      reason: 'the seeded calendar event did not sync within the ~30s budget',
    );

    // Open the event → EventDetailsScreen shows its title and location.
    await tester.tap(seededEvent.first);
    final eventLocation = find.text('Salle E2E');
    await pumpUntilFound(tester, eventLocation);
    expect(find.text('Cours E2E Test'), findsWidgets);
    expect(
      eventLocation,
      findsOneWidget,
      reason: 'EventDetailsScreen did not show the seeded event location',
    );

    // Back to the calendar. `EventDetailsScreen` has no `AppBar`/`BackButton` —
    // its header is a bare `IconButton` with a `keyboard_arrow_left` icon and
    // no tooltip — so `tester.pageBack()` (which only finds a tooltipped 'Back'
    // button or a Cupertino back button) cannot be used; tap the icon directly.
    await tester.tap(find.byIcon(Icons.keyboard_arrow_left));
    await pumpUntilFound(tester, find.text('Profil'));

    // Profil tab → Paramètres → SettingsScreen.
    await tester.tap(find.text('Profil'));
    await pumpUntilFound(tester, find.text('Paramètres'));
    await tester.tap(find.text('Paramètres'));

    // Toggle the "Afficher les week-ends" preference and assert it flipped.
    // `PrefSwitch` (pref key `show_weekends`) renders a ListTile with a
    // trailing `Switch`, so the switch is found inside that tile's subtree.
    final weekendsText = find.text('Afficher les week-ends');
    await pumpUntilFound(tester, weekendsText);
    expect(
      weekendsText,
      findsOneWidget,
      reason: 'the SettingsScreen did not open',
    );

    final weekendsTile = find.ancestor(
      of: weekendsText,
      matching: find.byType(ListTile),
    );
    expect(weekendsTile, findsOneWidget);

    final weekendsSwitch = find.descendant(
      of: weekendsTile,
      matching: find.byType(Switch),
    );
    expect(weekendsSwitch, findsOneWidget);

    final before = tester.widget<Switch>(weekendsSwitch).value;
    await tester.tap(weekendsSwitch);
    // Bounded pump for the toggle animation — not pumpAndSettle.
    for (var i = 0; i < 10; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
    final after = tester.widget<Switch>(weekendsSwitch).value;
    expect(
      after,
      isNot(before),
      reason: 'the "Afficher les week-ends" switch did not toggle',
    );
  }, timeout: const Timeout(Duration(minutes: 4)));
}
