# Tasks — reconcile the calendar naming/import specs, roadmap and Architecture Book

> **This change ships no code.** Only `openspec/`, `docs/react-native-migration/01-roadmap/` and
> `docs/mobile/architecture-book/` may change. If a document cannot be made true without touching a
> source file, stop and report it on [TIM-393](/TIM/issues/TIM-393) — do not edit around it and do
> not edit the source file. One such case is already known (§7.1).
>
> Preconditions, verify before starting:
>
> - `git fetch origin main` and confirm the three implementation commits are ancestors of `HEAD`:
>   `5f14a146` (#313), `3bba3364` (#321), `a10ab396` (#323). Every claim below is measured against
>   `main`, not against the tech spec's intent.
> - Do the rehearsal archive **first** (§1.2), not last. `openspec validate` does not check
>   `MODIFIED`/`REMOVED` delta headers against the live specs — only `openspec archive` does, and in
>   this pipeline that runs at merge time behind a long gate.
> - Derive the diff baseline as `git merge-base origin/main HEAD`, never a hardcoded SHA.

## 1. Validate the authored deltas before writing anything else

- [ ] 1.1 `openspec validate reconcile-calendar-naming-import-docs --strict` passes.
      If a requirement fails on a missing modal verb, check the **first line** of its body — the
      `SHALL`/`MUST` must be on line 1, not on a wrapped continuation line.
- [ ] 1.2 **Rehearsal archive.** On a clean tree, run
      `openspec archive reconcile-calendar-naming-import-docs -y`, then inspect
      `git diff openspec/specs/` and confirm:
      - every `MODIFIED` header matched an existing requirement (the diff shows a body replacement,
        not an added near-duplicate requirement);
      - all five `REMOVED` requirements disappeared from
        `openspec/specs/mobile-school-selection/spec.md`;
      - the two `ADDED` requirements landed once each.
      Then undo it: `git checkout -- openspec/specs/`, delete the folder the rehearsal created under
      `openspec/changes/archive/`, and restore `openspec/changes/reconcile-calendar-naming-import-docs`.
      The real archive happens at the archive stage.
      Note: `openspec archive` **prepends the date itself**, producing
      `archive/2026-08-30-reconcile-calendar-naming-import-docs`. That is why the change folder is
      not named with a date — a dated folder archives as `2026-08-30-2026-08-30-…`.
- [ ] 1.3 Fix any header mismatch found in 1.2 in
      `openspec/changes/reconcile-calendar-naming-import-docs/specs/**` and re-run 1.1–1.2
      until both are clean.

## 2. ADR numbering — claim and prove the numbers

- [ ] 2.1 Re-run the census against the current `main`:
      `ls docs/mobile/architecture-book/decisions/` for the highest merged number, and
      `for n in $(gh pr list --state open --json number --jq '.[].number'); do gh pr diff $n --name-only | grep -q decisions/ && echo "PR #$n takes an ADR"; done`
      for open claims. Record what you found in the PR body.
- [ ] 2.2 Expected result at authoring time (`ed4fbf22`): highest merged `048`; `045` reserved by open
      PR [#273](https://github.com/timecalendar/timecalendar/pull/273) (filed under its pre-renumber
      name `044-preserve-content-and-advise-source-recovery.md`); no other open PR touches
      `decisions/`. Therefore this change takes **049, 050, 051**. If 2.1 disagrees, use the next
      three free numbers and update every reference in this file, the ADRs, the index, the topical
      files, the `CHANGELOG.md` entry and the `mobile-architecture-book` delta together.
- [ ] 2.3 Repeat 2.1 immediately before the PR merges. A duplicate ADR number is invisible to git —
      two differently-named files merge cleanly — so nothing but this re-check catches it.

## 3. Write the three ADRs

Follow `docs/mobile/architecture-book/decisions/TEMPLATE.md`: Status / Context / Decision /
Consequences / Revisit if. Keep each one short — a record, not an essay. Source material: the
canonical spec `docs/react-native-migration/05-tech-specs/calendar-naming-and-manual-import.md`
(§"Architecture decisions" 3, 5 and the `/v1` risk row), the shipped code named in `design.md`, and
the existing rule paragraphs in `features.md` / `data.md`.

- [ ] 3.1 `049-token-authorized-shared-calendar-rename.md` — *Authorize calendar rename by token
      possession and accept last-write-wins*.
      **Context:** calendars are reached only by a bearer token in the URL path; there is no account,
      owner or per-device identity, and a token is routinely shared inside a cohort.
      **Decision:** possession of the token is the entire capability — read, sync and rename;
      `PATCH /v1/calendars/{token}` returns `404` for an unknown token without revealing anything;
      duplicate names are accepted and last write wins; the rename never touches `lastUpdatedAt`,
      which means successful upstream refresh; the renaming device persists the name the **server
      returned**, not the typed string, so it converges by the same rule every other device does.
      **Rejected:** ownership/accounts, per-device aliases, rename permissions, rename history.
      **Consequences:** a cohort member can rename for everybody, with no audit trail and no undo;
      empty names stay legal and are handled by the display fallback, not by a backfill.
      **Revisit if:** accounts or per-calendar ownership arrive; a support case turns "who renamed
      this" into a real question; per-device aliases are requested.
- [ ] 3.2 `050-path-level-v1-prefix-without-global-versioning.md` — *Version individual controllers by
      path, never globally*.
      **Context:** the rename endpoint is a new contract, while Flutter release builds in the field
      call the existing unversioned calendar routes and cannot be updated.
      **Decision:** `/v1` is a literal prefix inside a controller's own path;
      `app.enableVersioning` stays off because it would apply a default version to every controller,
      including the ones Flutter calls. Two routes carry the prefix today —
      `PATCH /v1/calendars/{token}` (`CalendarV1Controller`, in the existing `CalendarModule`) and
      `POST /v1/calendar-logs/search`. Every other calendar route — read by token, create, sync —
      stays unversioned. An API-wide versioning migration is deferred, not decided.
      **Consequences:** the contract carries two routing styles; a contributor may copy the wrong
      one, which is why the rule is also in `data.md`.
      **Revisit if:** a third or fourth `/v1` route makes per-controller prefixes more expensive than
      one global migration; a breaking change is needed on a route Flutter still calls; Flutter is
      retired.
- [ ] 3.3 `051-eventual-calendar-name-convergence-through-sync.md` — *Converge names on sync with a
      name-only write, in its own failure domain*.
      **Context:** a rename is global to every holder of the token, but only the renaming device
      learns immediately. Every other installation has to find out somehow, and the obvious
      mechanism — reusing the DTO mapper to refresh the row from the sync response — is a trap:
      `fromCalendarForPublic` hard-codes the client-only `visible: true`, so a full-row write would
      unhide a hidden calendar at every sync.
      **Decision:** after the event replace, sync compares each returned `calendar.name` with the
      local row and calls the narrow `updateName(id, name)` for **only** the rows that differ. Never
      an upsert, never the DTO mapper, no other column. The event replace and the name write-back are
      two failure domains on purpose: a failed name write keeps the replaced events committed and the
      last-good names in place, reports under its own context, and leaves convergence to the next
      sync.
      **Consequences:** convergence is eventual and unordered — a device can show a stale name for one
      sync cycle, which is accepted; adding a second server-owned field means adding a second narrow
      write, not relaxing this into a full-row upsert. No type or lint rule can express "this write
      must stay narrow" (R-1), which is why the rule is in `features.md` and the reasoning is here.
      **Revisit if:** a second server-owned field has to converge; `visible` (or another local-only
      column) stops being client-only; the two writes have to become one transaction.
- [ ] 3.4 Each ADR cites ADR
      [047](../../../docs/mobile/architecture-book/decisions/047-ephemeral-calendar-import-draft.md)
      where the import draft is relevant, and does **not** restate it.

## 4. Wire the ADRs into the book

- [ ] 4.1 `decisions/README.md`: add one index row per new ADR to the **Active decisions** table, in
      numeric order after `048`. Keep the one-line summary in the table's voice (imperative,
      no trailing period).
