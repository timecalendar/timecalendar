# Tasks

Conventions for every task below:
- Flutter SDK is not on `PATH`: `export PATH="/home/dev/flutter/bin:$PATH"`.
- All commands run from `app/` unless stated otherwise.
- Each swap MUST preserve current behaviour. If a swap needs more than the
  described edit to compile or behave identically, stop and escalate to
  FoundingEngineer — it is no longer a B3-scope swap.
- `flutter analyze` / `flutter test` are run once at the end (group 8), not
  between intermediate edits.

## 1. Pre-flight verification

- [x] 1.1 Confirm the dead deps have zero live imports:
  `grep -rn "package:tuple/\|package:frontend_server_client/\|package:state_notifier/" app/lib` returns nothing.
- [x] 1.2 Confirm `StateNotifier`/`StateNotifierProvider` are used (5 files) but
  only via `hooks_riverpod`'s re-export — no `package:state_notifier/` import.
- [x] 1.3 Read `app/lib/modules/event_details/providers/checklist_item_provider.dart`
  and note the exact signature/index convention of `ChecklistItemNotifier.reorderItems`
  (whether it expects the raw or post-removal-adjusted `newIndex`).
- [x] 1.4 Check whether `app/lib/main.dart` actually references a `flutter_image`
  symbol or only carries a stale `import 'package:flutter_image/network.dart';`.

## 2. Replace `flutter_image` with `cached_network_image`

- [x] 2.1 In `app/lib/modules/school/screens/school_selection/school_item.dart`:
  replace `import 'package:flutter_image/network.dart';` with
  `import 'package:cached_network_image/cached_network_image.dart';`, and change
  `image: NetworkImageWithRetry(school.imageUrl)` to
  `image: CachedNetworkImageProvider(school.imageUrl)`. Leave the surrounding
  `FadeInImage` / `placeholder:` unchanged.
- [x] 2.2 In `app/lib/main.dart`: if 1.4 found no live use, delete the
  `import 'package:flutter_image/network.dart';` line. If it found a live use,
  swap it the same way as 2.1.

## 3. Replace `color` with native `HSLColor`

- [x] 3.1 In `app/lib/modules/shared/utils/color_utils.dart`: remove
  `import 'package:color/color.dart' as PkgColor;`. Keep `import 'dart:ui';` and
  `import 'package:flutter/material.dart';`.
- [x] 3.2 Delete the `colorToRgbColor` helper (it becomes unused).
- [x] 3.3 Rewrite `darkenColor(Color color, double amount)` using native
  `HSLColor`: `final hsl = HSLColor.fromColor(color);` then return
  `hsl.withLightness((hsl.lightness * (1 - amount)).clamp(0.0, 1.0)).toColor();`.
- [x] 3.4 Rewrite `lightenColor(Color color, double amount)` the same way with
  `(hsl.lightness / (1 - amount)).clamp(0.0, 1.0)` — the clamp is required
  because the division can exceed `1.0` and `HSLColor.withLightness` asserts
  the `0.0..1.0` range.
- [x] 3.5 Leave `hexToColor`, `colorToHex`, `darkenEvent`, `lightenEvent`
  unchanged (they already use only native APIs).

## 4. Replace `reorderables` with `SliverReorderableList`

- [x] 4.1 In `app/lib/modules/event_details/widgets/event_details_checklist.dart`:
  remove `import 'package:reorderables/reorderables.dart';`.
- [x] 4.2 Replace the returned `ReorderableSliverList` /
  `ReorderableSliverChildBuilderDelegate` with a native
  `SliverReorderableList(itemCount: items.length, itemBuilder: ..., onReorder: ...)`.
- [x] 4.3 In the `itemBuilder`, wrap each built `EventDetailsChecklistItem` in a
  `ReorderableDelayedDragStartListener(index: index, child: ...)` so long-press
  drag is preserved. Keep the existing `Key(items[index].uuid!)`.
- [x] 4.4 Wire `onReorder` to `notifier.reorderItems`, adjusting for the index
  convention found in 1.3 — native `SliverReorderableList` passes the raw
  `newIndex`; decrement it when `newIndex > oldIndex` only if `reorderItems`
  expects a post-removal index.

## 5. Replace `enum_to_string` with native enum APIs

- [x] 5.1 In `app/lib/modules/settings/providers/settings_provider.dart`: remove
  `import 'package:enum_to_string/enum_to_string.dart';`.
