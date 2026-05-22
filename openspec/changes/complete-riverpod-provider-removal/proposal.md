## Why

The Riverpod 3 migration (TIM-47) intentionally left the legacy `provider`
package in place: `SettingsProvider` and `CalendarProvider` are still
`ChangeNotifier` stores wired through `package:provider`, consumed in ~22
files via `Provider.of` / `Consumer` (aliased `oldprovider`). Running two
state-management libraries side by side is a maintenance hazard — every
contributor must know which `Provider` they are looking at, and the
`oldprovider` aliases are scattered migration debt. TIM-76 finishes the
migration so the app has exactly one state-management library: Riverpod.

## What Changes

- Expose `SettingsProvider` and `CalendarProvider` through Riverpod
  `ChangeNotifierProvider`s (the officially sanctioned Riverpod 3 bridge for
  existing `ChangeNotifier` classes), declared next to their classes.
- **BREAKING (internal)**: drop the `SettingsProvider` hand-rolled singleton
  (`static _instance` + private constructor + `factory`). With Riverpod the
  container owns the single instance; the singleton becomes a second,
  contradictory source of truth.
- Initialise settings in `main.dart` via the existing root `ProviderContainer`
  (`container.read(settingsProvider).loadSettings(prefs)`) instead of the
  singleton.
- Remove the old-`provider` `MultiProvider` / `ChangeNotifierProvider`
  wiring from `app.dart`; read settings there through a Riverpod `Consumer`.
- Migrate all ~22 consumer files from `Provider.of<T>(context)` /
  `Consumer<T>` to `ref.watch` / `ref.read`, converting plain
  `StatelessWidget` / `StatefulWidget` consumers to `ConsumerWidget` /
  `ConsumerStatefulWidget` (or `HookConsumerWidget` where hooks are already
  used) as needed.
- Fix the two direct `SettingsProvider()` call sites in the personal-event
  module to read the Riverpod provider, since the singleton is being removed.
- Remove `provider: ^6.0.2` from `app/pubspec.yaml` and re-resolve
  `pubspec.lock`.

Out of scope (recommended follow-up): rewriting `SettingsProvider` /
`CalendarProvider` as idiomatic immutable `Notifier`s. The bridge keeps this
change reviewable and risk-bounded; the `Notifier` rewrite touches every
getter/setter call site and is a distinct refactor.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `riverpod-state-management`: replace the "Provider-package consolidation is
  out of scope" requirement (which deferred this work to TIM-50/Phase 3) with
  a requirement that the app contains no `package:provider` usage and that
  `SettingsProvider` / `CalendarProvider` are exposed via Riverpod.

## Impact

- **Code**: `app/lib/main.dart`, `app/lib/app.dart`, the two provider
  classes, and ~22 consumer widgets/screens across the `calendar`, `home`,
  `settings`, `profile`, `about`, `school`, `assistant`, `changelog`,
  `onboarding`, `hidden_event`, `event_details`, `activity`, `personal_event`
  and `shared` modules.
- **Dependencies**: `provider` removed from `app/pubspec.yaml`; `pubspec.lock`
  re-resolved.
- **Spec**: `openspec/specs/riverpod-state-management/spec.md` — the
  out-of-scope requirement is superseded.
- **Risk**: medium — singleton removal changes the settings-init path in
  `main.dart`; behaviour is verified by `flutter analyze`, `flutter test`,
  the E2E smoke suite, and a manual smoke of the planning and
  add-personal-event flows.
