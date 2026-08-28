# 09 — Open engineering questions

← [08 — QA execution report](./08-qa-execution-report-template.md) · [Section index](./README.md)

> Every "unknown" in the [data inventory](./02-persisted-data-inventory.md), written as the exact
> question engineering must answer before the corresponding expectation can be stated as a
> pass/fail criterion.
>
> **These are questions, not verdicts.** Nothing here is labelled a release blocker, and nothing
> here proposes an implementation — that is deliberate
> ([Non-goals](./README.md#non-goals)). Answers belong in the roadmap
> ([`../01-roadmap/09-data-migration.md`](../01-roadmap/09-data-migration.md)) or an ADR, not in
> this file.

---

## How to use this document

- A QA run that **observes** an answer records it in the report's
  [Open questions](./08-qa-execution-report-template.md#open-questions-raised-or-answered) table
  with the evidence.
- A question that cannot be answered by observation needs an engineering decision. Route it
  through the normal channel; if it needs the app owner specifically, that is what
  [`../inbox/`](../inbox/README.md) is for.
- When a question is settled, update the inventory row it belongs to and delete the question here.

---

<a id="q-01--is-the-phase-09-importer-in-the-build-under-test"></a>
## Q-01 — Is the Phase 09 importer in the build under test?

**Why it is open.** As of writing, `mobile/` contains no code that reads Flutter's sembast database
or `flutter.`-prefixed preferences. The evidence is set out in
[B-3](./01-scope-prerequisites-and-execution-order.md#b-3--does-the-build-contain-the-importer):
no `migration` feature module, no filesystem or native-preferences dependency in
`mobile/package.json`, and the only mentions of "sembast" in `mobile/src/` are comments describing
the schema's *readiness to receive* imported rows.

The RN schema is unambiguously **designed** for it — every table in `mobile/src/db/schema.ts`
documents that its columns mirror the Flutter wire format verbatim "so the Phase-09 one-shot
importer can write recovered rows with no data loss", and `upsert` in the user-calendars repository
accepts a caller-supplied id specifically so the importer can pass its own. The target exists; the
importer does not.

**The question.** *For each candidate build: does it contain the Phase 09 importer — yes or no?*

**Who answers.** Engineering, in writing, in the build's release note.

**Why it matters to QA.** It decides whether an absent personal event is a defect or an unbuilt
feature. Without the answer, a whole run's results are uninterpretable — which is why
[B-3](./01-scope-prerequisites-and-execution-order.md#b-3--does-the-build-contain-the-importer)
says **do not start** when it is unknown.

**Related:** [D-01](./02-persisted-data-inventory.md#d-01)…[D-15](./02-persisted-data-inventory.md#d-15) — effectively every 🔴 row.

---

<a id="q-02--which-shared_preferences-backend-does-android-use"></a>
## Q-02 — Which `shared_preferences` backend does Android use?

**Why it is open.** iOS is settled: `flutter.`-prefixed keys in
`Library/Preferences/fr.samuelprak.timecalendar.plist`, confirmed on a device
([`../00-exploration/data-persistence-migration.md` §6](../00-exploration/data-persistence-migration.md#6-device-verification-done)).
Android is not: `shared_preferences` 2.5.5 can use either the legacy `SharedPreferences` backend
(XML at `shared_prefs/FlutterSharedPreferences.xml`) or the newer `SharedPreferencesAsync` /
DataStore backend, which writes somewhere else entirely. Open since 2026-06-15
([`../inbox/2026-06-15-android-storage-verification.md`](../inbox/2026-06-15-android-storage-verification.md)).

**The question.** *On a real Android device running the released Flutter build, is
`shared_prefs/FlutterSharedPreferences.xml` present with `flutter.`-prefixed keys, or is there a
`datastore/` directory instead?*

**Who answers.** Whoever has a debuggable Android install or a rooted test device. The commands are
in [05 §6](./05-android-in-place-update.md#before-the-update-flutter-installed) — a QA run on a
suitable device closes this in five minutes.

**Why it matters to QA.** If Android preference migration fails while iOS passes, this is the
first explanation to check, and the `adb` output is the evidence engineering needs.

**Related:** [D-14](./02-persisted-data-inventory.md#d-14)…[D-20](./02-persisted-data-inventory.md#d-20).

---

<a id="q-03--where-does-sembast-live-on-android-and-does-it-survive-the-swap"></a>
## Q-03 — Where does sembast live on Android, and does it survive the swap?

**Why it is open.** `getApplicationDocumentsDirectory()` resolves differently per platform. On
Android it has not been confirmed where `simple_database.db` lands, nor — critically — that the
file is still there after a Play update replaces the binary. It *should* be (same `applicationId`
⇒ same data directory), but "should" is not "verified". Same source as
[Q-02](#q-02--which-shared_preferences-backend-does-android-use).

**The question.** *On a real Android device: where is `simple_database.db`, is it JSONL, and is it
byte-identical after an in-place update?*

**Who answers.** Same as Q-02. The before/after `find` commands in
[05 §6](./05-android-in-place-update.md#6-collecting-storage-evidence) answer it directly, and
`REC-04` is the scenario that records the "after" half.

**Why it matters to QA.** It is the difference between "the importer has a bug" and "the importer
had nothing to read".

**Related:** [D-01](./02-persisted-data-inventory.md#d-01)…[D-11](./02-persisted-data-inventory.md#d-11), [D-28](./02-persisted-data-inventory.md#d-28).

---

<a id="q-04--are-the-flutter-only-calendar-preferences-intentionally-dropped"></a>
## Q-04 — Are the Flutter-only calendar preferences intentionally dropped?

**Why it is open.** Five Flutter preferences have **no RN counterpart at all** — no storage key, no
settings row:

| Flutter key | Default | RN |
| --- | --- | --- |
| `calendar_view_type` (`Week` \| `Planning`) | `Week` | View is component state, reset to `"week"` every launch |
| `show_weekends` | `true` | No key, no setting |
| `colors_by_group` | `false` | No key, no setting |
| `calendar_hour_height` | `60.0` | No key, no setting |
| `startup_screen` (`home` \| `calendar`) | `home` | No key, no setting; always opens Accueil |

The RN app has its own preference set (theme, language, display timezone, notifications) that does
not include these. This looks like a deliberate product simplification rather than an oversight,
but nothing in the roadmap says so explicitly.

**The question.** *Are these five intentionally dropped in 4.0, deferred to a later release, or an
oversight? If dropped, is the loss of a student's chosen view type / startup screen acceptable
without a note in the changelog?*

**Who answers.** Product / the app owner.

**Why it matters to QA.** `OFF-13` currently records them as observations with no pass/fail
criterion. An answer turns it into a real assertion (or confirms it should stay an observation).

**Related:** [D-16](./02-persisted-data-inventory.md#d-16), [D-17](./02-persisted-data-inventory.md#d-17).

---

<a id="q-05--should-flutters-notification-preferences-be-imported"></a>
## Q-05 — Should Flutter's notification preferences be imported?

**Why it is open.** Flutter persists `notification_calendar` (default `true`) and `date_limit`
(default `14`), but the UI that changed them is commented out and the settings screen shows them as
temporarily disabled — so essentially every real install carries the defaults. RN has
`notifications.isActive` (default `true`), `notifications.nbDaysAhead` (default **7**, deliberately
different, clamped 1–30) and `notifications.frequency` (no Flutter equivalent).

Because the Flutter values are almost always defaults, importing them would change little — but
"almost always" is not "always", and an old install could carry a `date_limit` a student set years
ago through the then-working UI.

**The question.** *Should the importer copy `notification_calendar` → `notifications.isActive` and
`date_limit` → `notifications.nbDaysAhead` (clamped to 1–30)? Or should a migrated user simply get
the RN defaults?*

**Who answers.** Engineering + product.

**Why it matters to QA.** `OFF-15` currently accepts **either** 7 or 14 for days-ahead and asks the
tester to record which. An answer makes one of them correct.

**Related:** [D-18](./02-persisted-data-inventory.md#d-18), [D-25](./02-persisted-data-inventory.md#d-25).

---

<a id="q-06--should-the-importer-seed-the-rn-school-selection-from-user_calendarsschoolid"></a>
## Q-06 — Should the importer seed the RN school selection from `user_calendars.schoolId`?

**Why it is open.** RN persists a school selection (`schoolSelection.schoolId` +
`schoolSelection.groupValues`) and derives `isOnboardingComplete()` from its presence
(`mobile/src/features/school-selection/store/store.ts`). **Flutter never writes anything
equivalent** — its school and grade choices are transient, and the only durable trace is
`user_calendars.schoolId` / `schoolName` on the calendar row.

So a migrated student has calendars but no school selection. There is no redirect-to-onboarding
gate in `mobile/src/app/`, so nothing appears to break today — but the mismatch is real, and any
future surface that gates on `isOnboardingComplete()` would strand exactly this population.

**The question.** *Should the importer synthesise a school selection from the migrated
`user_calendars.schoolId`? Or is "onboarding complete" going to be re-derived from the presence of
a calendar instead?*

**Who answers.** Engineering.

**Why it matters to QA.** `OFF-14` verifies today's observable behaviour (the student is not sent
back through onboarding) but cannot verify the invariant behind it. It also asks the tester to
record whether the school name appears where it would only appear if the selection were
synthesised — that observation is the input to this question.

**Related:** [D-23](./02-persisted-data-inventory.md#d-23).

---

<a id="q-07--how-should-a-dark-mode-lightened-colour-be-treated-on-import"></a>
## Q-07 — How should a dark-mode-lightened colour be treated on import?

**Why it is open.** Flutter does not store the colour a student picked. In dark mode it *lightens*
the picked colour before storing (`SettingsProvider.getEventColorToSave` → `ColorUtils.lightenEvent`,
+0.28 HSL lightness) and *darkens* it again for display
(`getEventColorToDisplay` / `getEventInterfaceColor`). So the stored hex depends on which theme was
active at creation time, and a dark-mode student's stored hexes are systematically lighter than
what they saw.

RN's schema stores the hex verbatim (`mobile/src/db/schema.ts:25`) and has no equivalent
theme-dependent transform. Imported verbatim, a dark-mode user's events will render **lighter** in
RN than they did in Flutter — same data, different appearance.

**The question.** *Is a verbatim colour import the intended behaviour, accepting that dark-mode
users' events shift lighter? Or should the importer invert Flutter's dark-mode lightening for
events created in dark mode — which is not reliably determinable per event, since the theme at
creation time is not recorded?*

**Who answers.** Engineering + design.

**Why it matters to QA.** [03](./03-flutter-seed-packs.md) works around it by requiring events to
be seeded in **light** mode, so the comparison is unambiguous. That is a QA workaround, not an
answer — real students' data will include dark-mode-created events. `OFF-04` asks the tester to
record any visible shift and reference this question rather than call it a defect.

**Related:** [D-05](./02-persisted-data-inventory.md#d-05).

---

<a id="q-08--is-the-activité-feature-intentionally-not-ported"></a>
## Q-08 — Is the Activité feature intentionally not ported?

**Why it is open.** Flutter has an Activité feed of timetable changes (`app/lib/modules/activity/`),
backed by the `calendar_logs` sembast store and the `GET /calendar-logs` endpoint, plus two
preference keys for its unread badge (`new_activity`, `last_activity_update`). There is no
corresponding feature in `mobile/src/features/`.

The data itself is server-owned, so nothing is *lost*. But a student who used the feature will find
it gone.

**The question.** *Is Activité out of scope for 4.0 by decision, deferred, or simply not built
yet? Should its absence be called out in the release notes for upgrading users?*

**Who answers.** Product / the app owner.

**Why it matters to QA.** `OFF-13` records the absence. An answer determines whether that
observation is expected or is itself a finding.

**Related:** [D-13](./02-persisted-data-inventory.md#d-13), [D-20](./02-persisted-data-inventory.md#d-20).

---

<a id="q-09--is-hiddenevents-being-backend-bound-correct-for-a-migrated-user"></a>
## Q-09 — Is `hiddenEvents` being `backend-bound` correct for a migrated user?

**Why it is open.** `mobile/src/storage/index.ts` classifies every storage key. `hiddenEvents.set`
is classified `backend-bound`, meaning `clearBackendBoundStorage()` deletes it when the backend
environment is switched — alongside `resetBackendDatabase()`, which truncates `checklist_items`,
`calendar_events`, `user_calendars` and `personal_events` (`mobile/src/db/reset.ts`).

Production builds lock the environment, so this should never fire for a real student. But the
hidden set is irreplaceable device-owned data with no server copy — the same class as personal
events, which are *also* wiped by that reset. The classification deserves an explicit confirmation
rather than being inferred from "production is locked".

**The question.** *Is it intended that a backend-environment switch destroys the student's hidden
set, personal events and checklists? Is the switch reachable in any build a real student can
install?*

**Who answers.** Engineering.

**Why it matters to QA.** [D-27](./02-persisted-data-inventory.md#d-27) tells testers never to
touch the switch during a run, because it looks identical to total migration failure. If it is
genuinely unreachable in production, that warning can be softened.

**Related:** [D-11](./02-persisted-data-inventory.md#d-11), [D-27](./02-persisted-data-inventory.md#d-27).

---

<a id="q-10--which-preferences-does-the-importer-actually-copy"></a>
## Q-10 — Which preferences does the importer actually copy?

**Why it is open.** Roadmap 09 step 4 says: "**Optionally** copy `flutter.`-prefixed settings
(theme, view type) for UX continuity. Low stakes." It names "theme, view type" as examples and
does not commit to a list — and view type has no RN target anyway
([Q-04](#q-04--are-the-flutter-only-calendar-preferences-intentionally-dropped)). Step 1, by
contrast, is emphatic that `current_version` **must** be imported before `(tabs)` mounts.

So exactly one preference import is specified as mandatory, one is called optional-by-example, and
the rest are unaddressed.

**The question.** *What is the definitive list of preferences the importer copies? Specifically: is
`theme` → `settings.themePreference` in or out?*

**Who answers.** Engineering.

**Why it matters to QA.** `OFF-12` cannot state a pass criterion for the theme without it. Today it
records what it sees and cross-references this question.

**Related:** [D-14](./02-persisted-data-inventory.md#d-14), [D-15](./02-persisted-data-inventory.md#d-15), [D-18](./02-persisted-data-inventory.md#d-18).

---

<a id="q-11--is-the-one-release-sembast-safety-net-implemented"></a>
## Q-11 — Is the one-release sembast safety net implemented?

**Why it is open.** Roadmap 09 step 6 specifies keeping `simple_database.db` on disk for one
release so a botched migration is recoverable. Whether the shipped importer honours that — and
whether anything ever deletes the file — is not determinable from the current source, because the
importer does not exist yet ([Q-01](#q-01--is-the-phase-09-importer-in-the-build-under-test)).

**The question.** *Does the importer leave the legacy sembast file in place? Is there a planned
release at which it gets cleaned up, and what triggers that?*

**Who answers.** Engineering.

**Why it matters to QA.** `REC-04` checks for the file, but on a production Android install
`run-as` is unavailable and on iOS container download needs a development-signed build — so QA will
frequently have to record **`NOT OBSERVABLE`**. An engineering answer is often the only way this
gets confirmed.

**Related:** [D-28](./02-persisted-data-inventory.md#d-28).

---

<a id="q-12--is-there-any-user-visible-signal-that-the-migration-ran"></a>
## Q-12 — Is there any user-visible signal that the migration ran?

**Why it is open.** Nothing in the roadmap or the current source describes a progress indicator, a
completion toast, or an error surface for the import. For a small dataset an instant, invisible
import is ideal. For [`SEED-B`](./03-flutter-seed-packs.md#4-seed-b--the-large-pack)-sized data it
may take long enough that a student sees a blank app and assumes their data is gone — and if the
import *fails*, a silent failure is indistinguishable from "the app is still loading".

**The question.** *Is the import silent by design? If it can fail, is there a user-visible failure
state, or is failure only reported to Crashlytics? Is there any signal QA can use to know the
import finished, rather than inferring it from data appearing?*

**Who answers.** Engineering + design.

**Why it matters to QA.** Several scenarios say "wait for it to settle" without being able to
define *settled*. `REC-02` in particular depends on being able to kill the app *during* the import,
and with no signal the tester is guessing at the timing (hence its two attempts at ~1 s and ~3 s).
Any observable signal would make these scenarios far sharper.

**Related:** `OFF-01`, `REC-02`, `REC-06`.

---

## Summary

| Q | Question | Answered by | Blocks which expectation |
| --- | --- | --- | --- |
| [Q-01](#q-01--is-the-phase-09-importer-in-the-build-under-test) | Importer in the build? | Engineering (per build) | Every 🔴 datum |
| [Q-02](#q-02--which-shared_preferences-backend-does-android-use) | Android prefs backend | Device inspection | [D-14](./02-persisted-data-inventory.md#d-14)–[D-20](./02-persisted-data-inventory.md#d-20) on Android |
| [Q-03](#q-03--where-does-sembast-live-on-android-and-does-it-survive-the-swap) | Android sembast path + survival | Device inspection | All 🔴 data on Android |
| [Q-04](#q-04--are-the-flutter-only-calendar-preferences-intentionally-dropped) | Flutter-only calendar prefs dropped? | Product | `OFF-13` |
| [Q-05](#q-05--should-flutters-notification-preferences-be-imported) | Import notification prefs? | Engineering + product | `OFF-15` |
| [Q-06](#q-06--should-the-importer-seed-the-rn-school-selection-from-user_calendarsschoolid) | Seed school selection? | Engineering | `OFF-14` |
| [Q-07](#q-07--how-should-a-dark-mode-lightened-colour-be-treated-on-import) | Dark-mode colour on import | Engineering + design | `OFF-04` |
| [Q-08](#q-08--is-the-activité-feature-intentionally-not-ported) | Activité not ported? | Product | `OFF-13` |
| [Q-09](#q-09--is-hiddenevents-being-backend-bound-correct-for-a-migrated-user) | `hiddenEvents` backend-bound? | Engineering | [D-27](./02-persisted-data-inventory.md#d-27) tester warning |
| [Q-10](#q-10--which-preferences-does-the-importer-actually-copy) | Which prefs are copied | Engineering | `OFF-12` |
| [Q-11](#q-11--is-the-one-release-sembast-safety-net-implemented) | Sembast safety net | Engineering | `REC-04` |
| [Q-12](#q-12--is-there-any-user-visible-signal-that-the-migration-ran) | Migration visibility signal | Engineering + design | `OFF-01`, `REC-02`, `REC-06` |

---

← [08 — QA execution report](./08-qa-execution-report-template.md) · [Section index](./README.md)
