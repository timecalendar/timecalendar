## Context

The app currently runs two state-management libraries. The Riverpod 3
migration (TIM-47) deliberately stopped at the `provider` package boundary:
`SettingsProvider` and `CalendarProvider` are `ChangeNotifier` classes wired
through `package:provider`'s `MultiProvider` in `app.dart` and consumed in ~22
files via `Provider.of` / `Consumer`, with the import aliased `oldprovider` /
`oldProvider` / `provider` as a "migrate later" marker. The
`riverpod-state-management` spec explicitly deferred this to TIM-50/Phase 3;
TIM-76 supersedes that.

The two stores:

- `SettingsProvider` (`settings/providers/settings_provider.dart`) — a
  hand-rolled singleton (`static _instance`, private ctor, `factory`) with an
  async `loadSettings(prefs)` init, reactive getters/setters that call
  `notifyListeners()`, and pure helper methods (`getEventColorToSave`, …).
  Loaded once in `main.dart` before `runApp`, then wired into `app.dart` and
  consumed in ~18 files.
- `CalendarProvider` (`calendar/providers/calendar_provider.dart`) — a small
  mutable holder for `savedWeek` / `currentDay` / `currentDayNotifier` /
  `savedScrollOffset`, consumed in `calendar_screen`, `week_view_layout` and
  `planning_view_layout`.

`main.dart` already builds the root `ProviderContainer` and wraps the app in
`UncontrolledProviderScope`. Most consumer widgets are already
`ConsumerWidget` / `ConsumerStatefulWidget` / `HookConsumerWidget` from prior
migration waves; a minority are still plain `StatelessWidget` /
`StatefulWidget`.

## Goals / Non-Goals

**Goals:**

- Zero `import 'package:provider/provider.dart'` lines in `app/lib/`.
- `provider` removed from `app/pubspec.yaml` and `pubspec.lock`.
- `SettingsProvider` and `CalendarProvider` reachable only through Riverpod.
- Behaviour preserved: settings load order, reactive rebuilds, calendar
  scroll/day tracking unchanged. `flutter analyze` clean, `flutter test`
  green, E2E smoke green.

**Non-Goals:**

- Rewriting `SettingsProvider` / `CalendarProvider` as immutable Riverpod
  `Notifier`s. That changes every getter/setter call site and is a separate
  refactor (recommended follow-up issue).
- Changing settings semantics, persistence keys, or defaults.
- Touching the existing `@riverpod` / `Notifier` providers already migrated in
  TIM-47.

## Decisions

### Decision 1: Bridge via Riverpod `ChangeNotifierProvider`, not a `Notifier` rewrite

Expose each store with Riverpod's legacy `ChangeNotifierProvider`:

```dart
// in settings_provider.dart
import 'package:hooks_riverpod/legacy.dart';

final settingsProvider = ChangeNotifierProvider<SettingsProvider>(
  (ref) => SettingsProvider(),
);
```

```dart
// in calendar_provider.dart
import 'package:hooks_riverpod/legacy.dart';

final calendarProvider = ChangeNotifierProvider<CalendarProvider>(
  (ref) => CalendarProvider(),
);
```

`ChangeNotifierProvider` ships in `package:hooks_riverpod/legacy.dart`
(verified against hooks_riverpod 3.3.1) and is the officially sanctioned
Riverpod 3 bridge for existing `ChangeNotifier` classes. `ref.watch(provider)`
returns the notifier and rebuilds listeners on `notifyListeners()` — exactly
matching `Provider.of<T>(context)` with `listen: true`.

**Alternative considered — full `Notifier` rewrite**: idiomatic but XL. It
would redesign `SettingsProvider`'s mutable getter/setter API into immutable
state plus action methods and rewrite every read/write call site, in a
two-year-unmaintained app with no settings unit tests. Rejected for this
change; recommended as a scoped follow-up. The bridge already achieves the
TIM-76 goal — one state-management library — and is L-effort, reviewable.

**Alternative considered — plain Riverpod `Provider`**: would not propagate
`notifyListeners()` rebuilds; consumers that depend on reactive settings
(dark mode, calendar hour height) would stop updating. Rejected.

### Decision 2: Remove the `SettingsProvider` singleton

