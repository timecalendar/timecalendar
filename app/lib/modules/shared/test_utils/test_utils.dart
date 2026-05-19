import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
// `Finder` is hidden: sembast also exports one, and `pumpUntilFound` takes the
// `flutter_test` `Finder`.
import 'package:sembast/sembast.dart' hide Finder;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timecalendar/main.dart' as app;
import 'package:timecalendar/modules/calendar/models/user_calendar.dart';
import 'package:timecalendar/modules/calendar/repositories/calendar_event_repository.dart';
import 'package:timecalendar/modules/calendar/repositories/user_calendar_repository.dart';
import 'package:timecalendar/modules/database/providers/simple_database.dart';
import 'package:timecalendar/modules/hidden_event/repositories/hidden_event_repository.dart';
import 'package:timecalendar/modules/personal_event/repositories/personal_event_repository.dart';

Future<void> waitAppInitialized(WidgetTester tester) async {
  await app.main();
  await tester.pumpAndSettle(Duration(seconds: 2)); // splash screen
}

/// Pumps a fixed step in a bounded loop until [finder] matches at least one
/// widget, then returns. Use this — never `pumpAndSettle` — for any frame that
/// waits on a live backend round-trip: a `CircularProgressIndicator` is a
/// running animation, so `pumpAndSettle` never settles and times out instead.
///
/// The default budget is `100 × 300ms ≈ 30s`. It does not assert; the caller
/// follows the call with its own `expect(finder, ...)` so a miss fails with a
/// flow-specific `reason`. See `integration_test/README.md`.
Future<void> pumpUntilFound(
  WidgetTester tester,
  Finder finder, {
  Duration step = const Duration(milliseconds: 300),
  int maxPumps = 100,
}) async {
  for (var i = 0; i < maxPumps; i++) {
    await tester.pump(step);
    if (finder.evaluate().isNotEmpty) break;
  }
}

/// Clears all local app state — SharedPreferences and the Sembast store — so an
/// E2E flow never inherits a previous run's data. CI runs on a fresh emulator,
/// but this keeps local re-runs of `run_e2e.sh` deterministic.
///
/// Call this *before* `waitAppInitialized` (and before [seedUserCalendar]).
Future<void> resetLocalAppState() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Clear the real platform SharedPreferences store the app will read on boot.
  final prefs = await SharedPreferences.getInstance();
  await prefs.clear();

  // `SimpleDatabase` is a process-wide singleton; opening it here is harmless —
  // `app.main()` reopens the same on-disk database, and the data written below
  // survives the reopen.
  final db = SimpleDatabase();
  await db.init();
  for (final storeName in _appStoreNames) {
    await stringMapStoreFactory.store(storeName).delete(db.db);
  }
}

/// Inserts a [UserCalendar] into the local Sembast store so the app boots
/// straight into `TabsScreen` (`use_splash_controller.dart` routes there when
/// the local DB has at least one calendar).
///
/// The [id] must match the backend `Calendar.id` of the calendar addressed by
/// [token]: `eventsForViewProvider` filters events by `userCalendarId`, which is
/// the backend calendar id, so the seeded events only render when they agree.
/// For the E2E smoke calendar use the constants exported by the backend
/// `seed-e2e-calendar.ts` (`E2E_CALENDAR_ID` / `E2E_CALENDAR_TOKEN`).
Future<void> seedUserCalendar({
  required String id,
  required String token,
  String name = 'Calendrier E2E Test',
}) async {
  final db = SimpleDatabase();
  await db.init();

  final calendar = UserCalendar(
    id: id,
    name: name,
    token: token,
    schoolName: null,
    schoolId: null,
    lastUpdatedAt: DateTime.now(),
    createdAt: DateTime.now(),
  );

  // Mirrors `UserCalendarRepository.addUserCalendar` — same store, same record
  // key, same `toDbMap()` shape — without needing a Riverpod container.
  await stringMapStoreFactory
      .store(UserCalendarRepository.STORE_NAME)
      .record(calendar.id)
      .put(db.db, calendar.toDbMap());
}

/// Sembast stores written by the app that an E2E flow should start clean.
const _appStoreNames = <String>[
  UserCalendarRepository.STORE_NAME,
  CalendarEventRepository.STORE_NAME,
  HiddenEventRepository.STORE_NAME,
  PersonalEventRepository.STORE_NAME,
];
