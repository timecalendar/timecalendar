import 'dart:ui' show PlatformDispatcher;

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
import 'package:timecalendar/modules/shared/constants/constants.dart';

/// Boots the app (`app.main()`) and pumps through the splash screen.
///
/// Uses a **bounded** pump, never `pumpAndSettle`: the app can boot straight
/// into `TabsScreen`, which kicks off a calendar sync whose loading spinner is
/// a perpetual animation — `pumpAndSettle` never settles against it and would
/// hang to the test timeout. After this returns, each flow waits for its own
/// first widget with [pumpUntilFound].
Future<void> waitAppInitialized(WidgetTester tester) async {
  // Capture the integration_test binding's `FlutterError.onError` *before*
  // `app.main()` replaces it with the app's Crashlytics handler.
  final bindingOnError = FlutterError.onError;

  await app.main();

  // Restore the binding's `FlutterError.onError`. `app.main()` installs a
  // Crashlytics handler that swallows widget errors silently — that both hides
  // real failures and trips the "test overrode FlutterError.onError but failed
  // to return it to its original state" assertion. Restoring it makes a widget
  // error a proper, fast, debuggable test failure.
  FlutterError.onError = bindingOnError;

  // Async errors: `app.main()`'s `PlatformDispatcher.onError` also swallows
  // them. Echo them to the console (visible in the CI log) so a flow that hangs
  // on a swallowed boot exception is debuggable; return `true` so a benign
  // async error does not by itself fail the flow.
  PlatformDispatcher.instance.onError = (error, stack) {
    debugPrint('E2E-DIAG uncaught async error: $error\n$stack');
    return true;
  };

  // Bounded settle through the splash screen (~8s of frames). The splash
  // controller waits 1s then routes; 8s covers boot without ever hanging.
  for (var i = 0; i < 40; i++) {
    await tester.pump(const Duration(milliseconds: 200));
  }
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

  // A user who already has a calendar has also already seen the changelog for
  // the current app version. Persist `current_version` accordingly: otherwise
  // `TabsScreen` pushes `ChangelogScreen` over itself on its first frame — the
  // pref, freshly cleared by [resetLocalAppState], reads back as 0, which is
  // `< Constants.currentVersion` — and the modal hides the tab bar the flow
  // asserts on.
  final prefs = await SharedPreferences.getInstance();
  await prefs.setInt('current_version', Constants.currentVersion);
}

/// Sembast stores written by the app that an E2E flow should start clean.
const _appStoreNames = <String>[
  UserCalendarRepository.STORE_NAME,
  CalendarEventRepository.STORE_NAME,
  HiddenEventRepository.STORE_NAME,
  PersonalEventRepository.STORE_NAME,
];
