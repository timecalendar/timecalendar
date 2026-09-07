# 09 — Resolved decisions and remaining evidence

← [08 — QA report](./08-qa-execution-report-template.md) · [Section index](./README.md)

> The original questions in this file have been resolved into the canonical
> [data-migration specification](../05-tech-specs/data-migration.md). The `Q-nn` identifiers and
> anchors remain stable for existing links. Items marked **evidence required** are execution gates,
> not undecided product behavior.

## How to use this document

Do not ask QA to reinterpret a resolved decision. Test the stated contract and record `PASS` or
`FAIL`. For an evidence-required item, record what was observed on the signed physical build and
leave the gate open until the required artifact exists.

<a id="q-01--is-the-phase-09-importer-in-the-build-under-test"></a>
## Q-01 — Is the Phase 09 importer in the build under test?

**Build-specific precondition.** Engineering must identify the importer version in the build note.
If absent, run only the build-safety subset defined by [B-3](./01-scope-prerequisites-and-execution-order.md#b-3--does-the-build-contain-the-importer)
and mark migration assertions `N/A — importer not in build`.

<a id="q-02--which-shared_preferences-backend-does-android-use"></a>
## Q-02 — Which `shared_preferences` backend does Android use?

**Resolved from pinned code; physical evidence required.** The released app calls
`SharedPreferences.getInstance()`. Its pinned Android implementation reads native
`FlutterSharedPreferences`, producing `flutter.`-prefixed values in the legacy XML backend rather
than DataStore. The signed-device run must still prove the real file is present and survives the
Play update.

<a id="q-03--where-does-sembast-live-on-android-and-does-it-survive-the-swap"></a>
## Q-03 — Where does Sembast live on Android and does it survive the swap?

**Evidence required.** Source code establishes `simple_database.db` below Flutter's application
documents directory. Record its real production path and existence before/after an in-place Play
update. Also record Android backup/restore behavior. Never publish raw file contents.

<a id="q-04--are-the-flutter-only-calendar-preferences-intentionally-dropped"></a>
## Q-04 — Which Flutter calendar preferences are retained?

**Resolved.** Import `show_weekends` and `startup_screen`. Drop `colors_by_group`,
`calendar_view_type`, and `calendar_hour_height`, retaining RN defaults for the dropped values.

<a id="q-05--should-flutters-notification-preferences-be-imported"></a>
## Q-05 — Which notification preferences are retained?

**Resolved.** Import `notification_calendar` into RN notifications-enabled. Drop `date_limit` and
use the RN default horizon of 7 days. Notification frequency has no Flutter source and keeps its RN
default.

<a id="q-06--should-the-importer-seed-the-rn-school-selection-from-user_calendarsschoolid"></a>
## Q-06 — How does a migrated calendar affect onboarding?

**Resolved.** Do not synthesize school/group selection. At least one imported or identically
pre-existing calendar sets the migration-specific onboarding-suppression state, so the upgrading
student is not sent through onboarding.

<a id="q-07--how-should-a-dark-mode-lightened-colour-be-treated-on-import"></a>
## Q-07 — How is a personal-event colour imported?

**Resolved.** Copy every valid stored `#RRGGBB` colour exactly as stored, including letter case.
Do not darken, lighten, or reinterpret it. A small dark-mode visual difference is acceptable.

<a id="q-08--is-the-activité-feature-intentionally-not-ported"></a>
## Q-08 — How is Activity handled?

**Resolved.** RN has an Activity feature and SQLite `activity_logs`/`activity_state` cache tables.
Do not import Flutter `calendar_logs`, `new_activity`, or `last_activity_update`; the Activity
runtime re-syncs after the migration gate.

<a id="q-09--is-hiddenevents-being-backend-bound-correct-for-a-migrated-user"></a>
## Q-09 — How are hidden events scoped?

**Resolved.** Import them into the existing backend-bound MMKV set. Environment reset recovery
runs before migration; import runs only against production. A later environment switch follows
the standard backend-bound reset contract.

<a id="q-10--which-preferences-does-the-importer-actually-copy"></a>
## Q-10 — What is the exact preference allowlist?

**Resolved.** Import changelog seen version, theme (with `dark_mode` fallback), notifications
enabled, startup tab, and weekend visibility. Drop all other Flutter preferences. Each preference
is best effort: an invalid value is skipped, the RN default remains, the run settles partial, and
valid siblings continue.

<a id="q-11--is-the-one-release-sembast-safety-net-implemented"></a>
## Q-11 — How long is legacy data retained?

**Resolved.** Retain the Flutter Sembast file and preference keys indefinitely. The importer never
deletes, truncates, renames, rewrites, or moves them. There is no reverse bridge; downgrade can
lose RN-only changes.

<a id="q-12--is-there-any-user-visible-signal-that-the-migration-ran"></a>
## Q-12 — What does the user see when migration succeeds or fails?

**Resolved.** Migration is invisible. Keep the splash/loading gate while the attempt runs, even
past ten seconds. There is no migration warning, recovery screen, skip button, or support export.
A process kill during `IN_PROGRESS` retries next launch. A handled attempt settles success,
partial, or failed, enqueues a sanitized report, and lets the app continue.

## Additional resolved contracts

- Existing divergent RN data always wins. Identical data is already applied; absent data imports.
- Recover valid records and preferences when siblings are invalid. A truncated final JSONL line
  does not discard the complete prefix.
- Every terminal result creates an idempotent first-party report. The offline outbox retries
  independently and never reopens migration.
- Reports include outcome, attempt count, duration, imported/already/skipped counts, bounded
  stages/error codes, release/platform/source version, and calendar IDs in the protected report
  table only. They never include tokens, event/checklist text, raw files, or other private values.
- Internal TestFlight and Play internal/closed-track upgrade passes are required on physical
  devices, followed by final production App Store and public Play update gates.

## Remaining evidence gates

| Gate | Required evidence | Where recorded |
| --- | --- | --- |
| Q-01 | importer version/build note | report build header |
| Q-02 | Android XML backend present and retained | Android evidence section |
| Q-03 | Android Sembast path, update survival, backup behavior | Android evidence section |
| iOS physical | container and prefs survive signed TestFlight update | iOS evidence section |
| performance | low-end release-mode duration and peak memory | `OFF-19` + report |
| production stores | final public-listing in-place passes on both platforms | release gate report |

---

← [08 — QA report](./08-qa-execution-report-template.md) · [Section index](./README.md)
