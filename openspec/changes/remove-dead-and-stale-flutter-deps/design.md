## Context

B1 ([TIM-36](/TIM/issues/TIM-36)) audited every direct dependency in
`app/pubspec.yaml`. Group C is the "dead or stale" set: packages with zero
usages, or packages years past their last release (`flutter_image` and the
`color` package are effectively discontinued). They keep old transitive
packages pinned and add friction to the later upgrade waves (B4+).

B2 ([TIM-37](/TIM/issues/TIM-37)) already bumped the mechanical Group A
packages. B3 is the cleanup wave: remove the dead packages and replace the
stale ones, preferring native Flutter APIs and, where a package is genuinely
needed, a maintained equivalent. Every swap is small — confirmed usage counts
are 1–2 files each — and must preserve current behaviour exactly.

The safety net is Phase 1: the unit/widget suite (`flutter test`) plus the E2E
smoke suite (`app/integration_test/`, run in CI). Every swap is validated
against `flutter analyze` + that suite.

## Goals / Non-Goals

**Goals:**
- No dead (zero-usage) direct dependency remains in `app/pubspec.yaml`.
- No discontinued/abandoned package remains, except where a documented keep
  decision applies.
- Each replacement preserves observable behaviour (rendering, persistence,
  reorder UX, color math).
- The app stays `flutter analyze`-clean and test-green.

**Non-Goals:**
- Migrating the settings screen off `pref` (see the keep decision below).
- Any Group A/B upgrade (other waves), SDK-constraint changes, backend or
  `openapi/` changes, CI changes.
- Refactors beyond what each swap strictly requires.

## Decisions

### Remove `tuple`, `frontend_server_client`, `state_notifier` outright

All three have zero `package:` imports under `app/lib/`. `tuple` appears only
in commented-out code (`modules/activity/models/difference.dart`).
`frontend_server_client` is a build-tooling transitive that was mistakenly
listed as a direct dep. `state_notifier` is used *as a symbol*
(`StateNotifier`, `StateNotifierProvider` — 5 files) but only via
`hooks_riverpod`'s re-export; `hooks_riverpod` depends on `riverpod`, which
depends on `state_notifier` and re-exports it. Removing the direct dep keeps
those symbols resolvable. **Verification gate:** after removal, `flutter
analyze` must still resolve `StateNotifier`/`StateNotifierProvider`; if it does
not, restore `state_notifier` and escalate — but the re-export is stable in the
pinned `hooks_riverpod ^2.6.1`.

### `flutter_image` → `cached_network_image`

