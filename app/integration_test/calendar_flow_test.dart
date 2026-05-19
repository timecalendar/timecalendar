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

    // Open the Calendrier tab.
    await tester.tap(find.text('Calendrier'));
    await tester.pumpAndSettle();

    // The seeded events sync from POST /calendars/sync. Wait for a seeded event
    // with the bounded-pump helper — pumpAndSettle would time out against the
    // in-flight request's spinner (see integration_test/README.md). The events
    // are seeded on the current week (seed-e2e-calendar.ts), so they land in
    // the default week view.
    final seededEvent = find.text('Cours E2E Test');
    await pumpUntilFound(tester, seededEvent);
    expect(
      seededEvent,
      findsWidgets,
      reason: 'the seeded calendar event did not sync within the ~30s budget',
    );

    // Open the event → EventDetailsScreen shows its title and location.
    await tester.tap(seededEvent.first);
    await tester.pumpAndSettle();
    expect(find.text('Cours E2E Test'), findsWidgets);
    expect(
      find.text('Salle E2E'),
      findsOneWidget,
      reason: 'EventDetailsScreen did not show the seeded event location',
    );

    // Back to the calendar, then to the Profil tab. `EventDetailsScreen` has no
    // `AppBar`/`BackButton` — its header is a bare `IconButton` with a
    // `keyboard_arrow_left` icon and no tooltip — so `tester.pageBack()` (which
    // only finds a tooltipped 'Back' button or a Cupertino back button) cannot
    // be used; tap the header's back icon directly.
    await tester.tap(find.byIcon(Icons.keyboard_arrow_left));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Profil'));
    await tester.pumpAndSettle();

    // Profil → Paramètres → SettingsScreen.
    await tester.tap(find.text('Paramètres'));
    await tester.pumpAndSettle();
    expect(find.text('Paramètres'), findsWidgets);

    // Toggle the "Afficher les week-ends" preference and assert it flipped.
    // `PrefSwitch` (pref key `show_weekends`) renders a ListTile with a
    // trailing `Switch`, so the switch is found inside that tile's subtree.
    final weekendsTile = find.ancestor(
      of: find.text('Afficher les week-ends'),
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
    await tester.pumpAndSettle();
    final after = tester.widget<Switch>(weekendsSwitch).value;
    expect(
      after,
      isNot(before),
      reason: 'the "Afficher les week-ends" switch did not toggle',
    );
  }, timeout: const Timeout(Duration(minutes: 4)));
}
