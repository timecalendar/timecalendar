## Why

Phase 2 ([TIM-3](/TIM/issues/TIM-3)) is the dependency-upgrade & maintenance
phase. The B1 audit ([TIM-36](/TIM/issues/TIM-36)) triaged every direct Flutter
dependency in `app/pubspec.yaml` into risk groups. **Group A** is the set of
packages whose latest releases are minor/patch bumps with no documented API
breaks — mechanical to apply and safe to land in a single PR.

This change (B2 / [TIM-37](/TIM/issues/TIM-37)) brings those Group A packages
current. Doing it as one tight, low-risk PR clears the easy wins so later waves
(B3+) can focus on the genuinely breaking upgrades without noise.

## What Changes

Bump the version constraints of the Group A direct dependencies in
`app/pubspec.yaml` to the latest compatible release, re-resolve `pubspec.lock`,
regenerate committed codegen output, and verify the app stays analyze-clean and
test-green.

13 packages from the [TIM-37](/TIM/issues/TIM-37) scope, plus
`built_value_generator` (see note):

| Package | Locked now | Target |
|---|---|---|
| build_runner | 2.7.0 | 2.15.0 |
| built_value | 8.11.1 | 8.12.6 |
| built_value_generator | 8.11.1 | 8.12.6 |
| cupertino_icons | 1.0.8 | 1.0.9 |
| dio | 5.9.0 | 5.9.2 |
| freezed | 3.2.0 | 3.2.5 |
| http | 1.5.0 | 1.6.0 |
| json_annotation | 4.9.0 | 4.12.0 |
| json_serializable | 6.10.0 | 6.14.0 |
| mobile_scanner | 7.0.1 | 7.2.0 |
| sembast | 3.8.5+1 | 3.8.7 |
| shared_preferences | 2.5.3 | 2.5.5 |
| uuid | 4.5.1 | 4.5.3 |
| webview_flutter | 4.13.0 | 4.13.1 |

**Note on `built_value_generator`:** TIM-37 lists 13 packages and omits
`built_value_generator`, but `built_value` and `built_value_generator` are a
versioned pair from the same family and must move together to avoid a
runtime/generator skew. It is added here at the matching target (8.12.6) as an
in-scope mechanical follow-on, not a scope expansion.

The four codegen packages (`build_runner`, `built_value`/`built_value_generator`,
`freezed`, `json_serializable`) require regenerating the 11 committed
`*.freezed.dart` / `*.g.dart` files under `app/lib/`. Any resulting diff is
expected output and is the only permitted change to `lib/`.

Non-goals: any dependency outside Group A (B3+ waves), the `openapi/dart`
package's own `pubspec.yaml` (its `built_value` range `>=8.4.0 <9.0.0` already
admits 8.12.6 — no change needed), hand-written `lib/` source changes,
refactors, CI changes, and bumping the Flutter/Dart SDK constraint.

## Capabilities

### New Capabilities
- `flutter-dependency-baseline`: records the maintained known-good baseline for
  the app's direct Flutter dependencies — one requirement covering the Group A
  target versions and the analyze/test gate the bump must pass.

### Modified Capabilities
<!-- None — `flutter-test-harness` is unchanged; this change consumes it. -->

## Impact

- `app/pubspec.yaml` — 14 version constraints bumped (lines 21, 23–24, and the
  Group A entries between lines 25–67).
- `app/pubspec.lock` — re-resolved to the target versions.
- `app/lib/**/*.freezed.dart`, `app/lib/**/*.g.dart` — regenerated build_runner
  output (no hand edits).
- No behavioural change to the app. No CI, `openapi/`, or SDK changes.
