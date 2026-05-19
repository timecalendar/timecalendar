## Why

Phase 2 ([TIM-3](/TIM/issues/TIM-3)) is the dependency-upgrade & maintenance
phase. The B1 audit ([TIM-36](/TIM/issues/TIM-36), Group C) found a set of
direct Flutter dependencies in `app/pubspec.yaml` that are either **dead**
(zero usages) or **stale** (years without a release, in two cases officially
discontinued). They are dependency-graph and security debt: they pin old
transitive packages and block later upgrade waves.

This change (B3 / [TIM-38](/TIM/issues/TIM-38)) removes the dead packages and
swaps the stale ones for native Flutter APIs or maintained equivalents. It is
low-risk and well-bounded: each swap touches one or two files, and the audit
has already confirmed the usage counts.

## What Changes

- **Remove 3 dead direct dependencies** — `tuple`, `frontend_server_client`,
  `state_notifier` — from `app/pubspec.yaml`. They have zero `package:` imports
  in `app/lib/`. `StateNotifier`/`StateNotifierProvider` remain available via
  `hooks_riverpod`'s re-export, so no source changes are needed.
- **Replace `flutter_image`** (officially discontinued; 2 files) — swap
  `NetworkImageWithRetry` for `cached_network_image`'s `CachedNetworkImageProvider`
  inside the existing `FadeInImage` widgets.
- **Replace `color`** (5y stale; 1 file) — rewrite `ColorUtils.darkenColor` /
  `lightenColor` on Flutter's native `HSLColor`; drop the now-unused
  `colorToRgbColor` helper.
- **Replace `reorderables`** (3y stale; 1 file) — swap `ReorderableSliverList`
  for the native `SliverReorderableList`.
- **Replace `enum_to_string`** (1 file) — swap `EnumToString.fromString` /
  `convertToString` for native `Enum.name` + a safe `values.byName` lookup.
- **Replace `flutter_material_color_picker`** (stale; 1 file) — swap
  `MaterialColorPicker` for the maintained `flutter_colorpicker` package's
  `MaterialPicker`.
- **Keep `pref`** — documented keep decision (see design.md). `pref` is the
  whole settings-screen UI framework, not a utility; it is stale but still
  published and SDK-compatible. Migrating off it is a settings-UI rewrite, out
  of scope for a low-risk B3 swap.

Net pubspec effect: 6 direct dependencies removed (`tuple`,
`frontend_server_client`, `state_notifier`, `flutter_image`, `color`,
`reorderables`, `enum_to_string`, `flutter_material_color_picker` — 8 removed),
2 added (`cached_network_image`, `flutter_colorpicker`).

## Capabilities

### New Capabilities
- `flutter-dependency-hygiene`: records the requirement that the app's direct
  Flutter dependencies carry no dead (unused) packages and no
  abandoned/discontinued packages, and that B3's specific removals and swaps
  land analyze-clean and test-green.

### Modified Capabilities
<!-- None — `flutter-dependency-baseline` (B2) and `flutter-test-harness` are
     unchanged; this change is complementary to them. -->

## Impact

- `app/pubspec.yaml` — 8 direct deps removed, 2 added.
- `app/pubspec.lock` — re-resolved.
- `app/lib/main.dart`, `app/lib/modules/school/screens/school_selection/school_item.dart`
  — `flutter_image` → `cached_network_image`.
- `app/lib/modules/shared/utils/color_utils.dart` — `color` → native `HSLColor`.
- `app/lib/modules/event_details/widgets/event_details_checklist.dart`
  — `reorderables` → `SliverReorderableList`.
- `app/lib/modules/settings/providers/settings_provider.dart`
  — `enum_to_string` → native enum APIs.
- `app/lib/modules/personal_event/screens/add_personal_event_screen.dart`
  — `flutter_material_color_picker` → `flutter_colorpicker`.
- No backend / `openapi/` / CI / SDK-constraint changes. Behaviour is preserved
  in every swap.
