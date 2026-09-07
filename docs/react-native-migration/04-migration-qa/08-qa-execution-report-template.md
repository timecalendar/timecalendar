# 08 — QA execution report

← [07 — Failure, restart & recovery](./07-failure-restart-and-recovery-scenarios.md) · [Section index](./README.md) · next: [09 — Resolved decisions & evidence](./09-open-engineering-questions.md)

> The reusable report. **Copy this whole file** to
> `docs/react-native-migration/04-migration-qa/runs/YYYY-MM-DD-<platform>-<pack>.md` (create the
> `runs/` directory the first time) and fill it in as you go — not from memory afterwards.
>
> One report per **platform per pack**. An iOS `SEED-A` run and an Android `SEED-A` run are two
> reports.

---

## Run header

| Field | Value |
| --- | --- |
| Report date | |
| Tester | |
| Platform | ☐ iOS ☐ Android |
| Seed pack | ☐ `SEED-A` (compact) ☐ `SEED-B` (large) ☐ reduced (`REC-02` / `REC-06` fresh pass) |
| Device model | |
| OS version | |
| Device timezone | |
| Device language | |
| Device appearance at start | ☐ Light ☐ Dark |
| **`D0`** (the seeding date) | |

### Builds

| Field | Value |
| --- | --- |
| Flutter version installed (from **Profil → À propos**) | |
| Flutter install source | ☐ App Store ☐ Google Play ☐ other (explain) |
| RN version installed (from **Réglages → À propos**) | |
| RN build number / EAS build id | |
| RN delivery path | ☐ TestFlight ☐ App Store ☐ Play internal ☐ Play closed ☐ sideload (explain) |
| Release gate | ☐ internal signed ☐ final public-store |
| Importer/report schema version | |
| RN OTA channel, if known | |

### Build preconditions

