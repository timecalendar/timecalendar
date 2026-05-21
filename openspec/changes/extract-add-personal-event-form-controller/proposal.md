## Why

`app/lib/modules/personal_event/screens/add_personal_event_screen.dart` is a
534-line `ConsumerStatefulWidget` that mixes every concern in one class: nine
mutable `setState` fields, form-state initialisation, three date/time picker
flows, a colour-picker dialog with its own temp-colour bookkeeping, two
*divergent* end-after-start time checks, the `PersonalEvent` build/save logic,
and a ~290-line `build()` method.

It predates the Riverpod 3 migration ([TIM-47](/TIM/issues/TIM-47)) and does
not follow the controller conventions the rest of the app now uses
(`checklist_item_provider`, `hidden_event_provider`,
`school_selection_controller`). [TIM-73](/TIM/issues/TIM-73) is the tech-debt
ticket to bring it back to idiomatic Flutter without changing behaviour.

## What Changes

- **New `AddPersonalEventFormState`** — a `freezed` immutable value class
  (`states/add_personal_event_form_state.dart`) holding the eight form fields
  (`title`, `location`, `description`, `date`, `timeStart`, `timeEnd`,
  `color`, `colorChanged`) plus an `isEndAfterStart` getter that replaces the
  two divergent inline time comparisons with one definition.
- **New `AddPersonalEventController`** — a Riverpod `Notifier` exposed as an
  `autoDispose` family keyed by the optional `PersonalEvent` (the same family
  shape as `checklist_item_provider`). It owns form-state initialisation
  (add vs edit), the field setters, and `buildEvent()` which produces the
  `PersonalEvent` to persist. `autoDispose` guarantees every screen open
  starts from fresh state — matching the current `StatefulWidget` behaviour.
- **New `AddPersonalEventForm` widget** (`widgets/add_personal_event_form.dart`)
  — a `HookConsumerWidget` holding the declarative form UI, decomposed into
  small private field widgets. No business logic.
- **New `event_color_picker_dialog.dart`** — the colour-picker dialog
  extracted into a `showEventColorPickerDialog()` function returning the
  picked `Color?`, replacing the `_tempShadeColor` / `_colorChanged` /
  `onColorChoose` setState bookkeeping.
- **`add_personal_event_screen.dart` slimmed** to a thin `StatelessWidget`
  shell (`Scaffold` → `SafeArea` → `AddPersonalEventForm`) — well under the
  250-line acceptance bar (~25 lines). Class name, `routeName`, and the
  `{PersonalEvent? event}` constructor are unchanged so the three call sites
  (`app.dart` route table, `tabs_screen.dart`, `event_details_header.dart`)
  keep working.
- **New unit tests** for the controller
  (`test/modules/personal_event/controllers/add_personal_event_controller_test.dart`).

Behaviour is preserved: every user-facing string, the field order/layout, the
date format, the validation messages, and the add-vs-edit save semantics are
unchanged. One latent crash is **fixed** as a side effect — see `design.md`
"Colour-picker latent bug": confirming the picker without moving it no longer
yields a `null` colour.

Out of scope: any visual redesign, new fields, the legacy `package:provider`
`SettingsProvider` itself (only this module stops importing it), and any
change to `PersonalEvent`, the repository, or `personalEventsProvider`.

## Capabilities

### New Capabilities
<!-- None — this change extends an existing capability. -->

### Modified Capabilities
- `riverpod-state-management`: adds a requirement that the personal-event
  add/edit form is backed by a Riverpod `Notifier` controller (not widget
  `setState`), with the screen reduced to a presentation shell. Does not
  alter the existing Riverpod 3 baseline / no-`StateNotifier` requirements.

## Impact

- **New** `app/lib/modules/personal_event/states/add_personal_event_form_state.dart`
  (+ generated `.freezed.dart`).
- **New** `app/lib/modules/personal_event/controllers/add_personal_event_controller.dart`.
- **New** `app/lib/modules/personal_event/widgets/add_personal_event_form.dart`.
- **New** `app/lib/modules/personal_event/widgets/event_color_picker_dialog.dart`.
- **Rewritten** `app/lib/modules/personal_event/screens/add_personal_event_screen.dart`
  (534 → ~25 lines).
- **New** `app/test/modules/personal_event/controllers/add_personal_event_controller_test.dart`.
- No changes to `server/`, `openapi/`, `web/`, CI, or SDK constraints.
- No changes to other Dart files; the three call sites are unaffected (public
  API of `AddPersonalEventScreen` is unchanged).
