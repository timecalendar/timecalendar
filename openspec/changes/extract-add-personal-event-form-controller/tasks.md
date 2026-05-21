# Tasks

Conventions:

- Flutter SDK is not on `PATH`; use `export PATH="/home/dev/flutter/bin:$PATH"`.
- All commands run from `app/` unless stated otherwise.
- This is a **behaviour-preserving refactor**. Every user-facing string, the
  field order, the date format, and the validation messages MUST be byte-identical.
- Verification (`build_runner`, `flutter analyze`, `flutter test`) runs once at
  the end (group 8), not between intermediate edits.

## 1. Pre-flight

- [x] 1.1 Confirm the three call sites of `AddPersonalEventScreen` and the
  shape they need: `app.dart` route table (`AddPersonalEventScreen()`),
  `tabs_screen.dart` (`pushNamed(routeName)`), `event_details_header.dart`
  (`AddPersonalEventScreen(event: ...)`). The slimmed screen MUST keep the
  class name, `static const routeName`, and the `{PersonalEvent? event}`
  constructor.
- [x] 1.2 Read `widgets/app_alert_dialog.dart`, `assistant/states/assistant_state.dart`
  (freezed pattern), and `event_details/providers/checklist_item_provider.dart`
  (Notifier family pattern) to match exact conventions.

## 2. Form-state class — `states/add_personal_event_form_state.dart`

- [x] 2.1 Create a `freezed` class `AddPersonalEventFormState` with required
  fields `String title`, `String location`, `String description`,
  `DateTime date`, `TimeOfDay timeStart`, `TimeOfDay timeEnd`, `Color color`,
  and `@Default(false) bool colorChanged`. Follow the
  `assistant_state.dart` form exactly (`@freezed abstract class … with _$…`,
  `factory … = _…`, private `…._()` constructor).
- [x] 2.2 Add a `bool get isEndAfterStart` getter: `true` when `timeEnd` is
  strictly after `timeStart` (`timeStart.hour < timeEnd.hour ||
  (timeStart.hour == timeEnd.hour && timeStart.minute < timeEnd.minute)`).

## 3. Controller — `controllers/add_personal_event_controller.dart`

- [x] 3.1 `class AddPersonalEventController extends Notifier<AddPersonalEventFormState>`
  with a `final PersonalEvent? initialEvent;` constructor field.
- [x] 3.2 `build()`:
  - edit mode (`initialEvent != null`): seed from the event — `title`,
    `location ?? ''`, `description ?? ''`, `date = startsAt`,
    `timeStart/timeEnd = TimeOfDay.fromDateTime(startsAt/endsAt)`,
    `color = SettingsProvider().getEventColorToDisplay(event.color) ?? event.color`,
    `colorChanged = false`.
  - add mode (`initialEvent == null`): `title/location/description = ''`,
    `date = DateTime.now()`, `timeStart = TimeOfDay.now()`,
    `timeEnd = TimeOfDay(hour: timeStart.hour + 1, minute: 0)`,
    `color = Colors.pink`, `colorChanged = false`.
- [x] 3.3 Setters: `setTitle`, `setLocation`, `setDescription`, `setDate`,
  `setTimeStart`, `setTimeEnd` each `state = state.copyWith(...)`. `setColor`
  sets `color:` **and** `colorChanged: true`.
- [x] 3.4 `PersonalEvent buildEvent(Color Function(Color) toSaveColor)`:
  builds `startsAt`/`endsAt` from `state.date` + `state.timeStart/timeEnd`;
  resolves colour as `(state.colorChanged || initialEvent == null)
  ? toSaveColor(state.color) : initialEvent!.color`; in edit mode returns
  `initialEvent!.rebuild(...)`, in add mode returns a new `PersonalEvent`
  with `uid = Uuid().v4()`. Always sets `exportedAt = DateTime.now()`.
  Field mapping MUST match the old `saveEvent`.
- [x] 3.5 Declare
  `final addPersonalEventControllerProvider = NotifierProvider.autoDispose.family<
  AddPersonalEventController, AddPersonalEventFormState, PersonalEvent?>(
  AddPersonalEventController.new);` (use `.family.autoDispose` order if
  analyze prefers it).

## 4. Colour-picker dialog — `widgets/event_color_picker_dialog.dart`

- [x] 4.1 `Future<Color?> showEventColorPickerDialog(BuildContext context,
  Color initialColor)` → `showDialog<Color>` rendering a private `HookWidget`
  whose `useState` is seeded with `initialColor`.
- [x] 4.2 Dialog body = `AppAlertDialog(title: 'Choisir une couleur', content:
  SizedBox(height: 220, child: MaterialPicker(...)), actions: [...])`.
  "Annuler" → `Navigator.pop()` (null); "Choisir" → `Navigator.pop(selected)`.
  `MaterialPicker(pickerColor:, onColorChanged:, enableLabel: false)`.

## 5. Form widget — `widgets/add_personal_event_form.dart`

- [x] 5.1 `class AddPersonalEventForm extends HookConsumerWidget` with a
  `{PersonalEvent? event}` field. `build`: `formKey = useMemoized(() =>
  GlobalKey<FormState>())`, watch `addPersonalEventControllerProvider(event)`
  for state, read `.notifier` for the controller.
- [x] 5.2 Reproduce the exact widget tree of the old `build()`: `Form` →
  `Column` → header row (`IconButton(Icons.close)` + `CustomButton(text:
  'Enregistrer')`) → `SizedBox(height: 16)` → `Expanded(ListView(shrinkWrap:
  true, …))` with, in order: title `TextFormField`, `Divider`, date
  `TextButton`, `Divider`, start/end time row, `Divider`, location row,
  `CustomDivider`, description row, `Divider`, colour row, `Divider`.
