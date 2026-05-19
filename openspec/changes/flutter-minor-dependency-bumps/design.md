## Context

B1 ([TIM-36](/TIM/issues/TIM-36)) produced a dependency audit that sorts every
direct dependency in `app/pubspec.yaml` into risk groups. Group A is the
"mechanical / minor" set: latest releases are minor or patch bumps within the
same major, with no API breaks called out in their changelogs. B2 applies
Group A. The constraint is to stay strictly mechanical — no source edits, no
refactors — so the change is trivially reviewable and trivially revertable.

## Goals / Non-Goals

**Goals:**
- All 14 packages resolve to their target versions in `pubspec.lock`.
- `flutter analyze` and `flutter test` stay clean.
- The diff is exactly: `pubspec.yaml`, `pubspec.lock`, and regenerated codegen.

**Non-Goals:**
- Any Group B/C (breaking) upgrade — separate later waves.
- Touching `openapi/dart` or the Flutter/Dart SDK constraint.
- Hand edits to generated files or any production source.

## Decisions

### Bump the constraint floor, not just re-resolve

Some targets (`json_annotation`, `mobile_scanner`, `uuid`) are already admitted
by the existing caret ranges yet stayed pinned to an older version because
nothing forced a re-resolve. Raising the caret floor to the target version
(`^4.12.0`, `^7.2.0`, `^4.5.3`) makes the resolution deterministic and records
the intended baseline in `pubspec.yaml` itself, rather than relying on lockfile
state. Every package in the table gets its floor raised to the target.

### Regenerate codegen rather than hand-patch

`build_runner`, `built_value`/`built_value_generator`, `freezed` and
`json_serializable` all influence generated output. The 11 committed
`*.freezed.dart` / `*.g.dart` files under `app/lib/` are regenerated with
`dart run build_runner build --delete-conflicting-outputs`. Whatever diff that
produces is the authoritative output for the new versions; it is committed
as-is and is the only change permitted inside `lib/`. If regeneration produces
a *behavioural* diff (not just formatting/header churn), that is a signal the
package is not actually Group A — stop and escalate rather than absorb it.

### Verification: local for unit, CI for E2E

`flutter pub get`, `flutter analyze`, and `flutter test` run locally on the
dev host. The Phase 1 E2E smoke suite (`app/integration_test/`) needs an
Android emulator; the dev host has no KVM (see [TIM-33](/TIM/issues/TIM-33) /
[TIM-34](/TIM/issues/TIM-34)), so E2E is verified by the CI `test-app` /
integration job on the PR, not locally. The PR must not be handed to Review
until CI is green.

## Risks / Trade-offs

- **Transitive resolution conflict** — raising a floor could be rejected by
  another package's cap. Mitigation: `flutter pub get` fails fast; if it does,
  the offending package is not Group A — drop it from this change and report
  it back to B1/TIM-36 for re-triage.
- **Codegen behavioural drift** — addressed above: a non-cosmetic generated
  diff is an escalation trigger, not something to silently commit.
- **Rollback** — trivial: revert `pubspec.yaml` + `pubspec.lock` + the
  regenerated files. No migration, no data, no API surface touched.
