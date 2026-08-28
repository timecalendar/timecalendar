# 06 — Offline & online verification scenarios

← [05 — Android in-place update](./05-android-in-place-update.md) · [Section index](./README.md) · next: [07 — Failure, restart & recovery](./07-failure-restart-and-recovery-scenarios.md)

> `OFF-01` … `OFF-20` run **while the device is still offline**, immediately after the in-place
> update. `ON-01` … `ON-06` run after the network is restored.
>
> Record every scenario in [08 — QA execution report](./08-qa-execution-report-template.md), even
> the ones that pass.

---

## How to read a scenario

Each one states its purpose, the platforms it applies to, its preconditions, the Flutter setup it
depends on (all of it already done in [03](./03-flutter-seed-packs.md)), the exact React Native
steps, and the expected result. **Verification steps reference the RN app's own French labels**,
so you can follow them on the device without a map.

**Result vocabulary:**

| Result | When to use it |
| --- | --- |
| `PASS` | Observed matches expected. |
| `FAIL` | Observed contradicts expected. Attach evidence. |
| `N/A — importer not in build` | [B-3](./01-scope-prerequisites-and-execution-order.md#b-3--does-the-build-contain-the-importer) established the build has no importer. **Not a failure.** |
| `BLOCKED` | You could not execute the steps (device, build, or an earlier void). Say why. |
| `NOT OBSERVABLE` | The steps ran but the evidence could not be collected on this build (e.g. `run-as` on a production Android install). |

## React Native navigation crib

| Where | How to get there |
| --- | --- |
| Accueil | First tab |
| Calendrier | Second tab |
| Réglages | Third tab |
| Mes événements (personal events) | Réglages → **Événements personnels** |
| Événements masqués | Réglages → **Événements masqués** |
| Mes calendriers | Réglages → **Vos calendriers** → **Gérer les calendriers** |
| Apparence et langue | Réglages → **Apparence et langue** |
| Fuseau horaire | Réglages → **Fuseau horaire** |
| Notifications | Réglages → **Notifications** |
| À propos (version) | Réglages → **À propos** |
| Nouveautés (changelog history) | Réglages → À propos → **Nouveautés** |
| Event details | Tap any event on Accueil or Calendrier, or any row in Mes événements |
| Liste de tâches (checklist) | Inside an event's detail screen |

---

# Part A — Offline scenarios

**Global preconditions for every `OFF-*` scenario:**

- `MIG-IOS-08` / `MIG-AND-09` completed — the RN build was installed in place and the device has
  been offline continuously since before first launch.
- The baseline sheet from [03 §5](./03-flutter-seed-packs.md#5-the-baseline-record-sheet) is
  complete.
- The device has **not** been online at any point since the RN app first launched.

---

## `OFF-01` — The app launches cleanly over an existing Flutter install

**Purpose / risk.** The single highest-impact failure: the RN app crashes, hangs on the splash, or
throws a migrated student back into onboarding. Covers
[D-12](./02-persisted-data-inventory.md#d-12), [D-21](./02-persisted-data-inventory.md#d-21),
[D-23](./02-persisted-data-inventory.md#d-23).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global. This is the first thing you do after tapping the icon.

**Flutter setup.** `SEED-A-01`…`SEED-A-08`.

**Baseline.** `BASE-14`.

**Steps.**

1. Observe the launch from the tap to the first interactive frame.
2. Note the wall-clock time from tap to interactive.
3. Réglages → **À propos** → read the version.

**Offline expected result.**

- The splash appears and dismisses. No crash, no white screen, no infinite spinner.
- The app opens to the **Accueil** tab. It does **not** open onboarding, and it never shows a
  sign-in screen (there is no account — [D-21](./02-persisted-data-inventory.md#d-21)).
- **À propos** shows version `4.x`.
- The Calendrier tab shows **no courses** and the "Aucun événement sur cette période." empty
  state. ✅ **This is correct and expected** — timetable courses are server-owned and deliberately
  not migrated ([D-12](./02-persisted-data-inventory.md#d-12)); they come back in `ON-01`.
- A **sync error banner** ("Impossible d'actualiser votre calendrier…") may appear because the
  startup sync cannot reach the network. That is expected offline behaviour, not a failure.
- Time-to-interactive is not a pass criterion here, but record it — `OFF-19` compares it against
  the large pack.

**Online expected result.** n/a.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[screen recording of first launch]` `[À propos screenshot]` `[logcat / .ips if it crashed]`

---

## `OFF-02` — The calendar subscription survived, exactly once

**Purpose / risk.** The token is the student's identity; losing it means re-adding the timetable by
hand. Duplicating it means duplicated events forever after. Covers
[D-01](./02-persisted-data-inventory.md#d-01), [D-02](./02-persisted-data-inventory.md#d-02).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global. `OFF-01` executed.

**Flutter setup.** `SEED-A-01` (and `SEED-B-01` for the large pack).

**Baseline.** `BASE-01`, `BASE-02`, `BASE-13` (`BASE-B1` for pack B).

**Steps.**

1. Réglages → look at the **Vos calendriers** summary card.
2. Tap **Gérer les calendriers**.
3. Read every row: name and school.

**Offline expected result.**

- Pack A: exactly **1** calendar. Pack B: exactly **3**. Compare the **set** of calendar identities;
  row order is not a criterion because RN `findAll()` has no `ORDER BY`
  (`mobile/src/features/calendar-sources/data/user-calendars/repository.ts:14-16`).
- Every name matches `BASE-02` (`BASE-B1`) character for character, paired with the correct school.
- The school line matches `BASE-01`.
- The summary card's counts match ("1 calendrier" / "3 calendriers"; the school count matches the
  number of distinct schools).
- **No duplicates.** A calendar appearing twice is a `FAIL` even if the data looks right —
  duplicated tokens produce duplicated events at the next sync.
- The screen must **not** show "Aucun calendrier importé."

**Online expected result.** Deferred to `ON-01`/`ON-02`.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[Mes calendriers screenshot]` `[Réglages summary card screenshot]`

---

## `OFF-03` — Calendar visibility choice survived

**Purpose / risk.** A student who hid a calendar sees it reappear — a small but visible regression,
and an indicator that boolean fields are not round-tripping. Covers
[D-03](./02-persisted-data-inventory.md#d-03).

**Platforms.** iOS + Android. **Packs.** B (pack A has one always-visible calendar; run it as a
smoke check anyway).

**Preconditions.** Global.

**Flutter setup.** `SEED-B-01` step 3 (third calendar's visibility off).

**Baseline.** `BASE-B1`.

**Steps.**

1. Réglages → Vos calendriers → **Gérer les calendriers**.
2. Read each row's visibility switch.

**Offline expected result.**

- Pack B: the third calendar's switch is **off**; the other two are **on** — matching `BASE-B1`.
- Pack A: the single calendar's switch is **on**.
- A switch defaulting to on when it was off is a `FAIL`.

**Online expected result.** After `ON-01`, the hidden calendar's events must still not appear on
Accueil or Calendrier.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[Mes calendriers screenshot showing switch positions]`

---

## `OFF-04` — Personal events survived, with exact values

**Purpose / risk.** The largest body of irreplaceable student-authored data. Covers
[D-04](./02-persisted-data-inventory.md#d-04), [D-05](./02-persisted-data-inventory.md#d-05).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global.

**Flutter setup.** `SEED-A-03`.

**Baseline.** `BASE-04`, `BASE-05`.

**Steps.**

1. Réglages → **Événements personnels** (**Mes événements**).
2. Count the rows.
3. Open `PE-A1` and compare every field against `BASE-04`.
4. Repeat for `PE-A3` and `PE-A5`.
5. Go to **Accueil** and **Calendrier** and confirm the events render on their dates.

**Offline expected result.**

- Exactly **5** rows in pack A (**60** in pack B). Not 4, not 6.
- `PE-A1` shows: title `Révisions Analyse 2`; `D0`, `10:00`–`12:00`; **Lieu** `BU Sciences, salle
  204`; the two-line description intact including the line break; a blue colour swatch.
- `PE-A5` shows title `Rendu projet — dépôt en ligne` with the em dash intact, `23:15`–`23:59`,
  description `Ne pas oublier le fichier .zip`, red swatch.
- `PE-A2` and `PE-A1` both render on `D0` and visibly overlap on the Calendrier grid.
- The list is not empty and does not show "Aucun événement. Appuyez sur Ajouter pour en créer un."

**Colour note.** Compare the *rendered* colour against the `BASE-04` screenshots. The seed
instructions require creating events in light mode precisely so the stored hex equals the picked
hex ([D-05](./02-persisted-data-inventory.md#d-05)). If a colour is visibly lighter or darker than
baseline, record it as an observation and reference
[Q-07](./09-open-engineering-questions.md#q-07--how-should-a-dark-mode-lightened-colour-be-treated-on-import)
rather than guessing whether it is a defect.

**Online expected result.** Personal events must be unchanged by the first sync — see `ON-02`.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[Mes événements list screenshot]` `[PE-A1 / PE-A3 / PE-A5 detail screenshots]`

---

## `OFF-05` — Empty optional fields stayed empty

**Purpose / risk.** A null→string coercion bug turns an empty location into the literal text
`null`, `undefined`, or `""` rendered as an empty row. Covers
[D-04](./02-persisted-data-inventory.md#d-04).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global.

**Flutter setup.** `PE-A2` (no location, no description); `PE-A4` (no description); `PE-A5` (no
location).

**Baseline.** `BASE-04`.

**Steps.**

1. Open `PE-A2` from **Mes événements**.
2. Read the detail screen carefully, including any **Lieu** and **Description** rows.
3. Repeat for `PE-A4` and `PE-A5`.

**Offline expected result.**

- `PE-A2`: neither a **Lieu** nor a **Description** row is shown at all. Nothing renders the words
  `null`, `undefined`, `NULL`, or an empty labelled row.
- `PE-A4`: **Lieu** shows `Chez Léa`; no Description row.
- `PE-A5`: Description shows `Ne pas oublier le fichier .zip`; no Lieu row.
- Opening `PE-A2` in the edit form (**Modifier**) shows genuinely empty Lieu/Description inputs
  with their placeholders (`Où`, `Notes`), not the string `null`.

**Online expected result.** n/a.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[PE-A2 detail screenshot]` `[PE-A2 edit-form screenshot]`

---

## `OFF-06` — Unicode, emoji and long text survived byte-for-byte

**Purpose / risk.** Truncation at a fixed length, mangled accents, dropped emoji, or a
double-encoded `Ã©` — all classic import defects, and all invisible unless you look for them.
Covers [D-04](./02-persisted-data-inventory.md#d-04).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global.

**Flutter setup.** `PE-A3` (and `PE-B-028` for pack B).

**Baseline.** `BASE-04` (`BASE-B2`).

**Steps.**

1. Open `PE-A3` from **Mes événements**.
2. Compare the title against the baseline **character by character**, including `'`, `—`, `🎓`,
   and the parentheses.
3. Compare the location: `·`, `«  »`, `Cœur`, `2ᵉ`, `🏛️`.
4. Read the description to its very end. The final characters must be `— merci d'être
   ponctuel·le·s. ✅`.
5. Pack B: repeat for `PE-B-028`, whose title includes `中文 🇫🇷`.

**Offline expected result.**

- Every character is identical to baseline. In particular:
  - No `Ã©`, `â€™`, `?` or `□` replacement characters.
  - The emoji render as emoji (a missing glyph box is a font issue, not a data issue — note which
    it is).
  - The description ends with the `✅` and is **not** cut short. Scroll to the end and confirm the
    final sentence is present.
- The ligature `œ` and the superscript `ᵉ` survive.
- The regional-indicator flag `🇫🇷` (two code points) is not split into two letters.

**Online expected result.** n/a.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[PE-A3 detail screenshot, full description scrolled]` `[PE-B-028 screenshot]`

---

## `OFF-07` — Time and date boundaries are correct

**Purpose / risk.** Flutter stores timestamps as UTC ISO-8601 and RN stores the same strings; a
timezone-conversion bug shifts an event by hours or by a whole day, and boundary events are where
it shows. Covers [D-04](./02-persisted-data-inventory.md#d-04).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global. The device timezone is unchanged since seeding, and recorded.

**Flutter setup.** `PE-A4` (`D0+2`, `00:00`–`00:45`) and `PE-A5` (`D0+2`, `23:15`–`23:59`).

**Baseline.** `BASE-04`.

**Steps.**

1. Calendrier → navigate to `D0+2`.
2. Confirm both `PE-A4` and `PE-A5` are on that day.
3. Open each and read the times.
4. Confirm neither has leaked onto `D0+1` or `D0+3`.

**Offline expected result.**

- `PE-A4` is on `D0+2` at `00:00`–`00:45`. Not `23:00` on `D0+1`, not `01:00` on `D0+2`.
- `PE-A5` is on `D0+2` at `23:15`–`23:59`. Not `00:15` on `D0+3`.
- The dates and times are identical to what Flutter showed in `BASE-04`.
- Pack B: `PE-B-055` is on `D0+13` at `23:00`–`23:59`.

**An off-by-one-hour shift** is the signature of a UTC/local conversion bug and is a `FAIL` even
though the data is "there". Record the exact offset you observe.

**Online expected result.** n/a.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[Calendrier D0+2 screenshot]` `[PE-A4 and PE-A5 detail screenshots]`

---

## `OFF-08` — Checklists survived with content, checked state, and order

**Purpose / risk.** Student-authored, no server copy, and the ordering is easy to lose in a
migration that iterates a map. Covers [D-06](./02-persisted-data-inventory.md#d-06),
[D-08](./02-persisted-data-inventory.md#d-08), [D-09](./02-persisted-data-inventory.md#d-09).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global.

**Flutter setup.** `SEED-A-04` → `CL-A1` on `PE-A1`.

**Baseline.** `BASE-06`, `BASE-08`.

**Steps.**

1. Open `PE-A1` → **Liste de tâches**.
2. Read the items top to bottom.
3. Confirm the checked state of each.
4. Confirm the deleted fourth item is absent.

**Offline expected result.**

- Exactly **3** items, in this order:
  1. `Relire le TD 5` — unchecked
  2. `Imprimer les annales` — **checked**
  3. `Prévoir une calculatrice 🧮` — unchecked
- The order matches baseline. A reversed or arbitrary order is a `FAIL` (it means `order` was not
  migrated or not sorted on).
- `À supprimer` does **not** appear. A resurrected deleted item is a `FAIL` — it means the import
  read a tombstoned sembast record instead of replaying the log
  ([D-09](./02-persisted-data-inventory.md#d-09)).
- The list does not show "Aucun élément pour le moment."

**Online expected result.** Unchanged by sync — see `ON-03`.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[PE-A1 Liste de tâches screenshot]`

---

## `OFF-09` — Checklists stayed attached to the right event, of either kind

**Purpose / risk.** `eventUid` joins to **either** a personal event or a school course. A migration
that only wires one kind silently orphans the other — and the school-course case is the one that
also has to survive the first sync's drop-and-replace. Covers
[D-07](./02-persisted-data-inventory.md#d-07).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global.

**Flutter setup.** `SEED-A-04` → `CL-A1` on `PE-A1`, `CL-A2` on `COURSE-1`.

**Baseline.** `BASE-06`, `BASE-07`, `BASE-03`.

**Steps.**

1. Confirm `CL-A1`'s three items are on `PE-A1` and **not** on any other event (spot-check
   `PE-A2` and `PE-A3` — their checklists must be empty).
2. `COURSE-1` is not visible offline (courses have not synced yet —
   [D-12](./02-persisted-data-inventory.md#d-12)), so **defer the `CL-A2` half of this scenario to
   `ON-03`**. Record that here explicitly rather than leaving it blank.

**Offline expected result.**

- `PE-A1` has exactly its 3 items. `PE-A2`, `PE-A3`, `PE-A4`, `PE-A5` each show
  "Aucun élément pour le moment."
- No item from `CL-A2` (`Rapport de TP à rendre`, `Groupe : Léa, Ismaël, Théo`) appears on any
  personal event. Notes crossing from a course to a personal event is a `FAIL`.

**Online expected result.** See `ON-03` — `CL-A2` must appear on `COURSE-1` once it syncs back.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[PE-A1 checklist]` `[PE-A2 empty checklist]`

---

## `OFF-10` — Hidden events survived, both kinds

**Purpose / risk.** A deliberate student choice with no server copy; losing it un-hides courses
they chose not to see. Covers [D-10](./02-persisted-data-inventory.md#d-10),
[D-11](./02-persisted-data-inventory.md#d-11).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global.

**Flutter setup.** `SEED-A-05` (and `SEED-B-04`).

**Baseline.** `BASE-09`, `BASE-10` (`BASE-B4`).

**Steps.**

1. Réglages → **Événements masqués**.
2. Read the **Masqués par nom** section and compare it with the baseline.
3. Look for the **Événements masqués** (by uid) section, but do **not** infer a missing
   migration from its absence: RN suppresses uid entries until they resolve to synced courses.
4. If the QA build/tooling can decode MMKV, capture `hiddenEvents.set` and compare the
   `uidHiddenEvents` set/count with the baseline. Otherwise record the uid half as
   `NOT OBSERVABLE OFFLINE` and defer its proof to `ON-05`.

**Offline expected result.**

- **Masqués par nom** contains `COURSE-3`'s exact title. Pack B: **6** names.
- The by-uid section is normally absent while offline because `calendar_events` is empty and the
  screen filters unresolved uids (`mobile/src/features/hidden-events/ui/hidden-events-screen.tsx:44-50`). This is expected, not a
  `FAIL`; the blob retains the uids. When decoded storage evidence is available it contains **1**
  uid for pack A / **21** for pack B.
- Because the named section is populated, the screen must not show "Aucun événement masqué."
- Without decoded storage evidence, this scenario proves [D-11](./02-persisted-data-inventory.md#d-11)
  only. [D-10](./02-persisted-data-inventory.md#d-10) remains pending until `ON-05`.

**Online expected result.** See `ON-05` — the hidden set must actually filter the freshly synced
courses.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[Événements masqués screenshot, both sections, scrolled]`

---

## `OFF-11` — The changelog gate behaves for an upgrading user

**Purpose / risk.** Flutter's catalog ends at version **3**; RN's is at **4**. An upgrading student
must see the version-4 "Nouveautés" sheet **exactly once** — not never (they miss the release
notes), and not on every launch (an unclosable nag). Covers
[D-15](./02-persisted-data-inventory.md#d-15).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global. Requires the first-launch screen recording from `MIG-IOS-08` /
`MIG-AND-09`, because the sheet is a one-shot event.

**Flutter setup.** State **S4** — `flutter.current_version` is at `3`.

**Baseline.** `BASE-14`.

**Steps.**

1. Review the first-launch recording: did the **Nouveautés** sheet appear?
2. If it is on screen now, read it, then close it (**Fermer**).
3. Force-quit the app and relaunch (still offline).
4. Observe whether the sheet appears again.
5. Réglages → À propos → **Nouveautés** — the full history must be reachable manually.

**Offline expected result.**

- The sheet appeared **once**, on the first launch, showing the version-4 entries ("Un tout nouveau
  design", "Un calendrier plus rapide", "Une expérience vraiment native").
- On the second launch it does **not** appear.
- The manual **Nouveautés** history screen opens and lists the versions.

**Two distinguishable failure shapes — record which one you see:**

| Observed | What it means |
| --- | --- |
| Sheet never appears | The seen-version was imported as ≥ 4, or the gate seeded "current" instead of importing 3. The student silently misses the release notes. |
| Sheet appears on **every** launch | The seen-version is not being persisted after dismissal. |

**Online expected result.** n/a.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[first-launch recording]` `[sheet screenshot]` `[second-launch recording]`

---

## `OFF-12` — Theme observation (and RN-only language/timezone defaults)

**Purpose / risk.** Low stakes but highly visible: a student who chose dark mode should not be
blinded on first launch. Also confirms the RN-only preferences default sanely. Covers
[D-14](./02-persisted-data-inventory.md#d-14), [D-24](./02-persisted-data-inventory.md#d-24).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global. **Set the device itself to light appearance** before this check, so that
"the app is dark" can only be explained by the imported preference and not by the device following
dark mode.

**Flutter setup.** `SEED-A-06` — Thème = **Sombre**.

**Baseline.** `BASE-11`, `BASE-12`.

**Steps.**

1. Set the device to light appearance (iOS: Settings → Display & Brightness → Light. Android:
   Display → Dark theme off).
2. Réglages → **Apparence et langue**.
3. Read **Thème**, **Langue**.
4. Back → **Fuseau horaire**.

**Offline observation / expected RN-only defaults.**

- Record **Thème** and the rendered appearance. If it is **Sombre**, the optional preference was
  imported; if it is **Système**, it was not. Neither observation is a pass/fail result for D-14
  until [Q-10](./09-open-engineering-questions.md#q-10--which-preferences-does-the-importer-actually-copy)
  settles whether theme import is required.
- **Langue** = **Système** (RN-only; nothing to import —
  [D-24](./02-persisted-data-inventory.md#d-24)). The app's text is French on a French device.
- **Fuseau horaire** = **Automatique (fuseau de l'appareil)**.

Only the RN-only language/timezone defaults have settled pass/fail expectations here. State exactly
what theme behavior you observed; do not convert the unresolved product contract into a failure.

**Online expected result.** n/a.

**Result:** ☐ RECORDED ☐ BLOCKED
**Notes:**
**Evidence:** `[Apparence et langue screenshot]` `[app screenshot showing dark rendering with device in light mode]`

---

## `OFF-13` — Flutter preferences and features with no RN counterpart

**Purpose / risk.** Four calendar preferences, the Activité feature, and its two badge keys exist
in Flutter and have **no target** in RN. This scenario does not assert a behaviour — it **records
the actual state** so engineering can confirm the drop is intended. Covers
[D-13](./02-persisted-data-inventory.md#d-13), [D-16](./02-persisted-data-inventory.md#d-16),
[D-17](./02-persisted-data-inventory.md#d-17), [D-20](./02-persisted-data-inventory.md#d-20).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global.

**Flutter setup.** `SEED-A-06` — all four preferences set away from their defaults.

**Baseline.** `BASE-11`.

**Steps and what to record.** This is an observation sheet, not a pass/fail gate.

| Flutter setting (baseline) | Where to look in RN | Record |
| --- | --- | --- |
| Vue **Planning** | Calendrier tab — which view is active on launch (Jour / Semaine / Agenda) | |
| Afficher les week-ends **off** | Calendrier — are Saturday and Sunday columns shown? | |
| Couleurs par groupe **on** | Calendrier / Accueil — are same-type courses coloured alike? (needs `ON-01` first) | |
| Démarrage sur **Calendrier** | Which tab is selected on launch | |
| Hour height (pinched) | Calendrier — grid density | |
| Activité feature | Is there any Activité / activity screen anywhere in Réglages? | |

**Offline expected result** (what the source says will happen, for context, not as a gate):

- The calendar opens in **Semaine**, because RN's view is component state initialised to `"week"`
  and is not persisted ([D-16](./02-persisted-data-inventory.md#d-16)).
- Weekends are shown; there is no weekend preference in RN.
- There is no "colours by group" preference in RN.
- The app opens on **Accueil**; there is no startup-screen preference in RN.
- There is no Activité screen ([D-13](./02-persisted-data-inventory.md#d-13)).

Any of these differing from the above is itself worth recording — it would mean an RN surface
exists that this inventory did not find.

**Online expected result.** Re-check the "couleurs par groupe" row after `ON-01`, once courses
exist to be coloured.

**Result:** ☐ RECORDED ☐ BLOCKED
**Notes:**
**Evidence:** `[Calendrier screenshot]` `[Réglages full screenshot]`
**Cross-reference:** [Q-04](./09-open-engineering-questions.md#q-04--are-the-flutter-only-calendar-preferences-intentionally-dropped), [Q-08](./09-open-engineering-questions.md#q-08--is-the-activité-feature-intentionally-not-ported)

---

## `OFF-14` — A migrated student is not sent back through onboarding

**Purpose / risk.** RN derives "onboarding complete" from a school selection stored under MMKV keys
that **Flutter never wrote** ([D-23](./02-persisted-data-inventory.md#d-23)). If any surface gates
on it, a migrated student with a perfectly good calendar could be pushed back into school
selection. Covers [D-23](./02-persisted-data-inventory.md#d-23).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global.

**Flutter setup.** `SEED-A-01`.

**Baseline.** `BASE-01`, `BASE-13`.

**Steps.**

1. From a cold launch, note which screen you land on.
2. Visit **Accueil**, **Calendrier**, and **Réglages** in turn.
3. Réglages → **Vos calendriers** — read the summary card.
4. Force-quit and relaunch; repeat step 1.

**Offline expected result.**

- You land on **Accueil** every time. No onboarding, no welcome pager, no school picker.
- The **Vos calendriers** summary shows the migrated calendar(s) and their school count — it does
  **not** show "Ajoutez votre premier calendrier".
- If the school *name* appears anywhere sourced from the school-selection store rather than the
  calendar row, note whether it is present or blank — that distinguishes "the selection was
  synthesised from the calendar" from "the selection is simply absent", which is exactly what
  [Q-06](./09-open-engineering-questions.md#q-06--should-the-importer-seed-the-rn-school-selection-from-user_calendarsschoolid)
  asks.

**Online expected result.** n/a.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[cold-launch recording]` `[Réglages summary card screenshot]`

---

## `OFF-15` — Notification preferences default sanely

**Purpose / risk.** RN's notification preferences have no faithful Flutter counterpart (the Flutter
UI was disabled and the RN defaults deliberately differ). Confirm the migrated app lands on the RN
defaults and not on something invalid. Covers [D-18](./02-persisted-data-inventory.md#d-18),
[D-25](./02-persisted-data-inventory.md#d-25).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global.

**Flutter setup.** None beyond `SEED-A-01` (the Flutter keys carry their defaults).

**Baseline.** —

**Steps.**

1. Réglages → **Notifications**.
2. Read every control.

**Offline expected result.**

- Notifications **active** (the RN default is opt-in true).
- Days-ahead = **7** — note that this deliberately differs from Flutter's `date_limit` default of
  14 (`mobile/src/features/notifications/data/types.ts` documents the choice). It is not a
  migration failure.
- Frequency = **immediately** (RN-only, no Flutter equivalent).
- No control shows an out-of-range or blank value.

If days-ahead shows **14**, the importer copied `date_limit` — also fine, but record it, because
it answers [Q-05](./09-open-engineering-questions.md#q-05--should-flutters-notification-preferences-be-imported).

**Online expected result.** See `ON-04` for the actual subscription registration.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[Notifications screen screenshot]`

---

## `OFF-16` — A migrated personal event is genuinely usable

**Purpose / risk.** Data can be *present* but not *usable* — e.g. imported with an id shape the
update path cannot match, so every edit silently no-ops or creates a duplicate. Covers
[D-04](./02-persisted-data-inventory.md#d-04).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global. `OFF-04` passed.

**Flutter setup.** `PE-A1`, `PE-A4`.

**Baseline.** `BASE-04`, `BASE-05`.

**Steps.**

1. Open `PE-A1` → **Modifier**.
2. Change the title to `Révisions Analyse 2 (modifié)`. Save (**Enregistrer**).
3. Return to **Mes événements**. Count the rows.
4. Force-quit, relaunch (still offline), reopen the event.
5. Open `PE-A4` → **Modifier** → **Supprimer**. Confirm.
6. Count the rows again. Force-quit, relaunch, count again.

**Offline expected result.**

- After step 2: the row shows the new title. The count is still **5** (pack A) — an edit that
  creates a sixth row is a `FAIL`, and it means the imported `uid` is not being matched on update.
- After step 4: the new title persisted across the restart.
- After step 5: the count is **4**, and `PE-A4` is gone from Accueil and Calendrier too.
- After step 6's restart: still **4**. A deleted-then-resurrected event is a `FAIL`.
- All the other events' values are untouched.

> Restore the title afterwards if you intend to continue with `ON-02`, or simply note the new
> expected value. Do **not** re-create `PE-A4` — `ON-02` expects 4 events from here on.

**Online expected result.** The edit and the deletion must survive the first sync — `ON-02`.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[before/after list screenshots]` `[post-restart screenshot]`

---

## `OFF-17` — A migrated checklist item is genuinely usable

**Purpose / risk.** Same as `OFF-16`, for checklists — and it additionally exercises the `order`
re-numbering path over imported rows. Covers [D-06](./02-persisted-data-inventory.md#d-06),
[D-08](./02-persisted-data-inventory.md#d-08).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global. `OFF-08` passed.

**Flutter setup.** `CL-A1` on `PE-A1`.

**Baseline.** `BASE-06`.

**Steps.**

1. Open `PE-A1` → **Liste de tâches**.
2. Check `CL-A1-1` (`Relire le TD 5`).
3. Edit `CL-A1-3`'s text to `Prévoir une calculatrice 🧮 + règle`.
4. Move `CL-A1-3` up one position.
5. Add a new item `Nouvel élément post-migration`.
6. Force-quit, relaunch (still offline), reopen `PE-A1`'s checklist.

**Offline expected result.**

- After step 2: item 1 is checked, and items 2 and 3 keep their own states.
- After step 3: the text is updated in place — **no duplicate item appears**.
- After step 4: the order is `Relire le TD 5`, `Prévoir une calculatrice 🧮 + règle`,
  `Imprimer les annales`.
- After step 5: **4** items; the new one is last.
- After step 6: all of the above survived the restart, in the same order.

A duplicate appearing after an edit means the imported `uuid` is not the update key — a `FAIL`
against [D-06](./02-persisted-data-inventory.md#d-06).

**Online expected result.** Unchanged by sync — `ON-03`.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[checklist before/after screenshots]` `[post-restart screenshot]`

---

## `OFF-18` — Uniqueness sweep: nothing was migrated twice

**Purpose / risk.** A migration that runs twice — or that is not keyed on the record identity —
duplicates everything. Duplicates are worse than absence: they are hard to clean up and they
compound at every sync. Covers [D-04](./02-persisted-data-inventory.md#d-04),
[D-06](./02-persisted-data-inventory.md#d-06), [D-01](./02-persisted-data-inventory.md#d-01).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global. Run this **after** `OFF-16`/`OFF-17`, so it also covers the edits.

**Flutter setup.** All of `SEED-A` / `SEED-B`.

**Baseline.** `BASE-05`, `BASE-08`, `BASE-13` (`BASE-B2`, `BASE-B3`, `BASE-B4`, `BASE-B1`).

**Steps.**

1. **Mes événements** — count rows; scan for repeated titles.
2. `PE-A1` → **Liste de tâches** — count items; scan for repeated content.
3. **Mes calendriers** — count rows; scan for repeated names.
4. **Événements masqués** — count the by-name section; scan it for repeated entries. The
   by-uid section is not UI-observable until courses refetch. If MMKV can be decoded, separately
   compare the stored `uidHiddenEvents` set/count; otherwise defer it to `ON-05`.
5. Android with `run-as` available: run the row-count query from
   [05 §6](./05-android-in-place-update.md#after-the-update-react-native-installed) and compare
   the counts to what the UI shows.

**Offline expected result.**

| Surface | Pack A expected | Pack B expected |
| --- | --- | --- |
| Personal events | 4 (5 seeded, 1 deleted in `OFF-16`) | 59 |
| `PE-A1` checklist | 4 (3 seeded + 1 added in `OFF-17`) | 4 |
| Calendars | 1 | 3 |
| Hidden by uid | `NOT OBSERVABLE OFFLINE` (or decoded MMKV: 1) | `NOT OBSERVABLE OFFLINE` (or decoded MMKV: 21) |
| Hidden by name | 1 | 6 |

- No title, content, calendar name or **visible/stored-as-evidence** hidden entry appears twice.
- On Android, the SQLite counts match the UI counts. A mismatch means rows exist that the UI is not
  showing — a different bug from data loss, and worth distinguishing.

**Online expected result.** Re-run this sweep after `ON-01` — see `ON-02`.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[counts screenshot per surface]` `[sqlite3 output if collected]`

---

## `OFF-19` — The large pack is complete, ordered, and practically usable

**Purpose / risk.** Volume is where partial migration, truncation and pagination bugs surface, and
where a technically-correct import can still be unusable. Covers
[D-02](./02-persisted-data-inventory.md#d-02), [D-04](./02-persisted-data-inventory.md#d-04),
[D-06](./02-persisted-data-inventory.md#d-06), [D-08](./02-persisted-data-inventory.md#d-08),
[D-11](./02-persisted-data-inventory.md#d-11). UID-hidden completeness is proved after refetch in
`ON-05`, not from the offline screen.

**Platforms.** At least one per release; prefer Android, and the slower device if available.
**Packs.** B only.

**Preconditions.** Global. `SEED-B` fully seeded and baselined.

**Flutter setup.** `SEED-B-01`…`SEED-B-04`.

**Baseline.** `BASE-B1`…`BASE-B4`.

**Steps.**

1. **Counts.** Personal events, checklist items per owning event, calendars, and hidden-by-name.
   Compare each to `BASE-B*`. Record hidden-by-uid as `NOT OBSERVABLE OFFLINE` unless decoded MMKV
   evidence is available; its required UI/filter proof is `ON-05`.
2. **Sentinels.** Confirm `PE-B-001`, `PE-B-028`, `PE-B-055` are all present, with their overridden
   titles and colours intact.
3. **Ordering.** Open three of the 10-item checklists (`PE-B-001`, `PE-B-028`, `PE-B-055`).
   Confirm `item 01 — PREMIER` is first and `item 10 — DERNIER` is last, and that the
   even-numbered items are the checked ones.
4. **Hidden list.** Scroll the whole **Événements masqués** screen; count the by-name section.
   Do not expect unresolved uid rows before sync.
5. **Usability.** Record, informally:
   - Time from tap to interactive on first launch (compare with `OFF-01`'s pack-A figure).
   - Whether scrolling **Mes événements** is smooth end-to-end.
   - Whether opening an event's details feels immediate.
   - Whether the app is ever unresponsive for more than ~2 s.

**Offline expected result.**

- Personal events: **59** (60 seeded, 1 deleted in `OFF-16`).
- Checklist items: **135** — 134 seeded (`BASE-B3`) plus the one added in `OFF-17`. (`OFF-16`
  deletes `PE-A4`, which has no checklist, so the total is unaffected.) If you skipped or varied
  `OFF-16`/`OFF-17`, redo this arithmetic from your own baseline and **write it out in the
  report** rather than quoting this number.
- Calendars: **3**, one with visibility off.
- Hidden by name: **6**. Hidden by uid is `NOT OBSERVABLE OFFLINE` unless decoded MMKV evidence
  shows **21**; `ON-05` must show all **21** after refetch.
- All three sentinels present and correct. **A missing first or last sentinel is the signature of a
  truncated import** — say which one.
- Every checklist reads `PREMIER` → … → `DERNIER`.
- The app is usable: no ANR, no crash, no multi-second freeze.

> This is **not** a performance certification ([Non-goals](./README.md#non-goals)). Record numbers
> as observations. "Launch took 6 s with 60 events vs 2 s with 5" is a useful, reportable fact; it
> is not a pass/fail threshold.

**Online expected result.** Repeat the counts after `ON-01` — see `ON-02`.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[count screenshots for each surface]` `[sentinel screenshots]` `[scroll recording]` `[launch timing notes]`

---

## `OFF-20` — RN remembered feedback email starts empty and survives restart

**Purpose / risk.** Completes the inventory of RN-only persisted state and proves that a failed
offline request does not prevent the feedback form from remembering a valid normalized address.
Covers [D-29](./02-persisted-data-inventory.md#d-29).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global. No feedback form has been submitted in this RN install.

**Flutter setup.** None; Flutter has no corresponding durable value.

**Baseline.** None.

**Steps.**

1. Réglages → **Vos retours et suggestions**. Confirm **Adresse e-mail** is empty.
2. Enter email `  Etudiant.QA+Migration@Example.FR  ` and message `OFF-20 — hors ligne`.
3. Tap **Envoyer**. The offline request should fail; capture the failure message. Do not restore
   the network.
4. Leave and reopen **Vos retours et suggestions**.
5. Force-quit and relaunch the app, still offline; reopen the form again.

**Offline expected result.**

- Before step 2 the field is empty: no Flutter value was fabricated.
- After both reopen and full restart, the field is prefilled with the trimmed, case-preserving
  `Etudiant.QA+Migration@Example.FR` exactly once.
- The message is **not** remembered; only the email is persisted.
- The send failure is expected offline and is not itself a failure of this scenario.

**Online expected result.** n/a. Do not resend the synthetic QA message after restoring network.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[initial empty form]` `[offline failure]` `[prefill after reopen]` `[prefill after restart]`

---

# Part B — Online scenarios

**Global preconditions for every `ON-*` scenario:**

- All `OFF-*` scenarios and `REC-01`…`REC-03` are complete and recorded.
- The network has been restored (`MIG-IOS-09` / `MIG-AND-10`).
- **Nothing** was reinstalled, cleared, or reset in between.

---

## `ON-01` — The timetable comes back from the migrated token

**Purpose / risk.** The whole justification for not migrating the course cache: the courses must
rehydrate from the server *using the recovered token*. If they do not, the token did not survive in
a usable form — which `OFF-02` cannot detect on its own, because the token is never displayed.
Covers [D-01](./02-persisted-data-inventory.md#d-01), [D-12](./02-persisted-data-inventory.md#d-12).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global online preconditions.

**Flutter setup.** `SEED-A-01`, `SEED-A-02`.

**Baseline.** `BASE-01`, `BASE-02`, `BASE-03`.

**Steps.**

1. With the network restored, force-quit and relaunch the app (this fires the startup sync).
2. Wait for **Calendrier** to populate. If it does not, pull to refresh.
3. Compare the visible week against the `BASE-03` screenshot.
4. Open `COURSE-1` and compare every displayed field available in `BASE-03`: title, start/end,
   all-day/timed placement, room, description, teachers, tag names, cancellation state, and colour.
5. On Android when database extraction is available, decode one `calendar_events` row and record
   the exact `uid`, both colours, all three timestamps, parent calendar id, `type`, full teachers
   array, each tag's `{name,color,icon}`, and the full custom-fields object. Mark unavailable fields
   `NOT OBSERVABLE` on iOS/store builds; do not guess them from the UI.

**Online expected result.**

- Courses appear on **Calendrier** and **Accueil** within a normal sync time.
- `COURSE-1` is present with every baseline field the RN UI exposes unchanged. Any field not
  supplied by the reference course is recorded as empty, not silently skipped.
- The set of courses matches what Flutter showed in `BASE-03` (minus the hidden ones — see
  `ON-05`).
- No sync error banner persists after a successful refresh.

**A permanently empty calendar after a successful network sync is the strongest possible signal
that [D-01](./02-persisted-data-inventory.md#d-01) failed** — even if `OFF-02` showed a calendar
row. Record it as `FAIL` on both `ON-01` and, retroactively noted, `OFF-02`.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[Calendrier after sync screenshot]` `[COURSE-1 details screenshot]` `[side-by-side with BASE-03]`

---

## `ON-02` — Sync did not remove or duplicate migrated local content

**Purpose / risk.** The sync drops and replaces the whole `calendar_events` table on every run
(`mobile/src/features/calendar/data/sync/repository.ts`). If it reaches beyond its own table, it
takes the student's personal events with it. Covers
[D-04](./02-persisted-data-inventory.md#d-04), [D-01](./02-persisted-data-inventory.md#d-01).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global online preconditions. `ON-01` completed.

**Flutter setup.** All of `SEED-A` / `SEED-B`.

**Baseline.** The post-`OFF-18` counts.

**Steps.**

1. Re-run the whole `OFF-18` uniqueness sweep, now online and post-sync.
2. Specifically re-check: personal-event count, `PE-A1` checklist count, calendar count, both
   hidden-event counts.
3. Confirm the `OFF-16` edit (`Révisions Analyse 2 (modifié)`) is still in place and that the
   `OFF-16` deletion (`PE-A4`) has not come back.
4. Pull to refresh on **Calendrier** to force a second sync. Re-count.

**Online expected result.**

- Every count is **identical** to the post-`OFF-18` figures. Not one more, not one fewer.
- `PE-A4` stays deleted.
- The `OFF-16` title edit stays.
- Calendars: still 1 (pack A) / 3 (pack B). **A calendar count that grows after sync means the
  token was re-registered as a new calendar — a `FAIL`.**
- The second refresh changes nothing.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[post-sync counts for every surface]` `[post-second-refresh counts]`

---

## `ON-03` — Checklists on school courses survived the sync's drop-and-replace

**Purpose / risk.** The single most subtle data-loss path in the whole migration. Notes on a
*course* are joined to that course's `uid`, and the sync deletes and re-inserts every course row.
The join is deliberately soft (no foreign key) precisely so the notes survive
(`mobile/src/db/schema.ts:133-140`) — this scenario proves it on real data. Covers
[D-06](./02-persisted-data-inventory.md#d-06), [D-07](./02-persisted-data-inventory.md#d-07).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global online preconditions. `ON-01` completed — `COURSE-1` is visible again.

**Flutter setup.** `SEED-A-04` → `CL-A2` on `COURSE-1`.

**Baseline.** `BASE-07`.

**Steps.**

1. Open `COURSE-1` from **Calendrier**.
2. Read the **Liste de tâches**.
3. Pull to refresh on **Calendrier** to force a second sync.
4. Reopen `COURSE-1` and read the checklist again.
5. Force-quit, relaunch, reopen, read again.
6. Pack B: repeat for `COURSE-4`, `COURSE-5`, `COURSE-6`.

**Online expected result.**

- `COURSE-1` shows exactly **2** items, in order:
  1. `Rapport de TP à rendre` — unchecked
  2. `Groupe : Léa, Ismaël, Théo` — **checked**
- The items are still there after the second sync (step 3) and after the restart (step 5).
- They have not moved to a different course, and have not been duplicated.

**If the items disappear only after step 3**, the sync is cascading into `checklist_items` — a
severe, and severely non-obvious, `FAIL`. Say so explicitly in the notes, because it is
distinguishable from "they never migrated" only by this ordering.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[COURSE-1 checklist after first sync]` `[after second sync]` `[after restart]`

---

## `ON-04` — Push registration completes for a migrated install

**Purpose / risk.** The push token is not migrated (it regenerates), but registration must still
succeed on an upgraded install rather than only on a fresh one. Covers
[D-22](./02-persisted-data-inventory.md#d-22), [D-25](./02-persisted-data-inventory.md#d-25).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global online preconditions.

**Flutter setup.** None specific.

**Baseline.** —

**Steps.**

1. Relaunch the app with the network up.
2. Accept the notification-permission prompt if one appears.
3. Réglages → **Notifications**. Toggle a preference and toggle it back.
4. Force-quit and relaunch; re-read the preferences.
5. Android: check the logcat for registration errors.

**Online expected result.**

- No crash and no visible error on the notifications screen.
- Preference changes persist across the restart.
- If the platform prompted for notification permission, the prompt behaved normally.

> Actually **receiving** a push is out of scope here — it needs a server-side trigger and is
> covered by the existing device-verification note
> [`../inbox/2026-06-17-fcm-push-receive-device-verification.md`](../inbox/2026-06-17-fcm-push-receive-device-verification.md).
> This scenario only proves that migration did not break registration.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[Notifications screen]` `[logcat excerpt if Android]`

---

## `ON-05` — Hidden events actually filter the freshly synced courses

**Purpose / risk.** `OFF-10` proved the hidden *set* survived. This proves it still *does its job*
against real course data — the set could migrate perfectly and still fail to match if the uids or
titles were transformed. Covers [D-10](./02-persisted-data-inventory.md#d-10),
[D-11](./02-persisted-data-inventory.md#d-11).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global online preconditions. `ON-01` completed.

**Flutter setup.** `SEED-A-05` (`SEED-B-04`).

**Baseline.** `BASE-09`, `BASE-10` (`BASE-B4`).

**Steps.**

1. **Calendrier** → navigate to the week containing `COURSE-2`.
2. Confirm that occurrence is absent.
3. Navigate across the next 14 days looking for **any** occurrence of `COURSE-3`'s title.
4. Réglages → **Événements masqués** — the by-uid entries should now resolve to readable titles.
5. Un-hide `COURSE-2` (**Afficher**) and confirm it reappears on the calendar.
6. Re-hide it from its detail screen (**Masquer** → **Masquer cet événement**) and confirm it
   disappears again.

**Online expected result.**

- `COURSE-2`'s specific occurrence is hidden; other occurrences of the same course (if any) are
  visible — hiding by uid is per-occurrence.
- **No** occurrence of `COURSE-3` is visible anywhere in the 14-day window — hiding by name is
  wholesale.
- The **Événements masqués** screen now resolves the full baseline set: by uid **1** (pack A) /
  **21** (pack B), and by name **1** / **6**. This post-refetch check (or decoded MMKV evidence) is
  the proof that UID-hidden data survived; `OFF-10` alone cannot prove it from the UI.
- Un-hide and re-hide both work on migrated entries (they are usable, not just present).

**A hidden-by-uid entry that no longer matches** (the course reappears) means the uid changed
between Flutter and RN — record it as `FAIL` and note the uid if you can read it.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[Calendrier week screenshot, COURSE-2 absent]` `[14-day sweep for COURSE-3]` `[un-hide / re-hide screenshots]`

---

## `ON-06` — Repeated syncs are idempotent

**Purpose / risk.** A migration bug can be latent: everything looks right after one sync and
degrades after several. This is the cheapest way to catch a per-sync leak. Covers
[D-04](./02-persisted-data-inventory.md#d-04), [D-06](./02-persisted-data-inventory.md#d-06),
[D-12](./02-persisted-data-inventory.md#d-12).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global online preconditions. `ON-01`…`ON-05` complete.

**Flutter setup.** All of `SEED-A` / `SEED-B`.

**Baseline.** The post-`ON-02` counts.

**Steps.**

1. Pull to refresh on **Calendrier**. Wait for it to finish.
2. Repeat **five** times, with a force-quit and relaunch between the third and fourth.
3. After the last one, re-count: courses in the visible week, personal events, `PE-A1` checklist,
   calendars, both hidden sections.

**Online expected result.**

- Every count is identical to the post-`ON-02` figures.
- The visible week shows the same courses, each **once**. Growing course counts across syncs is a
  `FAIL`.
- No crash, and the app stays responsive.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[counts after sync 1]` `[counts after sync 6]` `[week screenshots for comparison]`

---

## Scenario → datum coverage

| Scenario | Data covered |
| --- | --- |
| `OFF-01` | D-12, D-21, D-23 |
| `OFF-02` | D-01, D-02 |
| `OFF-03` | D-03 |
| `OFF-04` | D-04, D-05 |
| `OFF-05` | D-04 |
| `OFF-06` | D-04 |
| `OFF-07` | D-04 |
| `OFF-08` | D-06, D-08, D-09 |
| `OFF-09` | D-07 |
| `OFF-10` | D-10, D-11 |
| `OFF-11` | D-15 |
| `OFF-12` | D-14, D-24 |
| `OFF-13` | D-13, D-16, D-17, D-20 |
| `OFF-14` | D-23 |
| `OFF-15` | D-18, D-25 |
| `OFF-16` | D-04 |
| `OFF-17` | D-06, D-08 |
| `OFF-18` | D-01, D-04, D-06 |
| `OFF-19` | D-02, D-04, D-06, D-08, D-11 |
| `OFF-20` | D-29 |
| `ON-01` | D-01, D-12 |
| `ON-02` | D-01, D-04 |
| `ON-03` | D-06, D-07 |
| `ON-04` | D-22, D-25 |
| `ON-05` | D-10, D-11 |
| `ON-06` | D-04, D-06, D-12 |

---

← [05 — Android in-place update](./05-android-in-place-update.md) · [Section index](./README.md) · next: [07 — Failure, restart & recovery](./07-failure-restart-and-recovery-scenarios.md)