`flutter_image` is marked discontinued on pub.dev. Both call sites use
`NetworkImageWithRetry(url)` purely as the `image:` argument of a `FadeInImage`
(`main.dart` imports it transitively for that; the actual widget use is in
`main.dart`'s import list — confirmed live use is `school_item.dart`).
`CachedNetworkImageProvider` from `cached_network_image` is a drop-in
`ImageProvider`: `FadeInImage(image: CachedNetworkImageProvider(url),
placeholder: ...)`. It preserves resilience on flaky networks (the reason
`NetworkImageWithRetry` was chosen) and adds disk caching for the school logos.

*Alternative considered:* native `NetworkImage`. Rejected — it has no retry and
no caching, a behaviour regression for remote logos on poor connectivity.

`main.dart` only *imports* `flutter_image`; the Applier must check whether the
symbol is actually referenced there and remove a now-dead import if so.

### `color` package → native `HSLColor`

`color_utils.dart` uses the `color` package only inside `darkenColor` /
`lightenColor`, via the private-in-practice helper `colorToRgbColor`. Flutter's
`dart:ui` `HSLColor` covers this natively: `HSLColor.fromColor(c)` →
`.withLightness(l)` → `.toColor()`.

Behaviour note — the current `lightenColor` computes `l / (1 - amount)`, which
can exceed `1.0`. The `color` package's `HslColor` tolerates that; Flutter's
`HSLColor.withLightness` asserts the value is in `0.0..1.0`. The replacement
MUST clamp: `(hsl.lightness / (1 - amount)).clamp(0.0, 1.0)`. `darkenColor`
multiplies by `(1 - amount)` and stays in range, but clamping it too is
harmless and consistent. `hexToColor` / `colorToHex` already use only native
APIs and are unchanged. `colorToRgbColor` becomes unused and is deleted.

### `reorderables` → native `SliverReorderableList`

`event_details_checklist.dart` renders `ReorderableSliverList` +
`ReorderableSliverChildBuilderDelegate` — a sliver inside the event-details
`CustomScrollView`. The native equivalent is `SliverReorderableList(itemBuilder:,
itemCount:, onReorder:)`. Unlike `reorderables`, native `SliverReorderableList`
does not auto-attach a drag gesture: each item must be wrapped in a
`ReorderableDelayedDragStartListener(index: index, child: ...)` to keep the
existing long-press-to-drag UX. `onReorder` keeps the same
`(oldIndex, newIndex)` signature as `notifier.reorderItems` — but verify the
notifier already adjusts for the post-removal index shift (native passes the
raw `newIndex`); if `reorderables` was passing an adjusted index, the Applier
must reconcile (decrement `newIndex` when `newIndex > oldIndex`).

### `enum_to_string` → native enum APIs

Used only in `settings_provider.dart` for `CalendarViewType`:
- `EnumToString.convertToString(value)` → `value.name`.
- `EnumToString.fromString(CalendarViewType.values, s)` → a null-safe lookup,
  since the stored string may be stale/invalid:
  `CalendarViewType.values.where((e) => e.name == s).firstOrNull`. Do NOT use
  `.byName()` directly — it throws on an unknown name, whereas the current code
  relies on a `null` result to fall back to the default.

`EnumToString` matches on the bare enum-value name, identical to `Enum.name`,
so persisted values (`"Week"`, `"Day"`, …) round-trip unchanged.

### Keep `pref` — documented decision

`pref` is **not** removed in B3. It is the entire settings-screen UI framework
(`PrefService`, `PrefPage`, `PrefSwitch`, `PrefDialogButton`, `PrefDialog`,
`PrefRadio`, `PrefTitle` across 3 files), not a leaf utility. It is stale but
still published on pub.dev and compiles against the current SDK — it is not in
the "discontinued/abandoned" class that B3's acceptance criterion targets.
Replacing it means rewriting the settings screen as custom widgets over
`shared_preferences` — a feature-grade UI change with real regression surface,
not a low-risk dependency swap. That work, if desired, belongs in its own
scoped issue. B3 keeps `pref` as-is.

### `flutter_material_color_picker` → `flutter_colorpicker`

One call site (`add_personal_event_screen.dart`) uses `MaterialColorPicker(
selectedColor:, onColorChange:)` inside a dialog. `flutter_colorpicker` is the
maintained equivalent; its `MaterialPicker(pickerColor:, onColorChanged:,
enableLabel: false)` shows the same Material swatch grid with shade selection.
Map `selectedColor` → `pickerColor` and `onColorChange` → `onColorChanged`
(both yield the picked `Color`). `pickerColor` is non-nullable, so pass
`_selectedColor ?? Colors.pink` (matching the existing default). The
`_tempShadeColor` / `onColorChoose` validate-on-confirm flow is unchanged.

## Risks / Trade-offs

- **`state_notifier` re-export breaks** → Mitigation: `flutter analyze` gate
  immediately after removal; restore the dep and escalate if symbols fail to
  resolve.
- **`reorderables` index-shift semantics differ** → Mitigation: the Applier
  must read `ChecklistItemNotifier.reorderItems` and confirm the index
  convention; verified via the checklist reorder path in the widget test / E2E
  smoke suite.
- **Color picker visual/UX drift** → Mitigation: `flutter_colorpicker`'s
  `MaterialPicker` is the closest analogue; the dialog wrapper, actions, and
  confirm flow are untouched, so only the swatch widget itself changes.
- **`HSLColor` clamping changes extreme colors** → Mitigation: clamping only
  affects out-of-gamut inputs that the old code would have pushed past pure
  white; for the in-app event-color palette this is not reachable. Verified by
  the existing `color_utils` unit tests if present, else add a smoke check.
- **`cached_network_image` adds a transitive surface** → Accepted: it is
  well-maintained and widely used; the net dependency count still drops.

## Migration Plan

Single PR, applied in the order of `tasks.md`: pubspec edits last-ish so the
source swaps and `flutter pub get` land together. Rollback is a straight revert
of the PR — no data migration, no persisted-format change (enum strings and
color hex strings are byte-identical before and after).

## Open Questions

None blocking. The `pref` keep decision is final for B3; a follow-up settings-UI
issue can be filed separately by FoundingEngineer if the team wants `pref` gone.
