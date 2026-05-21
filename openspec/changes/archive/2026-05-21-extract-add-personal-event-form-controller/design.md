# Design

## Context

`add_personal_event_screen.dart` is a 534-line god widget. The refactor
target is the idiomatic split this app already uses elsewhere: a Riverpod
`Notifier` for state + logic, a `freezed` value class for the state, and a
thin presentation widget tree. No behaviour change.

## Decision 1 — `freezed` state class

`AddPersonalEventFormState` is a `freezed` class, matching the app's existing
local-state pattern (`assistant/states/assistant_state.dart`):

```dart
@freezed
abstract class AddPersonalEventFormState with _$AddPersonalEventFormState {
  factory AddPersonalEventFormState({...}) = _AddPersonalEventFormState;
  AddPersonalEventFormState._();
  bool get isEndAfterStart => ...;
}
```

`freezed` gives `copyWith` + value equality for free. Value equality matters:
Riverpod compares `Notifier` state with `==`, so picking the *same* date in
the date picker produces an equal state and no spurious rebuild — this is why
the old `picked != _date` guards can be dropped.

`isEndAfterStart` lives on the **state** (a pure function of `timeStart` /
`timeEnd`), so it is unit-testable without Riverpod and is the single source
of truth for both the save gate and the red "Fin" label. The old code had
*two* divergent comparisons for this — `endTimeSuperior()` (lexicographic)
and an inline `(h + m/60)` fractional compare in the save handler. They are
mathematically identical for valid minutes; consolidating to one is a safe
simplification.

## Decision 2 — controller as an `autoDispose` family

`AddPersonalEventController extends Notifier<AddPersonalEventFormState>` with
a constructor parameter for the optional initial event, exposed as:

```dart
final addPersonalEventControllerProvider =
    NotifierProvider.autoDispose.family<AddPersonalEventController,
        AddPersonalEventFormState, PersonalEvent?>(AddPersonalEventController.new);
```

This is the same family shape as `checklist_item_provider` (a `Notifier`
subclass with a constructor arg + `NotifierProvider.family(... .new)`).

- **Family key = `PersonalEvent?`.** `PersonalEvent` is a `built_value`
  object with value equality, so it is a valid family key. The key carries
  the add (`null`) vs edit (`event`) distinction into `build()`.
- **`autoDispose` is required.** Without it, the `null` key (every "add new
  event") would reuse one cached controller instance, so reopening the screen
  would show the previous draft. The current `StatefulWidget` gets fresh
  state on every open; `autoDispose` reproduces that — the controller is
  disposed when the screen unmounts and unwatches it. (The Riverpod 3
  migration spec only constrains *migrated* providers to keep their v2
  lifetime; this is a brand-new provider, so `autoDispose` is a free design
  choice and the correct one for ephemeral form state.)

If `NotifierProvider.autoDispose.family` does not resolve under
`hooks_riverpod` 3.3.x, use the equivalent `NotifierProvider.family.autoDispose`
modifier order — `flutter analyze` is authoritative.

## Decision 3 — colour conversion stays a settings concern

`SettingsProvider` (legacy `package:provider` `ChangeNotifier` **singleton**)
converts an event colour between stored form and dark-mode display form.

- In `build()` (edit mode) the controller seeds `state.color` with the
  *display* colour via `SettingsProvider().getEventColorToDisplay(...)`.
  `SettingsProvider()` is a process-wide singleton (`factory` returns
  `_instance`), so calling it directly is equivalent to the old screen's
  `Provider.of<SettingsProvider>(context, listen: false)` and lets this
  module drop its `package:provider` import. Unit tests seed the singleton
  with the existing `test/support/settings_provider.dart` helper.
- `buildEvent()` does **not** import `SettingsProvider`. It takes a
  `Color Function(Color) toSaveColor` converter so the controller stays
  decoupled and the colour branch (`colorChanged || isNew ? convert : keep
  original`) is unit-testable with an identity converter. The widget passes
  `(c) => SettingsProvider().getEventColorToSave(c) ?? c`.

## Decision 4 — form widget: `onSaved`, not `onChanged`

Text fields (`title`, `location`, `description`) use `initialValue` +
`validator` + **`onSaved`**. They push into the controller only when
`formKey.currentState!.save()` runs at save time — never per keystroke. This
exactly mirrors the old code (which stored values as a side effect of
`validate()`), keeps typing free of provider rebuilds, and is idiomatic
`Form` usage. The interactive date/time/colour widgets mutate the controller
immediately (they must reflect on screen at once), so the form widget watches
the controller state for those.

The save gate stays identical: `validate()` (shows the "Entrer un titre"
error) **and** `isEndAfterStart`; if either fails, nothing is saved.

## Decision 5 — colour-picker latent bug

Old flow: `_openColorPicker` tracks `_tempShadeColor` (initially `null`);
"Choisir" applies it. Tapping "Choisir" *without moving* the picker leaves
`_tempShadeColor == null`, so `_selectedColor` becomes `null` and `colorChanged`
becomes `true`. On save, `getEventColorToSave(null)` returns `null`, and
`PersonalEvent`'s non-nullable `Color color` field then throws.

The new `showEventColorPickerDialog(context, initialColor)` seeds its internal
`useState` with `initialColor`, so "Choisir" always returns a non-null colour
(the current one if untouched). This removes the crash. It is an error-path
fix, not a behaviour regression on any normal flow.

## File layout

```
modules/personal_event/
  states/add_personal_event_form_state.dart      (+ .freezed.dart)
  controllers/add_personal_event_controller.dart
  widgets/add_personal_event_form.dart
  widgets/event_color_picker_dialog.dart
  screens/add_personal_event_screen.dart         (slimmed shell)
```

`states/` and `controllers/` mirror the `assistant` and `school` modules
respectively. Field sub-widgets stay **private** inside
`add_personal_event_form.dart` — they are cohesive to this one form and not
reused, so separate files would be over-fragmentation.

## Risks

- **Family key identity.** Two pushes of the *same* `PersonalEvent` share a
  controller while both are alive — not possible in this UI (one add/edit
  screen at a time) and harmless with `autoDispose`.
- **Riverpod modifier syntax.** `autoDispose` + `family` composition order is
  verified by `flutter analyze` during apply.
- **No existing test covers this screen** (confirmed: no widget test, no E2E
  flow touches it). The new controller unit tests + `flutter analyze` +
  `flutter test` + a manual smoke are the verification of record.
