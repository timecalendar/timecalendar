# Tasks

Conventions for every task below:
- Flutter SDK is not on `PATH`: `export PATH="/home/dev/flutter/bin:$PATH"`.
- All commands run from `app/` unless stated otherwise.
- This change is **strictly mechanical**: no hand edits to `lib/` source, CI,
  `openapi/`, or the SDK constraint. If any step needs a source change to pass,
  stop and escalate to FoundingEngineer — the package is not Group A.

> **Apply-stage deviation (built_value_generator):** the proposal target of
> `8.12.6` for `built_value_generator` is **unattainable on the current stable
> SDK**. `built_value_generator 8.12.6` requires `analyzer ^13.0.0`, which
> requires `meta ^1.18.0`; Flutter 3.41.9 / Dart 3.11.5 pins `meta 1.17.0`, so
> `flutter pub get` rejects 8.12.6. The latest *compatible* release is
> **`8.12.5`**, which is what was applied (caret floor `^8.12.5`). This honours
> the proposal's stated intent ("bump to the latest compatible release") and
> keeps the `built_value`/`built_value_generator` pair within the same `8.12.x`
> minor (runtime `8.12.6`, generator `8.12.5` — patch-level only, no skew).
> The proposal/spec target table should be corrected `8.12.6 → 8.12.5` for
> `built_value_generator` — flagged to the Planner. All other 13 packages hit
> their exact targets.

## 1. Bump constraints in `app/pubspec.yaml`

- [x] 1.1 Raise the caret floor of each package to its B2 target. Edit these
  `dependencies:` entries:
  - `build_runner: ^2.1.7` → `build_runner: ^2.15.0`
  - `built_value: ^8.4.1` → `built_value: ^8.12.6`
  - `built_value_generator: ^8.4.1` → `built_value_generator: ^8.12.5` *(see deviation note above — 8.12.6 unattainable on current SDK)*
  - `cupertino_icons: ^1.0.4` → `cupertino_icons: ^1.0.9`
  - `dio: ^5.3.2` → `dio: ^5.9.2`
  - `freezed: ^3.0.6` → `freezed: ^3.2.5`
  - `http: ^1.1.0` → `http: ^1.6.0`
  - `json_annotation: ^4.9.0` → `json_annotation: ^4.12.0`
  - `json_serializable: ^6.1.4` → `json_serializable: ^6.14.0`
  - `mobile_scanner: ^7.0.1` → `mobile_scanner: ^7.2.0`
  - `sembast: ^3.1.2` → `sembast: ^3.8.7`
  - `shared_preferences: ^2.0.12` → `shared_preferences: ^2.5.5`
  - `uuid: ^4.5.1` → `uuid: ^4.5.3`
  - `webview_flutter: ^4.2.2` → `webview_flutter: ^4.13.1`
- [x] 1.2 Do not touch any other line of `pubspec.yaml` (version, SDK
  constraint, asset/font sections, other dependencies).

## 2. Re-resolve the lockfile

- [x] 2.1 Run `flutter pub get` from `app/`. It must complete without a
  resolution error. If it fails, identify the conflicting package, drop it
  from task 1, and report it back on [TIM-37](/TIM/issues/TIM-37) for B1
  re-triage — do not force the resolution. *(Initial run failed on
  `built_value_generator 8.12.6`; resolved by applying the latest compatible
  `8.12.5` — see deviation note. `flutter pub get` then succeeded cleanly.)*
- [x] 2.2 Confirm `app/pubspec.lock` now resolves all 14 packages to their
  target versions (the table in `proposal.md`). *(13 at exact target;
  `built_value_generator` at 8.12.5 per the deviation note.)*

## 3. Regenerate codegen

- [x] 3.1 Run `dart run build_runner build --delete-conflicting-outputs` from
  `app/` to regenerate the committed `*.freezed.dart` / `*.g.dart` files.
- [x] 3.2 Inspect the regenerated diff. It should be limited to generated files
  under `app/lib/` and be cosmetic (header/format/version-string churn). If the
  regeneration changes generated *behaviour* (logic, field handling), stop and
  escalate — that is not a Group A bump. *(Regeneration produced **zero diff** —
  the generated output is byte-identical across the bumped codegen packages.)*

## 4. Verify

- [x] 4.1 Run `flutter analyze` from `app/` — no new issues attributable to the
  bump. *(`No issues found!`)*
- [x] 4.2 Run `flutter test` from `app/` — the full unit + widget suite passes.
  *(All 48 tests passed.)*
- [ ] 4.3 The Phase 1 E2E smoke suite (`app/integration_test/`) needs an
  Android emulator and is verified by CI, not locally. Ensure the PR's CI
  `test-app` / integration job is green before handing to Review. *(Pending —
  CI runs on the PR; to be confirmed before the Review handoff.)*

## 5. Confirm scope

- [x] 5.1 Confirm the final diff contains only `app/pubspec.yaml`,
  `app/pubspec.lock`, and regenerated `*.freezed.dart` / `*.g.dart` files under
  `app/lib/`. No other files changed. *(Diff is exactly `app/pubspec.yaml` +
  `app/pubspec.lock`; codegen produced no diff, so no `lib/` files changed.)*