- [ ] 4.2 `decisions/README.md`: update the reservation note under the table so it stays accurate —
      `045` is still reserved for [#273](https://github.com/timecalendar/timecalendar/pull/273), and
      the numbers this change consumed are now taken. Keep the existing instruction to check open PRs
      with `gh pr diff <N> --name-only | grep decisions/`.
- [ ] 4.3 `features.md`: link the rename paragraph (the "token is a capability" sentence) to ADR 049
      and the name-convergence paragraph to ADR 051. Add the links only — the rule text is already
      correct and must not be reworded.
- [ ] 4.4 `data.md`: link the `/v1` bullet to ADR 050. Same constraint — link only.
- [ ] 4.5 `navigation.md`: no change needed (its import-journey and dormant-group paragraphs already
      match `main` and already link ADR 047). Confirm by reading, and tick this box to record the
      audit.
- [ ] 4.6 `CHANGELOG.md`: append one dated `## 2026-08-30` entry — under the existing heading, since
      the epic's other entries are already there — recording that the three decisions were promoted
      from topical rules to indexed ADRs, what each one commits us to, and which topical file links
      to which record. Follow the file's existing voice: state the load-bearing reason, not the
      activity.

## 5. Correct the roadmap

Target: `docs/react-native-migration/01-roadmap/`. Correct in place with evidence (design D5); do not
rewrite the history of what shipped.

- [ ] 5.1 `03-onboarding-and-sources.md` step 2 (**School / school-group selection**): keep the record
      that the picker landed, and append a dated correction — as of 2026-08-30
      ([TIM-391](/TIM/issues/TIM-391), [#323](https://github.com/timecalendar/timecalendar/pull/323),
      `a10ab396`) a school row opens the import journey's programme step, the group step is retained
      but reached by nothing and creates no calendar, and school groups are explicitly not
      implemented or enabled. Point at
      `docs/mobile/architecture-book/navigation.md` and ADR 047.
- [ ] 5.2 Same file, step 3 (**QR scan**): record that QR gained its first real entry point — the
      manual-import step — in #323, replacing "deep link only".
- [ ] 5.3 Same file, step 4 (**iCal import**): the "a welcome CTA" claim is stale — the carousel's QR
      and URL actions were removed (ADR 036) and the iCal-URL route is now reached from the
      manual-import step. Correct it, and add the naming/rename outcome
      ([TIM-390](/TIM/issues/TIM-390) #313, [TIM-392](/TIM/issues/TIM-392) #321): created calendars
      now carry real institution and programme metadata instead of the `Dev import` literals.
- [ ] 5.4 Same file, step 5 (**Identity persistence**): add that names now converge across
      installations on the sync path through a name-only write (#321, `3bba3364`), and that the local
      `visible` flag survives it.
- [ ] 5.5 Same file, **Exit criteria**: the "add a calendar via **school pick** (steps 1–2)" bullet is
      false — the group step persisted a selection and dismissed without creating a calendar.
      Correct it to the shipped path: school → programme → Connect → QR or iCal URL.
- [ ] 5.6 Same file, **Phase 03 status**: leave the original completion record intact and append the
      2026-08-30 amendment with the three PR numbers and merge commits.
- [ ] 5.7 `03-ship-loop-prompt.md` line "**Full school / school-group picker**": mark it superseded by
      the import journey; the ship-loop prompt is a historical dispatch document, so annotate rather
      than rewrite.
- [ ] 5.8 `08-assistant.md`: add one line under **Rough steps** naming the **Connect → manual-import
      edge** as the assistant's insertion point, kept deliberately explicit by this epic so the
      assistant can be inserted without touching the preceding screens (ADR 047,
      `navigation.md`). One line — Phase 08's plan is otherwise out of scope.

## 6. Evidence links

- [ ] 6.1 Every roadmap correction from §5 cites its merged PR number **and** merge commit
      (`#313`/`5f14a146`, `#323`/`a10ab396`, `#321`/`3bba3364`).
- [ ] 6.2 Cite named, in-repo verification evidence rather than "tests pass":
      - server — `server/src/modules/calendar/controllers/calendar-v1.controller.test.ts`,
        `helpers/calendar-name.test.ts`, `modules/contact/controllers/contact.controller.test.ts`;
      - journey — `mobile/src/features/onboarding/**` colocated tests (draft, programme, Connect,
        institution-name, manual import) and `mobile/.maestro/onboarding.yaml`'s programme-step
        assertion;
      - rename/convergence — `mobile/src/features/calendar-sources/ui/rename-calendar-dialog.test.tsx`,
        `data/user-calendars/rename.test.tsx`, `features/calendar/data/sync/sync.test.tsx`,
        `mobile/.maestro/user-calendar-rename.yaml` + `rename-seed.yaml`;
      - device passes — `docs/react-native-migration/inbox/2026-08-30-import-journey-device-pass.md`
        and `inbox/2026-08-30-calendar-rename-device-pass.md`.
- [ ] 6.3 Open every link added in §4 and §5 and confirm it resolves (relative ADR paths from the
      file that contains them, and the three PR URLs).

## 7. Verify, then hand off

- [ ] 7.1 **Report, do not fix:** `mobile/.maestro/onboarding.yaml`'s header comment still says the
      Jest tests prove "school→group navigation". That is stale, but the file is source, outside this
      change's file ownership. Confirm it is still stale on the current `main` and report it on
      [TIM-393](/TIM/issues/TIM-393) for a follow-up ticket. **Do not edit the file.**
- [ ] 7.2 Prove no stale claim survives in the touched documents, scoped **by path, never by wording**:
      ```bash
      git grep -nE "navigat|group step|group-picker|group picker" -- \
        openspec/specs/mobile-school-selection openspec/specs/mobile-onboarding-flow
      git grep -nE "school-group|group picker|full picker" -- docs/react-native-migration/01-roadmap
      ```
      Every surviving hit must be either the dormancy requirement, an explicit "reached by nothing"
      statement, or a dated historical record. `git grep` sees only **tracked** files — `git add`
      your work before measuring, or you measure the wrong tree.
- [ ] 7.3 Confirm the diff touches nothing outside the three allowed trees:
      `git diff --name-only $(git merge-base origin/main HEAD) | grep -vE '^(openspec/|docs/react-native-migration/01-roadmap/|docs/mobile/architecture-book/)'`
      must print nothing.
- [ ] 7.4 Re-run `openspec validate reconcile-calendar-naming-import-docs --strict` and
      `openspec list` to confirm the change is listed and clean.
- [ ] 7.5 No source, test, fixture, generated, contract, migration, native/store-config or
      infrastructure file changed. No `app/` file changed.
- [ ] 7.6 Update the PR body (stage marker, the ADR-number census result from §2.1, and any scope
      change), then hand off per `pipeline-core`.