| ID | Precondition | Result | Notes |
| --- | --- | --- | --- |
| [B-1](./01-scope-prerequisites-and-execution-order.md#b-1--same-store-identity) | Same store identity (`fr.samuelprak.timecalendar`, no `.dev`); exactly one app icon after update | ☐ OK ☐ FAILED | |
| [B-2](./01-scope-prerequisites-and-execution-order.md#b-2--same-signing-identity-android--same-apple-team-ios) | Same signing identity / Apple team; the store offered it as an **update** | ☐ OK ☐ FAILED | |
| [B-3](./01-scope-prerequisites-and-execution-order.md#b-3--does-the-build-contain-the-importer) | **Does the build contain the Phase 09 importer?** | ☐ Yes ☐ No ☐ Unknown | Quote engineering's written answer verbatim: |
| [B-4](./01-scope-prerequisites-and-execution-order.md#b-4--android-storage-evidence-captured) | Android XML/path/survival/backup evidence (Android runs only) | ☐ Confirmed ☐ Incomplete ☐ N/A (iOS) | |

> **If B-3 is "No":** run `OFF-01`, `OFF-13`, `OFF-14`, `OFF-15`, `REC-01` and mark everything else
> `N/A — importer not in build`. **If B-3 is "Unknown": do not start the run.**
> **If B-1 or B-2 failed: the run is void.** Stop, record why, and do not fill in the rest.

### Run integrity

Tick every one. An unticked box invalidates the scenarios that depend on it — say which.

- [ ] The app was **uninstalled before** the Flutter install, and **never** uninstalled or
      data-cleared between Flutter and RN.
- [ ] No backup restore occurred at any point (iCloud / Google Backup).
- [ ] The baseline sheet was completed **before** the network was cut.
- [ ] The device was offline (airplane mode + Wi-Fi off, verified in a browser) from before the
      RN app's first launch until step 9.
- [ ] The RN app was **never** launched with network access before `OFF-01`.
- [ ] The backend-environment switch was **not** touched
      ([D-27](./02-persisted-data-inventory.md#d-27)).
- [ ] The Flutter app was not launched after the baseline was recorded (or, if it was, the baseline
      was re-verified — note it).

If any box is unticked: **state here what happened and which scenarios are affected.**

---

## Baseline record

Copy the sheet from [03 §5](./03-flutter-seed-packs.md#5-the-baseline-record-sheet) and fill it in
here.

| ID | Baseline | Value / evidence |
| --- | --- | --- |
| `BASE-01` | School + grade/group picked | |
| `BASE-02` | Calendar name as shown | |
| `BASE-03` | `COURSE-1`, `COURSE-2`, `COURSE-3` details + week screenshot | |
| `BASE-04` | The 5 `PE-A*` events — list + per-event detail screenshots | |
| `BASE-05` | Personal-event count = 5 | |
| `BASE-06` | `PE-A1` checklist — 3 items, order, item 2 checked | |
| `BASE-07` | `COURSE-1` checklist — 2 items, order, item 2 checked | |
| `BASE-08` | Checklist item count = 5 | |
| `BASE-09` | Hidden-events screen showing both entries | |
| `BASE-10` | `COURSE-2` + all `COURSE-3` occurrences absent from the calendar | |
| `BASE-11` | Paramètres screenshot — the four positions | |
| `BASE-12` | App visibly in dark theme | |
| `BASE-13` | Mes calendriers — 1 calendar, visible | |
| `BASE-14` | Post-relaunch confirmation + Flutter version | |
| `BASE-15` | Sanitized enabled/horizon/changelog preference evidence | |
| `BASE-B1` | 3 calendar name/school pairs (unordered set), which is hidden | |
| `BASE-B2` | Personal-event count = 60 + sentinel screenshots | |
| `BASE-B3` | Checklist item count = 134 + per-event counts | |
| `BASE-B4` | Hidden by uid = 21, by name = 6, full list in screen order | |

---

## Update execution

| Step | Done | Time | Notes |
| --- | --- | --- | --- |
| `MIG-*-01` Clean start (uninstall any prior install) | ☐ | | |
| `MIG-*-02` Flutter installed from the store | ☐ | | |
| `MIG-*-03` Seeded + baselined | ☐ | | |
| `MIG-AND-04` Pre-update storage evidence (Android) | ☐ ☐ N/A | | ☐ collected ☐ not collectable (production install) |
| `MIG-*-05` / `MIG-AND-05` Network cut, verified | ☐ | | |
| `MIG-*-06` RN build downloaded, **not** opened from the store | ☐ | | |
| `MIG-*-07` Exactly one app; version rolled forward; `firstInstallTime` unchanged (Android) | ☐ | | |
| `MIG-*-08` Offline again, verified, **before** first launch | ☐ | | |
| `MIG-*-09` First launch, recorded | ☐ | | |
| `MIG-*-10` Network restored | ☐ | | |

---

## Scenario results

`PASS` / `FAIL` / `N/A` / `BLOCKED` / `NOT OBSERVABLE` — see
[06 — How to read a scenario](./06-offline-and-online-verification-scenarios.md#how-to-read-a-scenario).

### Offline — [06 Part A](./06-offline-and-online-verification-scenarios.md#part-a--offline-scenarios)

| ID | Scenario | Data | Result | Notes | Evidence |
| --- | --- | --- | --- | --- | --- |
| `OFF-01` | Launches cleanly over an existing Flutter install | D-12, D-21, D-23 | | | |
| `OFF-02` | Calendar subscription survived, exactly once | D-01, D-02 | | | |
| `OFF-03` | Calendar visibility choice survived | D-03 | | | |
| `OFF-04` | Personal events survived, exact values | D-04, D-05 | | | |
| `OFF-05` | Empty optional fields stayed empty | D-04 | | | |
| `OFF-06` | Unicode / emoji / long text survived | D-04 | | | |
| `OFF-07` | Time and date boundaries correct | D-04 | | | |
| `OFF-08` | Checklists: content, checked state, order | D-06, D-08, D-09 | | | |
| `OFF-09` | Checklists attached to the right event | D-07 | | | |
| `OFF-10` | Hidden names survived; UID proof deferred unless storage decodes | D-10, D-11 | | UID offline: ☐ NOT OBSERVABLE ☐ decoded storage | |
| `OFF-11` | Changelog gate shows v4 exactly once | D-15 | | | |
| `OFF-12` | Preserved theme + RN-only language/timezone defaults | D-14, D-24 | | | |
| `OFF-13` | Preserved and deliberately dropped calendar/Activity state | D-13, D-16, D-17, D-20 | | | |
| `OFF-14` | Not sent back through onboarding | D-23 | | | |
| `OFF-15` | Notification enabled preserved; horizon defaults to 7 | D-18, D-25 | | | |
| `OFF-16` | A migrated personal event is usable | D-04 | | | |
| `OFF-17` | A migrated checklist item is usable | D-06, D-08 | | | |
| `OFF-18` | Uniqueness sweep — nothing migrated twice | D-01, D-04, D-06 | | | |
| `OFF-19` | Large pack complete, ordered, with release-mode timing/memory | D-02, D-04, D-06, D-08, D-11 | ☐ N/A (pack A) | duration/peak memory: ___; UID-hidden: ☐ NOT OBSERVABLE ☐ storage evidence | |
| `OFF-20` | Remembered feedback email starts empty and survives restart | D-29 | | normalized value: ___ | |
| `OFF-21` | Invisible partial recovery with offline report queued | migration journal/outbox | | fixture/report id: ___ | |

#### `OFF-13` allowlist sheet

| Flutter setting (baseline) | Expected RN result | Observed |
| --- | --- | --- |
| Vue **Planning** | default Semaine (dropped) | |
| Week-ends **off** | hidden (preserved) | |
| Couleurs par groupe **on** | RN default (dropped; check after `ON-01`) | |
| Démarrage sur **Calendrier** | Calendrier opens (preserved) | |
| Hour height (pinched) | RN default (dropped) | |
| Flutter Activity cache/badge | excluded; RN Activity re-syncs | |

#### `OFF-18` / `OFF-19` counts

| Surface | Baseline | Expected post-`OFF-17` | Observed offline | Observed after `ON-02` |
| --- | --- | --- | --- | --- |
| Personal events | | | | |
| `PE-A1` checklist items | | | | |
| Calendars | | | | |
| Hidden by uid | | Offline UI: `NOT OBSERVABLE`; decoded storage if available | | Must resolve/count in `ON-05` |
| Hidden by name | | | | |
| SQLite row counts (Android, if collected) | | | | |

### Online — [06 Part B](./06-offline-and-online-verification-scenarios.md#part-b--online-scenarios)

| ID | Scenario | Data | Result | Notes | Evidence |
| --- | --- | --- | --- | --- | --- |
| `ON-01` | Timetable comes back from the migrated token | D-01, D-12 | | | |
| `ON-02` | Sync removed nothing, duplicated nothing | D-01, D-04 | | | |
| `ON-03` | Course checklists survived drop-and-replace | D-06, D-07 | | | |
| `ON-04` | Push registration completes | D-22, D-25 | | | |
| `ON-05` | Hidden set filters freshly synced courses | D-10, D-11 | | | |
| `ON-06` | Repeated syncs are idempotent | D-04, D-06, D-12 | | | |

### Recovery — [07](./07-failure-restart-and-recovery-scenarios.md)

| ID | Scenario | Data | Result | Notes | Evidence |
| --- | --- | --- | --- | --- | --- |
| `REC-01` | Survives repeated offline launches | D-01, D-04, D-06, D-11, D-14 observation, D-15 | | UID-hidden: ☐ NOT OBSERVABLE ☐ storage evidence | |
| `REC-02` | Killed during first launch, then relaunched | D-01, D-04, D-06, D-15 | | kill timing: ___ s; reduced seed? ☐; UID proof deferred to `ON-05` unless storage decodes | |
| `REC-03` | Device restart around first launch | D-01, D-04, D-06, D-11, D-14 observation, D-15 | | UID-hidden: ☐ NOT OBSERVABLE ☐ storage evidence | |
| `REC-04` | Legacy Flutter data retained indefinitely | D-28 | | | |
| `REC-05` | Sync interrupted mid-flight | D-04, D-06, D-12 | | | |
| `REC-06` | Backgrounded and resumed during a **separate fresh offline first launch** | D-01, D-04, D-06 | | fresh pass report/link: ___; UID proof deferred to `ON-05` unless storage decodes | |
| `REC-07` | Later OTA update does not disturb data | D-01, D-04, D-06, D-10, D-15 | | | |
| `REC-08` | Malformed records and truncated tail recover safely | all import participants | | fixture matrix: ___ | |
| `REC-09` | Offline report outbox is independent and idempotent | journal/outbox/privacy | | | |

---

## Migration journal and first-party report

Use approved sanitized diagnostics. Never paste a token, event/checklist text, hidden identifier,
raw legacy line/file, preference value, source fingerprint, or unrelated device log here.

| Field | Expected / observed |
| --- | --- |
| Stable report ID | |
| Terminal state | ☐ `SETTLED_SUCCESS` ☐ `SETTLED_PARTIAL` ☐ `SETTLED_FAILED` |
| Terminal reason | |
| Attempt count / retry observed | |
| Started / completed / duration ms | |
| Platform + source/target app/database version | |
| Calendar candidates / imported / already present / invalid / conflicts | |
| Personal-event candidates / imported / already present / invalid / conflicts | |
| Checklist candidates / imported / already present / invalid / conflicts | |
| Hidden-event candidates / imported / already present / invalid / conflicts | |
| Preference candidates / imported / already present / invalid / conflicts | |
| Bounded error stages/codes; examples truncated? | |
| Calendar IDs present only in protected report table | ☐ yes ☐ no |
| Outbox offline before reconnect | ☐ queued ☐ N/A |
| Server delivery after reconnect | ☐ acknowledged ☐ duplicate acknowledged ☐ pending |
| Privacy assertions | ☐ pass ☐ fail |

---

## Data-inventory coverage check

Every 🔴 **DEVICE** datum, plus every inventory item explicitly listed below, must end the run
with a recorded outcome or observation. Fill in the outcome column from the scenario results above;
an empty cell means the run is incomplete.

| Datum | Verified by | Outcome |
| --- | --- | --- |
| [D-01](./02-persisted-data-inventory.md#d-01) Subscription token | `OFF-02`, `ON-01`, `ON-02`, `REC-02` | |
| [D-02](./02-persisted-data-inventory.md#d-02) Calendar identity/metadata | `OFF-02`, `OFF-19` | |
| [D-03](./02-persisted-data-inventory.md#d-03) Calendar visibility | `OFF-03` | |
| [D-04](./02-persisted-data-inventory.md#d-04) Personal events | `OFF-04`…`OFF-07`, `OFF-16`, `OFF-18`, `ON-02` | |
| [D-05](./02-persisted-data-inventory.md#d-05) Personal-event colour | `OFF-04` | |
| [D-06](./02-persisted-data-inventory.md#d-06) Checklist items | `OFF-08`, `OFF-09`, `OFF-17`, `ON-03` | |
| [D-07](./02-persisted-data-inventory.md#d-07) Checklist↔event link | `OFF-09`, `ON-03` | |
| [D-08](./02-persisted-data-inventory.md#d-08) Checklist ordering | `OFF-08`, `OFF-19` | |
| [D-09](./02-persisted-data-inventory.md#d-09) Deleted item stays deleted | `OFF-08` | |
| [D-10](./02-persisted-data-inventory.md#d-10) Hidden by uid | `OFF-10` limitation/evidence, `ON-05` required UI proof | |
| [D-11](./02-persisted-data-inventory.md#d-11) Hidden by name | `OFF-10`, `ON-05` | |
| [D-12](./02-persisted-data-inventory.md#d-12) Timetable courses refetch | `OFF-01`, `ON-01` | |
| [D-13](./02-persisted-data-inventory.md#d-13) Activity cache excluded / feature re-syncs | `OFF-13`, `ON-01` | |
| [D-14](./02-persisted-data-inventory.md#d-14) Theme preserved | `OFF-12` | |
| [D-15](./02-persisted-data-inventory.md#d-15) Changelog seen-version | `OFF-11`, `REC-02` | |
| [D-16](./02-persisted-data-inventory.md#d-16) Calendar view type | `OFF-13` | |
| [D-17](./02-persisted-data-inventory.md#d-17) Weekends / group colours / hour height / startup screen | `OFF-13` | |
| [D-18](./02-persisted-data-inventory.md#d-18) Notification prefs | `OFF-15` | |
| [D-20](./02-persisted-data-inventory.md#d-20) Activity badge keys | `OFF-13` | |
| [D-21](./02-persisted-data-inventory.md#d-21) No account state | `OFF-01` | |
| [D-22](./02-persisted-data-inventory.md#d-22) Push token | `ON-04` | |
| [D-23](./02-persisted-data-inventory.md#d-23) School selection | `OFF-01`, `OFF-14` | |
| [D-24](./02-persisted-data-inventory.md#d-24) Language / timezone | `OFF-12` | |
| [D-25](./02-persisted-data-inventory.md#d-25) Notification frequency | `OFF-15` | |
| [D-28](./02-persisted-data-inventory.md#d-28) Legacy sembast file | `REC-04` | |
| [D-29](./02-persisted-data-inventory.md#d-29) Remembered feedback email | `OFF-20` | |

---

## Findings

One row per `FAIL` or per notable observation. **Describe what you saw; do not assign a severity
or a release recommendation** — that is deliberately out of scope
([Non-goals](./README.md#non-goals)).

| # | Scenario | Datum | What was expected | What was observed | Reproducible? | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | | ☐ always ☐ once ☐ untried | |
| 2 | | | | | ☐ always ☐ once ☐ untried | |
| 3 | | | | | ☐ always ☐ once ☐ untried | |

## Decision and evidence gates

Product behavior is frozen in
[09 — Resolved decisions and remaining evidence](./09-open-engineering-questions.md). Record only
build/device evidence and any contradiction found by this run.

| Gate | Result | Evidence |
| --- | --- | --- |
| Q-01 importer version present | ☐ proved ☐ absent ☐ unknown | |
| Q-02 Android XML backend present/retained | ☐ proved ☐ incomplete ☐ N/A | |
| Q-03 Android document path/update survival/backup | ☐ proved ☐ incomplete ☐ N/A | |
| iOS physical container/preferences survival | ☐ proved ☐ incomplete ☐ N/A | |
| low-end release-mode duration/peak memory | ☐ proved ☐ incomplete | |
| internal signed in-place gate | ☐ pass ☐ fail ☐ not run | |
| final public-store in-place gate | ☐ pass ☐ fail ☐ not run | |

## Evidence index

List every artefact and where it is stored, so a finding can be re-examined.

| Ref | Artefact | Scenario | Location |
| --- | --- | --- | --- |
| E-01 | | | |
| E-02 | | | |
| E-03 | | | |

## Summary

| Metric | Count |
| --- | --- |
| Scenarios executed | |
| `PASS` | |
| `FAIL` | |
| `N/A — importer not in build` | |
| `BLOCKED` | |
| `NOT OBSERVABLE` | |
| Findings raised | |

**Narrative summary** (three sentences: what was run, what happened, what could not be checked):

---

**Tester sign-off:**
**Date:**
**Total elapsed time:**
