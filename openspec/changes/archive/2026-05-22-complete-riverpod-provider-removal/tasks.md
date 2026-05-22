## 1. Expose the stores via Riverpod

- [x] 1.1 In `calendar/providers/calendar_provider.dart`, add a top-level `final calendarProvider = ChangeNotifierProvider<CalendarProvider>((ref) => CalendarProvider());`, importing `package:hooks_riverpod/legacy.dart`. Keep the `CalendarProvider` class unchanged.
- [x] 1.2 In `settings/providers/settings_provider.dart`, remove the singleton (`static _instance`, private `SettingsProvider._()`, `factory SettingsProvider()`) and give it a plain public constructor. Add a top-level `final settingsProvider = ChangeNotifierProvider<SettingsProvider>((ref) => SettingsProvider());`, importing `package:hooks_riverpod/legacy.dart`.

## 2. App bootstrap

- [x] 2.1 In `main.dart`, replace `final settings = SettingsProvider(); await settings.loadSettings(prefs);` with `await container.read(settingsProvider).loadSettings(prefs);`; import `settingsProvider`; ensure the call still completes before `runApp`.
- [x] 2.2 In `app.dart`, remove the `package:provider` import, the `MultiProvider` and both `ChangeNotifierProvider(create: …)` entries. Read settings inside the existing `Builder` (or a Riverpod `Consumer`) via `ref.watch(settingsProvider)`; the two stores are now provided by their top-level `ChangeNotifierProvider`s, so no scope wiring is needed.

## 3. Migrate calendar-module consumers

- [x] 3.1 `calendar/screens/calendar_screen.dart` — swap `oldprovider.Provider.of<SettingsProvider>` / `<CalendarProvider>` for `ref.watch` / `ref.read`; drop the `late CalendarProvider calendarProvider;` field; remove the `oldprovider` import.
- [x] 3.2 `calendar/widgets/week_view/week_view_layout.dart` — same; drop the `late CalendarProvider calendarProvider;` field; `listen: false` reads in `initState`/`dispose` become `ref.read`.
- [x] 3.3 `calendar/widgets/planning_view/planning_view_layout.dart` — same; drop the `late CalendarProvider calendarProvider;` field.
- [x] 3.4 `calendar/widgets/week_view/week_view.dart` — swap `oldprovider.Provider.of<SettingsProvider>` for `ref.watch`/`ref.read`; remove import.
- [x] 3.5 `calendar/widgets/week_view/calendar_rectangle_event.dart` — same.
- [x] 3.6 `calendar/widgets/week_view/calendar_week.dart` — same.
- [x] 3.7 `calendar/widgets/common/calendar_header.dart` — same.

## 4. Migrate remaining-module consumers

- [x] 4.1 `home/screens/tabs_screen.dart` — swap `oldprovider.Provider.of<SettingsProvider>` for `ref.watch`/`ref.read`; remove import.
- [x] 4.2 `home/widgets/today_events.dart` — same.
- [x] 4.3 `home/widgets/horizontal_event_item.dart` — same.
- [x] 4.4 `settings/screens/settings_screen.dart` — same; also delete the stale commented-out `Provider.of<SettingsProvider>` line.
- [x] 4.5 `profile/screens/profile_screen.dart` — same.
- [x] 4.6 `profile/widgets/profile_item.dart` — same.
- [x] 4.7 `about/screens/about_screen.dart` — same (`provider.` alias).
- [x] 4.8 `school/screens/school_selection/school_item.dart` — same.
- [x] 4.9 `assistant/screens/assistant_screen.dart` — same (`oldProvider.` alias).
- [x] 4.10 `changelog/screens/changelog_screen.dart` — same.
- [x] 4.11 `onboarding/screens/onboarding_screen.dart` — same (`listen: false` write of `currentVersion` → `ref.read`).
- [x] 4.12 `hidden_event/widgets/hidden_event_item.dart` — same.
- [x] 4.13 `event_details/widgets/event_details_title.dart` — replace `Consumer<SettingsProvider>` with a Riverpod `Consumer` / `ref.watch(settingsProvider)`.
- [x] 4.14 `activity/widgets/difference_event.dart` — same.
- [x] 4.15 `shared/widgets/ui/app_search_bar.dart` — same.
- [x] 4.16 For each file in tasks 3–4, convert the widget class to `ConsumerWidget` / `ConsumerStatefulWidget`, or `HookConsumerWidget` / `HookConsumerState` when it already uses Flutter hooks, only where it is not already a `Consumer*` type. No constructor parameters change.

## 5. Personal-event direct singleton call sites

- [x] 5.1 `personal_event/controllers/add_personal_event_controller.dart` — replace the direct `SettingsProvider()` call with `ref.read(settingsProvider)` (the controller is a `Notifier` with `ref`).
- [x] 5.2 `personal_event/widgets/add_personal_event_form.dart` — replace the direct `SettingsProvider()` call so the colour-to-save conversion is sourced from a `ref`-bearing scope (e.g. `ref.read(settingsProvider)`); confirm no `package:provider` import is needed.

## 6. Remove the package

- [x] 6.1 Delete `provider: ^6.0.2` from `app/pubspec.yaml`.
- [x] 6.2 Run `flutter pub get` so `app/pubspec.lock` drops the `provider` entry.

## 7. Verify

- [x] 7.1 `grep -rn "package:provider/provider.dart" app/lib --include='*.dart'` returns no matches.
- [x] 7.2 `flutter analyze` from `app/` reports no new issues.
- [x] 7.3 `flutter test` from `app/` passes.
- [x] 7.4 Manual smoke: planning view renders/scrolls/honours dark mode; add-personal-event flow opens, applies event-colour conversion, and saves.