- [x] 5.3 Text fields use `initialValue` + `validator` + `onSaved` (push into
  the controller via `setTitle`/`setLocation`/`setDescription`). Title
  `validator` returns `'Entrer un titre'` when empty. Keep hint texts
  `'Saisir un titre'`, `'Lieu'`, `'Description'` and the title `fontSize: 24`.
- [x] 5.4 Date button shows `DateFormat("EEEE dd MMMM", "fr").format(state.date)`;
  `onPressed` unfocuses, calls `showDatePicker(initialDate: state.date,
  firstDate: DateTime(1970), lastDate: DateTime(2100))`, and on a non-null
  result calls `setDate`.
- [x] 5.5 Start/end time buttons call `showTimePicker` and `setTimeStart` /
  `setTimeEnd`. The "Fin" label + value use red when `!state.isEndAfterStart`,
  matching the old `endTimeSuperior()` colouring. Keep labels `'Début'` / `'Fin'`.
- [x] 5.6 Colour row: `CircleAvatar(backgroundColor: state.color, radius: 12)`
  + text `"Couleur de l'événement"`; `onPressed` calls
  `showEventColorPickerDialog(context, state.color)` and, on a non-null
  result, `setColor`.
- [x] 5.7 Save handler: unfocus; `final form = formKey.currentState!;` if
  `!form.validate() || !ref.read(addPersonalEventControllerProvider(event))
  .isEndAfterStart` return; `form.save()`; `final saved = controller
  .buildEvent((c) => SettingsProvider().getEventColorToSave(c) ?? c)`;
  `await ref.read(personalEventsProvider.notifier).addPersonalEvent(saved)`;
  guard `if (!context.mounted) return;`; `Navigator.of(context).pop(saved)`.
- [x] 5.8 Decompose the tree into small **private** widgets in the same file
  (e.g. `_FormHeader`, `_DateField`, `_TimeRangeField`, `_ColorField`) so no
  single `build` is a god method. Replace layout `Container`s that only set
  size with `SizedBox`. No business logic in any widget.

## 6. Slim the screen — `screens/add_personal_event_screen.dart`

- [x] 6.1 Replace the file with a `StatelessWidget` `AddPersonalEventScreen`
  keeping `static const routeName = '/add-personal-event'` and
  `const AddPersonalEventScreen({super.key, this.event})` with
  `final PersonalEvent? event;`. `build` returns
  `Scaffold(body: SafeArea(child: AddPersonalEventForm(event: event)))`.
- [x] 6.2 Confirm the file is well under 250 lines (target ~25) and the three
  call sites still compile unchanged.

## 7. Controller unit tests — `test/modules/personal_event/controllers/add_personal_event_controller_test.dart`

- [x] 7.1 Use `ProviderContainer` (+ `addTearDown(container.dispose)`) and
  `loadSettingsProvider()` from `test/support/`. mocktail only if needed.
- [x] 7.2 `build` add mode: empty strings, `color == Colors.pink`,
  `colorChanged == false`, `date` is today.
- [x] 7.3 `build` edit mode: state seeded from a fixture `PersonalEvent`
  (title/location/description, date, `timeStart`/`timeEnd` from
  `startsAt`/`endsAt`, `colorChanged == false`).
- [x] 7.4 Setters update the matching field; `setColor` also flips
  `colorChanged` to `true`.
- [x] 7.5 `isEndAfterStart`: `true` when end > start, `false` when equal,
  `false` when end < start.
- [x] 7.6 `buildEvent` add mode: non-empty fresh `uid`, `startsAt`/`endsAt`
  composed from date + times, `color == toSaveColor(state.color)` (identity
  converter), `kind == EventKind.Personal`.
- [x] 7.7 `buildEvent` edit mode, colour unchanged: `uid` preserved, colour
  equals the **original** `event.color` (converter NOT applied).
- [x] 7.8 `buildEvent` edit mode after `setColor`: colour equals
  `toSaveColor(state.color)`.

## 8. Verify

- [x] 8.1 From `app/`, run `dart run build_runner build --delete-conflicting-outputs`
  — generates `add_personal_event_form_state.freezed.dart`.
- [x] 8.2 From `app/`, `flutter analyze` — zero new issues.
- [x] 8.3 From `app/`, `flutter test` — full unit + widget suite green
  (50 tests at baseline + the new controller tests).
- [x] 8.4 Manual smoke: not possible on the headless dev host (no Android/iOS
  emulator). Behaviour preservation is instead verified by the field-by-field
  Review audit (old vs new screen), the controller unit tests, and the green
  `flutter analyze` / `flutter test` run. The Phase 1 E2E smoke suite does not
  exercise this screen, so no E2E regression risk.

## 9. Scope discipline

- [x] 9.1 Final diff touches only: the five `modules/personal_event/` files
  listed in `proposal.md` Impact, the new test file, the generated
  `.freezed.dart`, and the OpenSpec change folder. No `server/`, `openapi/`,
  `web/`, or CI edits.
- [x] 9.2 No edits to `PersonalEvent`, `personal_event_repository.dart`, or
  `personal_events_provider.dart`.

## 10. Hand-off

- [x] 10.1 `openspec validate extract-add-personal-event-form-controller --strict` passes.
- [x] 10.2 Hand to Simplify, then Review, then commit + PR against `main`, then
  archive the change.
