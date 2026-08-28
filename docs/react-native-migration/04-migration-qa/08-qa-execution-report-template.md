# 08 — QA execution report

← [07 — Failure, restart & recovery](./07-failure-restart-and-recovery-scenarios.md) · [Section index](./README.md) · next: [09 — Open engineering questions](./09-open-engineering-questions.md)

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
| RN OTA channel, if known | |

### Build preconditions

| ID | Precondition | Result | Notes |
| --- | --- | --- | --- |
| [B-1](./01-scope-prerequisites-and-execution-order.md#b-1--same-store-identity) | Same store identity (`fr.samuelprak.timecalendar`, no `.dev`); exactly one app icon after update | ☐ OK ☐ FAILED | |
| [B-2](./01-scope-prerequisites-and-execution-order.md#b-2--same-signing-identity-android--same-apple-team-ios) | Same signing identity / Apple team; the store offered it as an **update** | ☐ OK ☐ FAILED | |
| [B-3](./01-scope-prerequisites-and-execution-order.md#b-3--does-the-build-contain-the-importer) | **Does the build contain the Phase 09 importer?** | ☐ Yes ☐ No ☐ Unknown | Quote engineering's written answer verbatim: |
| [B-4](./01-scope-prerequisites-and-execution-order.md#b-4--android-storage-locations-confirmed) | Android storage locations confirmed (Android runs only) | ☐ Confirmed ☐ Still open ☐ N/A (iOS) | |

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
| `OFF-12` | Theme **observation** + RN-only language/timezone defaults | D-14, D-24 | ☐ RECORDED | theme observed: ___ | |
| `OFF-13` | Flutter-only prefs & features — **observation** | D-13, D-16, D-17, D-20 | ☐ RECORDED | | |
| `OFF-14` | Not sent back through onboarding | D-23 | | | |
| `OFF-15` | Notification preferences default sanely | D-18, D-25 | | | |
| `OFF-16` | A migrated personal event is usable | D-04 | | | |
| `OFF-17` | A migrated checklist item is usable | D-06, D-08 | | | |
| `OFF-18` | Uniqueness sweep — nothing migrated twice | D-01, D-04, D-06 | | | |
| `OFF-19` | Large pack complete, ordered, usable | D-02, D-04, D-06, D-08, D-11 | ☐ N/A (pack A) | UID-hidden offline: ☐ NOT OBSERVABLE ☐ storage evidence | |
| `OFF-20` | Remembered feedback email starts empty and survives restart | D-29 | | normalized value: ___ | |

#### `OFF-13` observation sheet

| Flutter setting (baseline) | RN observed state |
| --- | --- |
| Vue **Planning** → which RN view is active on launch | |
| Week-ends **off** → are Sat/Sun columns shown? | |
| Couleurs par groupe **on** → same-type courses coloured alike? (after `ON-01`) | |
| Démarrage sur **Calendrier** → which tab opens | |
| Hour height (pinched) → grid density | |
| Activité feature → present anywhere? | |

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
| `REC-04` | Legacy Flutter data still on disk | D-28 | | | |
| `REC-05` | Sync interrupted mid-flight | D-04, D-06, D-12 | | | |
| `REC-06` | Backgrounded and resumed during a **separate fresh offline first launch** | D-01, D-04, D-06 | | fresh pass report/link: ___; UID proof deferred to `ON-05` unless storage decodes | |
| `REC-07` | Later OTA update does not disturb data | D-01, D-04, D-06, D-10, D-15 | | | |

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
| [D-13](./02-persisted-data-inventory.md#d-13) Activity log / feature | `OFF-13` | |
| [D-14](./02-persisted-data-inventory.md#d-14) Theme (contract unresolved) | `OFF-12` observation | |
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

## Open questions raised or answered

Anything this run resolved, or newly raised, against
[09 — Open engineering questions](./09-open-engineering-questions.md).

| Q | Status after this run | Evidence |
| --- | --- | --- |
| [Q-01](./09-open-engineering-questions.md#q-01--is-the-phase-09-importer-in-the-build-under-test) Importer present? | ☐ answered ☐ still open | |
| [Q-02](./09-open-engineering-questions.md#q-02--which-shared_preferences-backend-does-android-use) Android prefs backend | ☐ answered ☐ still open ☐ N/A (iOS) | |
| [Q-03](./09-open-engineering-questions.md#q-03--where-does-sembast-live-on-android-and-does-it-survive-the-swap) Android sembast path | ☐ answered ☐ still open ☐ N/A (iOS) | |
| [Q-04](./09-open-engineering-questions.md#q-04--are-the-flutter-only-calendar-preferences-intentionally-dropped) Flutter-only calendar prefs | ☐ answered ☐ still open | |
| [Q-05](./09-open-engineering-questions.md#q-05--should-flutters-notification-preferences-be-imported) Notification prefs import | ☐ answered ☐ still open | |
| [Q-06](./09-open-engineering-questions.md#q-06--should-the-importer-seed-the-rn-school-selection-from-user_calendarsschoolid) School-selection seeding | ☐ answered ☐ still open | |
| [Q-07](./09-open-engineering-questions.md#q-07--how-should-a-dark-mode-lightened-colour-be-treated-on-import) Dark-mode colour on import | ☐ answered ☐ still open | |
| [Q-08](./09-open-engineering-questions.md#q-08--is-the-activité-feature-intentionally-not-ported) Activité not ported | ☐ answered ☐ still open | |
| [Q-09](./09-open-engineering-questions.md#q-09--is-hiddenevents-being-backend-bound-correct-for-a-migrated-user) `hiddenEvents` backend-bound | ☐ answered ☐ still open | |
| [Q-10](./09-open-engineering-questions.md#q-10--which-preferences-does-the-importer-actually-copy) Which prefs are copied | ☐ answered ☐ still open | |
| [Q-11](./09-open-engineering-questions.md#q-11--is-the-one-release-sembast-safety-net-implemented) Sembast safety net | ☐ answered ☐ still open ☐ not observable | |
| [Q-12](./09-open-engineering-questions.md#q-12--is-there-any-user-visible-signal-that-the-migration-ran) Migration visibility signal | ☐ answered ☐ still open | |

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