The `static _instance` + private ctor + `factory` singleton exists only
because `package:provider` needed a way to hand the same instance to both the
`main.dart` pre-`runApp` `loadSettings` call and the `app.dart` widget tree.
Under Riverpod the `ProviderContainer` owns the single instance, so the
singleton becomes a second, contradictory source of truth. Replace it with a
plain public constructor.

`main.dart` initialises settings through the already-existing root container:

```dart
final container = ProviderContainer(retry: (_, _) => null);
...
final prefs = await SharedPreferences.getInstance();
await container.read(settingsProvider).loadSettings(prefs);
```

Because the same `container` is passed to `UncontrolledProviderScope`, the
widget tree sees the instance that was just loaded. Init order is preserved
(`loadSettings` still completes before `runApp`).

`CalendarProvider` already has a plain constructor — no change to its shape.

### Decision 3: `listen:` flag maps to `ref.watch` / `ref.read`

- `Provider.of<T>(context)` and `Provider.of<T>(context, listen: true)` →
  `ref.watch(tProvider)` (rebuilds on change).
- `Provider.of<T>(context, listen: false)` → `ref.read(tProvider)` (one-shot,
  typically in `initState` / callbacks / `dispose`).
- `Consumer<T>(builder: (ctx, value, child) => …)` → Riverpod
  `Consumer(builder: (ctx, ref, child) => … ref.watch(tProvider) …)`.

### Decision 4: Widget-class conversion only where required

Consumers already typed `ConsumerWidget` / `ConsumerStatefulWidget` /
`HookConsumerWidget` need only the call-site swap — they already expose `ref`.
Plain `StatelessWidget` / `StatefulWidget` consumers are converted to the
`Consumer*` equivalent. Widgets that already use Flutter hooks become
`HookConsumerWidget` (not `ConsumerWidget`) so hooks keep working. No widget
gains or loses a constructor parameter.

### Decision 5: Top-level provider names vs. local variables

The Riverpod providers are named `settingsProvider` and `calendarProvider`
(lowerCamelCase ending in `Provider`, matching `userCalendarProvider` etc.).
Several files declare a local variable or field also named `settingsProvider`
/ `calendarProvider` (e.g. `late CalendarProvider calendarProvider;` in
`week_view_layout.dart`, `calendar_screen.dart`,
`planning_view_layout.dart`). The migration replaces those mutable fields
with `ref.watch(calendarProvider)` reads, eliminating the field and therefore
the shadowing. Each file is checked individually so no top-level/local name
collision survives.

### Decision 6: Personal-event direct singleton call sites

`add_personal_event_controller.dart` and `add_personal_event_form.dart` call
`SettingsProvider()` directly (constructor, not via `package:provider`) to
reach `getEventColorToDisplay` / `getEventColorToSave`. Removing the singleton
breaks these — a bare `SettingsProvider()` would be a fresh, unloaded
instance. The controller is a Riverpod `Notifier` (has `ref`); it reads
`ref.read(settingsProvider)`. The form widget is wired so the colour-convert
function is supplied from a `ref`-bearing scope. These two sites are in scope
precisely because the singleton is being removed; no other behaviour of the
personal-event module changes.

## Risks / Trade-offs

- **[Settings init order regression in `main.dart`]** → Keep the
  `await … loadSettings(prefs)` call before `runApp`; verify the splash →
  calendar smoke flow and the manual add-personal-event smoke (colour
  conversion depends on loaded settings).
- **[A consumer silently stops rebuilding]** — wrong `watch`/`read` choice →
  Mechanically map `listen: true`→`watch`, `listen: false`→`read`; reviewer
  diffs every call site against the original `listen:` flag.
- **[`ChangeNotifierProvider` is a Riverpod "legacy" API]** — mild residual
  smell → Accepted: it unifies the app on one library now; the idiomatic
  `Notifier` rewrite is a tracked follow-up. Net debt strictly decreases (two
  libraries → one).
- **[Top-level / local name collision]** → Decision 5: the migration removes
  the shadowing local fields; per-file check during apply.
- **[Hidden `provider` transitive re-introduction]** → Final
  `grep` gate for `package:provider/provider.dart` across `app/lib/` plus
  absence of `provider:` in `pubspec.yaml`.
