# Reconcile the calendar naming/import specs, roadmap and Architecture Book

## Why

The calendar naming and manual-import epic has shipped. Three implementation tickets merged into
`main` on 2026-08-30:

| Ticket | PR | Merge commit | What landed |
| --- | --- | --- | --- |
| [TIM-390](/TIM/issues/TIM-390) | [#313](https://github.com/timecalendar/timecalendar/pull/313) | `5f14a146` | Server create-name normalization, `PATCH /v1/calendars/{token}`, additive contact `calendarName`, regenerated RN client |
| [TIM-391](/TIM/issues/TIM-391) | [#323](https://github.com/timecalendar/timecalendar/pull/323) | `a10ab396` | Institution → programme → Connect → manual QR/iCal journey, ephemeral import draft |
| [TIM-392](/TIM/issues/TIM-392) | [#321](https://github.com/timecalendar/timecalendar/pull/321) | `3bba3364` | Rename menu + controlled dialog, name convergence through sync |

Each of those tickets reconciled the specs it touched. Three things they could not finish are left,
and each is a document that now asserts something false:

1. **`mobile-school-selection` contradicts itself.** [TIM-391](/TIM/issues/TIM-391) rewrote the
   navigation requirement to say a school row opens the programme step, but left the older block
   intact: the coverage requirement still demands a test asserting *"navigation to the group step
   with that school's id"*, the Maestro requirement still offers *"MAY additionally select the
   school and assert the nested group step opens"*, and four requirements still describe the
   multi-select group picker as live shipped behaviour. It is not: nothing navigates to it, and the
   epic forbids enabling school groups. `mobile-onboarding-flow` carries the same residue —
   *"school-to-group navigation remain unchanged and deep-linkable"*.

2. **The four load-bearing decisions have topical prose but only one ADR.** The book's own rule is
   that a load-bearing decision gets an ADR (`decisions/README.md`). The import draft got
   ADR [047](../../../docs/mobile/architecture-book/decisions/047-ephemeral-calendar-import-draft.md).
   The other three — the token-authorized shared rename, path-level `/v1` on one endpoint, and
   eventual name convergence through a name-only sync write — live only as paragraphs in
   `features.md` and `data.md`, which is where a rule goes, not where the *decision* and its
   revisit condition go.

3. **Roadmap Phase 03 still reports the dead path as a feature.** Step 2 claims the full
   school-group picker landed with confirm-commit and stack dismissal; step 3's QR entry point is
   described as it was before the manual-import screen existed; the exit criteria describe adding a
   calendar by "school pick" as a completed path. A reader planning Phase 08 (assistant) finds no
   record that the Connect → manual-import edge is its insertion point.

Nothing here is an implementation change. Every fact this change records is already true of `main`.

Canonical specification:
`docs/react-native-migration/05-tech-specs/calendar-naming-and-manual-import.md` (Ticket 4, spec
lines 457–474). It supersedes [TIM-274](/TIM/issues/TIM-274)'s older plan document wherever they
differ.

## What Changes

- **`mobile-school-selection` stops describing the group picker as shipped behaviour.** Four
  requirements that state live multi-select/confirm/dismissal/i18n/a11y behaviour are **removed**
  and replaced by one requirement recording what is actually true: the step is retained, dormant,
  registered, deep-linkable, reached by nothing, and its screen, translations, accessibility
  contracts and Jest coverage stay unchanged while it exists. The two requirements that assert a
  *false* navigation — the coverage scenario and the Maestro "MAY select the school" clause — are
  corrected to the programme step.
- **`mobile-onboarding-flow` drops the last "school-to-group navigation" claim** and records the
  import-journey handoff the Maestro flow now asserts (tap a seeded school → the programme step).
- **`mobile-calendar-identity-persistence` states the constraint at the mapper's definition site.**
  `fromCalendarForPublic` hard-codes `visible: true`; that is correct for create/add and wrong for
  sync. Today the prohibition only exists in `mobile-calendar-sync`, one seam away from the function
  that causes it.
- **Three ADRs are added** — the token-authorized shared rename, path-level `/v1`, and eventual name
  convergence — with the index rows, the topical cross-links, and the `CHANGELOG.md` entry the
  book's own rules require. ADR 047 is cited, not duplicated.
- **`mobile-architecture-book` gains one requirement** recording that the epic's four decisions are
  ADR-backed, in the same shape the book capability already uses for ADR 037 and the K-1…K-5 knobs.
- **Roadmap Phase 03 is corrected** and cited: steps 2, 3, 4, 5 and the exit criteria gain the
  merged PR numbers, merge commits, and named test evidence. Phase 08 gains one line naming the
  Connect → manual-import edge as the assistant's insertion point.

## Scope

**In:** `openspec/`, `docs/react-native-migration/01-roadmap/`,
`docs/mobile/architecture-book/`.

**Out:**

- Any source, test, fixture or generated file. This change ships no code. Where a document cannot be
  made true without a code change, it is raised on [TIM-393](/TIM/issues/TIM-393) instead of edited
  around — see *Known follow-up* below.
- Deleting the dormant group step. The canonical spec calls that a separate cleanup, and the epic
  forbids implementing or enabling school groups either way.
- Unrelated migration-roadmap cleanup. Phases 01–02 and 04–10 are untouched except the single
  Phase 08 insertion-point line.
- Any Flutter (`app/`) change.
- The specs the implementation tickets already reconciled. `mobile-qr-scan`, `mobile-ical-import`,
  `mobile-feedback`, `mobile-user-calendars`, `mobile-calendar-sync`, `mobile-import-journey`,
  `server-calendar-naming` and `server-contact-submission` were each re-read against `main` for this
  change and are accurate; they get no delta. That is an audit result, not an omission.

## Known follow-up (raise, do not fix here)

`mobile/.maestro/onboarding.yaml`'s header comment still says *"The school→group navigation WIRING
is proven deterministically by the Jest proof tests (school-picker-screen.test.tsx asserts the
push…)"*. That test now asserts the push to `/onboarding/programme`, and the flow's own final step
proves it. The comment is stale, but it lives in a **source file** — outside this change's declared
file ownership. It is reported on [TIM-393](/TIM/issues/TIM-393) for a follow-up ticket.

## Sensitive surfaces

- `docs/mobile/architecture-book/` — binding rules (R-1…R-6). A rule change requires an ADR **and** a
  `CHANGELOG.md` entry; ADR numbers must be re-checked against `main` and against open PRs at PR
  time, because two differently-numbered files merge cleanly and the collision is invisible to git.
- `openspec/` — canonical specs. Existing requirements need `MODIFIED`/`REMOVED` headers; only
  `openspec archive` validates them.

No code, contract (`openapi/openapi.json`), schema, native/store config, or infrastructure surface is
touched.

## Tasks

See `tasks.md`.