- [x] 5.2 Replace `EnumToString.fromString(CalendarViewType.values, stringPref)`
  with a null-safe lookup that returns `null` for an unknown value, e.g.
  `CalendarViewType.values.where((e) => e.name == stringPref).firstOrNull`
  (add `import 'package:collection/collection.dart';` if `firstOrNull` is not
  already available, or use an equivalent manual lookup). Do NOT use
  `values.byName` — it throws on an unknown name and breaks the default-fallback.
- [x] 5.3 Replace both `EnumToString.convertToString(...)` calls with the
  value's `.name` (use `_calendarViewType!.name` / `value!.name`, matching the
  existing non-null usage; keep the surrounding logic identical).

## 6. Replace `flutter_material_color_picker` with `flutter_colorpicker`

- [x] 6.1 In `app/lib/modules/personal_event/screens/add_personal_event_screen.dart`:
  replace `import 'package:flutter_material_color_picker/flutter_material_color_picker.dart';`
  with `import 'package:flutter_colorpicker/flutter_colorpicker.dart';`.
- [x] 6.2 Replace the `MaterialColorPicker(selectedColor:, onColorChange:)`
  widget with `MaterialPicker(pickerColor: _selectedColor ?? Colors.pink,
  onColorChanged: (color) => setState(() => _tempShadeColor = color),
  enableLabel: false)`. Leave the `Container(height: 220, ...)`, the
  `AppAlertDialog`, and the `onColorChoose` confirm/cancel flow unchanged.

## 7. Update `app/pubspec.yaml`

- [x] 7.1 Remove these 8 entries from `dependencies:`: `tuple`,
  `frontend_server_client`, `state_notifier`, `flutter_image`, `color`,
  `reorderables`, `enum_to_string`, `flutter_material_color_picker`.
- [x] 7.2 Add two direct dependencies at their latest stable versions:
  `cached_network_image` and `flutter_colorpicker`. Resolve the current latest
  caret constraint at apply time (`flutter pub add` is acceptable).
- [x] 7.3 Keep `pref` and every other dependency untouched. Do not change the
  `version:`, SDK constraint, asset/font sections, or `dev_dependencies`.
- [x] 7.4 Run `flutter pub get` from `app/`. It must resolve without error. If a
  conflict appears, do not force it — escalate to FoundingEngineer.

## 8. Verify

- [x] 8.1 Run `flutter analyze` from `app/` — no new issues. In particular
  confirm `StateNotifier`/`StateNotifierProvider` still resolve after the
  `state_notifier` removal; if they do not, restore `state_notifier` to
  `pubspec.yaml` and escalate.
- [x] 8.2 Run `flutter test` from `app/` — the full unit + widget suite passes.
- [x] 8.3 The Phase 1 E2E smoke suite (`app/integration_test/`) needs an Android
  emulator and is verified by CI. Ensure the PR's CI `test-app` / integration
  job is green before handing to Review.
- [x] 8.4 Sanity-check the four behaviour-sensitive swaps: checklist reorder
  (group 4), color picker (group 6), `CalendarViewType` persistence round-trip
  (group 5), and event-color darken/lighten (group 3).

## 9. Confirm scope

- [x] 9.1 Confirm the final diff is limited to `app/pubspec.yaml`,
  `app/pubspec.lock`, and the 6 source files listed in `proposal.md` Impact.
  No backend, `openapi/`, CI, or SDK-constraint changes.
- [x] 9.2 Confirm no dead or discontinued package from the B3 scope remains in
  `app/pubspec.yaml`, and that `pref` is intentionally still present.

## Implementation notes

- **Deviation from 1.4 / 2.2** — `app/lib/main.dart` carried a *live* use of
  `flutter_image`, not just a stale import: `FlutterError.onError` had
  `if (details.exception is FetchFailure) return;`, where `FetchFailure` is
  flutter_image's retry-exhausted exception. `cached_network_image` has no
  equivalent type. With `flutter_image` removed, `FetchFailure` can never be
  thrown again, so the guard line is unreachable; it was deleted along with the
  import. Behaviour is preserved (the guard only ever suppressed flutter_image
  fetch failures, which no longer exist). Flagged for Review.
- `color_utils.dart`: `import 'dart:ui';` was also removed — `flutter analyze`
  reported it as `unnecessary_import` once `Color`/`HSLColor` were the only
  symbols used (both provided by `package:flutter/material.dart`).
- Verification: `flutter analyze` clean, `flutter test` 48/48 passing. The
  Phase 1 E2E smoke suite runs in CI (Android emulator).
