# 07 — Failure, restart & recovery scenarios

← [06 — Offline & online verification](./06-offline-and-online-verification-scenarios.md) · [Section index](./README.md) · next: [08 — QA execution report](./08-qa-execution-report-template.md)

> `REC-01` … `REC-07`. The things that actually happen to real students during an update: no
> network, the app gets killed mid-launch, the phone reboots, the sync drops halfway.
>
> These are **executable** checks. Fault injection that QA cannot perform reliably — corrupting the
> sembast file, simulating a disk-full write, forcing a partial import — is deliberately excluded;
> those belong in unit and integration tests, not in a manual playbook.

---

## Where these fit in the run order

`REC-01`…`REC-04` run at **step 8** of the canonical order
([01 §6](./01-scope-prerequisites-and-execution-order.md#6-the-canonical-execution-order)) —
after the offline scenarios, still offline. `REC-05` and `REC-07` run at **step 10**, after the
network is back. `REC-06` is a **separate fresh offline pass**: reinstall the released Flutter
source, seed/baseline it, update in place, keep the first RN launch offline, and background that
fresh first launch. It cannot be appended to the already-online standard pass.

**Global preconditions:** the same as the `OFF-*` / `ON-*` scenarios in
[06](./06-offline-and-online-verification-scenarios.md). Nothing has been reinstalled, cleared, or
reset.

---

## `REC-01` — Survives repeated offline launches

**Purpose / risk.** The most common real-world first launch: a student updates on the bus, opens
the app, and there is no usable connection. If the import is entangled with a network call, or if
a failed sync aborts it, the data is gone on the very first launch a real user sees. Covers
[D-01](./02-persisted-data-inventory.md#d-01), [D-04](./02-persisted-data-inventory.md#d-04),
[D-06](./02-persisted-data-inventory.md#d-06), and the UI-observable
[D-11](./02-persisted-data-inventory.md#d-11). D-10 is storage-observable only until refetch.

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global. Device still offline. `OFF-01`…`OFF-18` recorded.

**Flutter setup.** All of `SEED-A`.

**Baseline.** The post-`OFF-18` counts.

**Steps.**

1. Force-quit the app (swipe it away from the app switcher; on Android also acceptable:
   `adb shell am force-stop fr.samuelprak.timecalendar`).
2. Relaunch. Still offline.
3. Check: personal-event count, `PE-A1` checklist count, calendar count, the hidden-by-name
   section, and that the theme remains the same as the `OFF-12` observation. UID-hidden rows remain
   unresolvable offline; compare decoded MMKV evidence if available, otherwise leave their
   durability proof to `ON-05`.
4. Repeat steps 1–3 **three** times in total.

**Offline expected result.**

- Every launch succeeds. No crash, no onboarding, no empty state.
- All UI-observable counts (plus decoded-storage counts, if collected) are identical on every
  launch — no growth (a re-running import) and no shrinkage.
- The **Nouveautés** sheet does not reappear after the first time (this re-confirms `OFF-11`
  across restarts).
- The sync-error banner may appear each launch. Expected offline.

**Online expected result.** n/a.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[counts after each of the three launches]`

---

## `REC-02` — Killed during first launch, then relaunched

**Purpose / risk.** Roadmap 09 step 5 requires the importer to be flag-guarded so that "a crash
mid-migration is retried, not skipped". This is the executable version of that requirement: kill
the app during the window when an import would be running, then check that the retry completes the
job **once**, rather than skipping it (data loss) or redoing it on top of partial results
(duplicates). Covers [D-01](./02-persisted-data-inventory.md#d-01),
[D-04](./02-persisted-data-inventory.md#d-04), [D-06](./02-persisted-data-inventory.md#d-06),
[D-15](./02-persisted-data-inventory.md#d-15).

**Platforms.** iOS + Android. **Packs.** B strongly preferred — the large pack widens the window
during which a kill can land mid-import. Pack A works but the window may be too short to hit.

**Preconditions.** ⚠️ **This scenario must be run on a *fresh* migration**, i.e. as an alternative
first launch. Once the import has completed, killing the app proves nothing about retry.

**How to get a fresh migration.** There is no supported way to re-arm the import on a device — the
flag is internal. So `REC-02` is run as a **second full pass**:

1. Complete a normal pass (`MIG-*-01` … `OFF-18`) and record it.
2. Then start over: uninstall, reinstall Flutter from the store, re-seed (a shortened seed is
   acceptable here — see below), re-baseline, go offline, update in place.
3. On **this** first launch, execute the steps below.

Because that is a whole extra pass, `REC-02` may use a **reduced seed**: 1 calendar,
`PE-A1`+`PE-A3`, `CL-A1` (3 items), `HID-A1`+`HID-A2`, theme dark. Record that you used the
reduced seed.

**Flutter setup.** The reduced seed above, or a full `SEED-B`.

**Baseline.** Whatever you seeded, fully recorded before the update.

**Steps.**

1. Tap the icon.
2. **Kill the app within ~1 second**, as soon as the splash appears — swipe it out of the app
   switcher, or `adb shell am force-stop fr.samuelprak.timecalendar`.
3. Relaunch. Let it settle fully.
4. Verify: calendar count, personal events (titles and values), `PE-A1`'s 3 checklist items in
   order, the hidden-by-name section, and the observed theme. UID-hidden rows cannot resolve while
   the course cache is empty; use decoded MMKV evidence if available and otherwise defer them to
   the post-refetch `ON-05` check for this fresh pass.
5. Force-quit and relaunch once more; re-verify.
6. Repeat the whole scenario a second time with the kill at ~3 seconds instead of ~1.

**Offline expected result.**

- After the relaunch in step 3, all UI-observable seeded data is present exactly once. UID-hidden
  survival is not inferred from the offline screen; decoded storage or the later `ON-05` proves it.
- Nothing is duplicated — no doubled personal events, no doubled checklist items, no second
  calendar row.
- Nothing is missing.
- The **Nouveautés** sheet is shown once across the whole sequence (either on the killed launch or
  on the relaunch), not on every launch.
- Step 5 changes nothing.

**Three distinguishable failure shapes — say which one you saw:**

| Observed after the kill + relaunch | Meaning |
| --- | --- |
| Data **missing** | The import marked itself done before finishing — not retry-safe. |
| Data **duplicated** | The retry re-imported on top of partial results without keying on identity. |
| App **will not launch** | The interrupted import left the store in a state the app cannot read. |

**Online expected result.** n/a.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:** (state the kill timing and whether the reduced seed was used)
**Evidence:** `[recording of the killed launch]` `[post-relaunch counts]` `[second-relaunch counts]`

---

## `REC-03` — Device restart around first launch

**Purpose / risk.** A reboot is a harsher kill than a force-quit: the OS terminates without
warning, buffered writes may not have been flushed, and on Android the app comes back in a cold
process. Students reboot phones constantly. Covers the same data as `REC-02`.

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Global. Device still offline. Run this **after** `REC-01`, on the same install.

**Flutter setup.** All of `SEED-A` / `SEED-B`.

**Baseline.** The post-`OFF-18` counts.

**Steps.**

1. With the app in the foreground and settled, **restart the device**. Keep airplane mode on
   through the reboot — check it immediately after the device comes back, because some devices
   restore connectivity on boot.
2. If connectivity came back, turn it off again **before** launching the app, and note that it
   happened.
3. Launch the app.
4. Verify: personal-event count, `PE-A1` checklist and its order, calendar count, the
   hidden-by-name section, the same theme behavior recorded in `OFF-12`, and that the
   **Nouveautés** sheet does not reappear. Treat UID-hidden rows as unobservable offline unless
   decoded MMKV evidence is available.

**Offline expected result.**

- The app launches normally after the reboot.
- Every count and value matches the post-`OFF-18` figures.
- No duplication, no loss, no re-run of the changelog sheet.

**Online expected result.** n/a — unless step 2's note applies, in which case flag that this
particular run of `REC-03` was not strictly offline.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[post-reboot launch recording]` `[post-reboot counts]`

---

## `REC-04` — The legacy Flutter data is still on disk (safety net)

**Purpose / risk.** Roadmap 09 step 6 specifies keeping `simple_database.db` on disk for one
release so a botched migration is recoverable. This scenario checks whether that safety net is
actually there — it is the difference between "we can write a recovery build" and "the data is
gone forever". Covers [D-28](./02-persisted-data-inventory.md#d-28).

**Platforms.** Android (reliably); iOS only with a Mac and a development-signed build.
**Packs.** A, B.

**Preconditions.** Global. The update has happened and the app has been launched at least once.

**Flutter setup.** All of `SEED-A`.

**Baseline.** The pre-update evidence from `MIG-AND-04`, if you collected it.

**Steps.**

**Android** — run the "after the update" block from
[05 §6](./05-android-in-place-update.md#after-the-update-react-native-installed):

```sh
adb shell run-as fr.samuelprak.timecalendar find . -name 'simple_database.db'
adb shell run-as fr.samuelprak.timecalendar find . -name 'timecalendar.db'
```

**iOS** — Xcode → Devices and Simulators → Installed Apps → TimeCalendar → ⚙ → **Download
Container…**, then inspect `AppData/Documents/`.

**Offline expected result.**

- `simple_database.db` is **still present** after the update.
- `timecalendar.db` **also** exists (the RN database).
- Both coexisting is the intended state for one release.

**Recording rules:**

| Observed | Record as |
| --- | --- |
| Both files present | `PASS` |
| `simple_database.db` deleted | `FAIL` against [D-28](./02-persisted-data-inventory.md#d-28); note [Q-11](./09-open-engineering-questions.md#q-11--is-the-one-release-sembast-safety-net-implemented) |
| `run-as` refused (production build) or no Mac available | **`NOT OBSERVABLE`**. Not a failure — you could not look. Note [Q-11](./09-open-engineering-questions.md#q-11--is-the-one-release-sembast-safety-net-implemented). |

**Online expected result.** n/a.

**Result:** ☐ PASS ☐ FAIL ☐ NOT OBSERVABLE ☐ BLOCKED
**Notes:**
**Evidence:** `[find output]` `[container listing]`

---

## `REC-05` — Sync interrupted mid-flight

**Purpose / risk.** Students lose signal constantly. The sync's drop-and-replace must never leave
the app with *neither* the old courses nor the new ones — and it must certainly never take the
personal events with it. Covers [D-04](./02-persisted-data-inventory.md#d-04),
[D-06](./02-persisted-data-inventory.md#d-06), [D-12](./02-persisted-data-inventory.md#d-12).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Network restored. `ON-01` and `ON-02` complete, so a known-good synced state
exists.

**Flutter setup.** All of `SEED-A`.

**Baseline.** The post-`ON-02` counts, plus a screenshot of the currently-synced week.

**Steps.**

1. Note the courses visible in the current week.
2. Pull to refresh on **Calendrier** and, **while the refresh indicator is still showing**, turn
   airplane mode **on**.
3. Observe what the calendar shows.
4. Check the personal events and `PE-A1`'s checklist.
5. Turn airplane mode **off**, pull to refresh again, and let it complete.
6. Re-check everything.

**Online expected result.**

- After the interruption (step 3): the calendar still shows the **last-good** courses, or an error
  banner ("Impossible d'actualiser votre calendrier. Affichage de votre dernière mise à jour.").
  It must **not** go blank. The design is explicit that the replace only runs after a successful
  fetch (`mobile/src/features/calendar/data/sync/sync.ts`), so a blank calendar here is a `FAIL`.
- Personal events and checklists are completely untouched by the failed sync.
- After step 5: the calendar is back to the full synced state and the counts match post-`ON-02`.
- No duplicate courses.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[week before]` `[during interruption]` `[after recovery]`

---

## `REC-06` — Backgrounded and resumed during first launch

**Purpose / risk.** A notification, a call, or the student switching apps during the first launch.
On iOS a backgrounded app can be suspended and later terminated; on Android an aggressive OEM
battery policy will kill it. A migration that only completes while in the foreground is fragile.
Covers the same data as `REC-02`.

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** A separate fresh Flutter → RN migration pass, prepared like the `REC-02` second
pass. Network is disabled before the update and remains disabled through this scenario. An
already-migrated install is only a general background/resume smoke check and **does not execute
`REC-06`**; record it separately rather than marking this scenario passed.

**Flutter setup.** As for `REC-02`.

**Baseline.** As for `REC-02`.

**Steps.**

1. Tap the icon, and within ~1 second press **Home** (or swipe up) to background the app.
2. Wait 30 seconds.
3. Return to the app from the app switcher.
4. Wait for it to settle, then verify all UI-observable seeded data. UID-hidden rows remain
   unobservable offline unless MMKV can be decoded; defer their UI proof to `ON-05`.
5. Force-quit, relaunch, verify again.

**Offline expected result.**

- The app resumes without a crash.
- All UI-observable seeded data is present, exactly once, after step 3. Do not fail the scenario
  because the unresolved UID-hidden section is absent offline.
- Step 5 changes nothing.
- If the OS terminated the app while backgrounded and it cold-started in step 3, that is fine —
  and it makes this a second sample of `REC-02`. Note which happened.

**Online expected result.** n/a.

**Result:** ☐ PASS ☐ FAIL ☐ N/A ☐ BLOCKED
**Notes:**
**Evidence:** `[recording of background/resume]` `[post-resume counts]`

---

## `REC-07` — A later JS (OTA) update does not disturb migrated data

**Purpose / risk.** The RN app can receive JS-only updates over the air
([`../../mobile/architecture-book/eas.md`](../../mobile/architecture-book/eas.md)). The very
plausible sequence for a real student is: migrate → receive a hotfix hours later → relaunch. This
checks that the second update does not re-run an import or disturb the migrated data. Covers
[D-01](./02-persisted-data-inventory.md#d-01), [D-04](./02-persisted-data-inventory.md#d-04),
[D-06](./02-persisted-data-inventory.md#d-06).

**Platforms.** iOS + Android. **Packs.** A, B.

**Preconditions.** Network restored. `ON-01`…`ON-06` complete. **An OTA update must actually be
available on the build's channel** — coordinate with the release owner. If none is, this scenario
is `BLOCKED`, not `FAIL`.

**Flutter setup.** All of `SEED-A`.

**Baseline.** The post-`ON-06` counts.

**Steps.**

1. Confirm with the release owner that an OTA update is published to this build's channel.
2. Launch the app and leave it in the foreground long enough for the update to be fetched.
3. Force-quit and relaunch so the new bundle is applied.
4. Réglages → **À propos** — confirm the build/update identifier changed, if the screen shows one.
5. Re-verify: personal events, `PE-A1`'s checklist, calendars, both hidden sections, theme.
6. Pull to refresh on **Calendrier** and re-verify.

**Online expected result.**

- The OTA update applied without a crash.
- Every count and value is identical to post-`ON-06`.
- The **Nouveautés** sheet does not re-appear unless the OTA genuinely bumped the changelog
  version — if it did, it should show once, and that is correct, not a failure. Say which.
- No duplication.

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED
**Notes:**
**Evidence:** `[À propos before/after]` `[post-OTA counts]`

---

## Deliberately excluded

For the record, so the omissions read as decisions rather than gaps:

| Not covered | Why |
| --- | --- |
| Corrupting `simple_database.db` and observing the fallback | Requires root or a debuggable build plus a hand-crafted corrupt file; QA cannot do it reliably or reproducibly on a store install. Belongs in unit tests over fixtures. |
| Disk-full during import | Not reliably reproducible on a modern phone without destructive setup. |
| Forcing a *partial* import (stop after N records) | Requires instrumentation the shipped build does not have. `REC-02`'s kill is the executable approximation. |
| Downgrading RN → Flutter | A store downgrade is not a path real students have, and it is a release-rollback question, not a data-migration one. |
| Migration under a locked device / during a phone call | No plausible distinct failure mode beyond what `REC-06` already covers. |
| Multi-user / work-profile installs | Out of scope with the device matrix ([01 §5](./01-scope-prerequisites-and-execution-order.md#5-devices)). |

---

## Recovery scenario → datum coverage

| Scenario | Data covered |
| --- | --- |
| `REC-01` | D-01, D-04, D-06, D-11, D-14 observation, D-15; D-10 only with decoded storage |
| `REC-02` | D-01, D-04, D-06, D-15; D-10 only with decoded storage / later ON-05 |
| `REC-03` | D-01, D-04, D-06, D-11, D-14 observation, D-15; D-10 only with decoded storage |
| `REC-04` | D-28 |
| `REC-05` | D-04, D-06, D-12 |
| `REC-06` | D-01, D-04, D-06; D-10 only with decoded storage / later ON-05 |
| `REC-07` | D-01, D-04, D-06, D-10, D-15 |

---

← [06 — Offline & online verification](./06-offline-and-online-verification-scenarios.md) · [Section index](./README.md) · next: [08 — QA execution report](./08-qa-execution-report-template.md)
