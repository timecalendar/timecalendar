# Design — reconcile the calendar naming/import specs, roadmap and Architecture Book

This change edits documents only. "Design" here means the editorial calls that are costly to get
wrong: what gets removed versus reframed, how many ADRs, which numbers, and where a constraint is
stated.

## Ground truth this change is measured against

Everything below was verified against `origin/main` at `ed4fbf22`, not against the tech spec's
intent:

| Claim | Verified by |
| --- | --- |
| A school row opens `/onboarding/programme`, not the group step | `mobile/src/features/school-selection/ui/school-picker-screen.tsx`, its test, and `mobile/.maestro/onboarding.yaml`'s final assertion (`"Your programme"`) |
| The group step still exists and is still registered | `mobile/src/app/onboarding/groups.tsx`, `mobile/src/features/school-selection/ui/school-group-picker-screen.tsx` + its test |
| Nothing navigates to it | no `push`/`navigate` to `groups` outside the dev deep link |
| Rename is token-authorized and shared | `server/src/modules/calendar/controllers/calendar-v1.controller.ts` — the token is the only credential |
| `/v1` is path-level on two controllers, versioning is not globally enabled | `server/src/main.ts` has no `enableVersioning`; `CalendarV1Controller` and the calendar-log v1 controller carry the prefix in their own paths |
| Sync converges names through `updateName` only | `mobile/src/features/calendar/data/sync/sync.ts` |

---

## Decision D1 — remove the dormant group requirements, do not reword them

**Decision.** The four `mobile-school-selection` requirements that describe the multi-select group
picker as live behaviour go into `## REMOVED Requirements`, and one new requirement — *"The
school-group step is retained dormant and is reached by nothing"* — takes their place.

The four:

- `The group-picker step is a multi-select tree committed by an explicit confirm action`
- `Completing the picker dismisses the whole onboarding stack`
- `New picker UI strings are fully localized (FR + EN)`
- `Every new interactive picker control is accessible`

**Why not reword them in place.** An OpenSpec `MODIFIED` block is matched on its `### Requirement:`
header, so a reworded body keeps a header that still reads as shipped product behaviour
("Completing the picker dismisses the whole onboarding stack" — nothing completes it). Renaming the
header inside a `MODIFIED` block is worse: the archive would fail to match the original, or match
nothing and silently add a near-duplicate. Removing the header is the only edit that removes the
claim.

**Why not simply delete them with nothing in their place.** The screen, its translations, its
accessibility contracts and its Jest coverage all still exist and still have to keep passing. A spec
that says nothing about live code invites the next contributor to "clean up" a passing test suite as
unspecified. The replacement requirement carries those obligations forward explicitly and names the
deletion as a separate, deliberate cleanup — matching `navigation.md`, which already says exactly
that.

**Rejected:** deleting the group step in this change. The canonical spec scopes it as separate
cleanup; the epic's non-negotiable scope forbids touching school groups; and this ticket owns no
source files.

## Decision D2 — three new ADRs, and cite ADR 047 rather than restate it

**Decision.** Add ADRs for the three decisions that have no record, and reference the existing
ADR 047 for the fourth.

| Epic decision | Record |
| --- | --- |
| One ephemeral, non-persisted import draft | **ADR 047**, merged in [#323](https://github.com/timecalendar/timecalendar/pull/323) — cited, not duplicated |
| Token-authorized shared rename; possession is the capability; last write wins | **new ADR** |
| Path-level `/v1` on the rename endpoint only, no global NestJS versioning | **new ADR** |
| Eventual name convergence through sync, name-only write, never a full-row upsert | **new ADR** |

**Why three and not one.** They have three different revisit triggers, and an ADR without a usable
revisit clause is a decree. The rename capability model reopens when accounts or ownership arrive;
the versioning decision reopens when a third `/v1` route makes per-controller prefixes worse than a
global migration; the convergence decision reopens when a second field has to converge, or when the
`visible` flag stops being client-only. Folding them into one record means the first trigger to fire
drags two unrelated decisions into scope.

**Why the topical prose is not enough.** `features.md` and `data.md` already state all three as
rules, correctly. A rule tells you what to do; the ADR tells you what was traded away and when to
reconsider — for instance, that "anyone holding the token can rename for everyone" was accepted
knowingly, with per-device aliases and ownership as the rejected alternatives. That is the part a
future contributor needs and cannot reconstruct from the rule. R-1 keeps the rule in the topical
file; the ADRs add the reasoning and the trigger, and the topical files link out to them.

## Decision D3 — ADR numbers 050, 051, 052 after the final open-PR census

**Decision.** Claim `050`, `051`, `052`, and re-verify immediately before the PR merges.

Census against `main` at `ed4fbf22`: highest merged is `048`; `045` is a standing reservation held by
open PR [#273](https://github.com/timecalendar/timecalendar/pull/273), whose ADR is still filed under
its pre-renumber name `044-preserve-content-and-advise-source-recovery.md`. Every other open PR was
checked with `gh pr diff <N> --name-only | grep decisions/`; none touches `decisions/`.

The final census on 2026-08-30 found that open PR
[#328](https://github.com/timecalendar/timecalendar/pull/328) had since claimed `049` for
`049-activity-trigger-edges-and-failure-isolation.md`. This change therefore moved to the next three
free numbers, `050`–`052`, before handoff.

**Why this needs a task and not a footnote.** Two ADRs with the same number are two differently-named
files, so they merge with no conflict and no CI failure — the collision only surfaces when a human
reads the index. `decisions/README.md` already records this failure mode twice (047 was authored as
045 and renumbered; 048 skipped both). This is a long-lived documentation PR, which is precisely the
shape that collides.

## Decision D4 — state the sync prohibition at the mapper, as well as at the sync path

**Decision.** Add the constraint to `mobile-calendar-identity-persistence`'s
`fromCalendarForPublic` requirement, keeping the existing statement in `mobile-calendar-sync`
unchanged.

`fromCalendarForPublic` defaults `visible` to `true` because the server has no concept of local
visibility — correct for create and for add-by-token, catastrophic on the sync path, where it would
unhide a hidden calendar at every app start. The prohibition currently exists only in
`mobile-calendar-sync`, i.e. in the caller. Someone reading the mapper's own specification sees a
general-purpose DTO converter with no warning on it.

Duplication is the point: the mapper's requirement states the constraint as a property of the
function, the sync requirement states it as a property of the path. Neither is redundant, because a
future second caller reads the first and never opens the second.

## Decision D5 — correct the roadmap in place, with evidence; do not rewrite its history

**Decision.** Phase 03's step list keeps its existing "landed" entries and gains a dated correction
plus evidence, rather than being rewritten to look as though the group picker never shipped.

It did ship, and it passed its DoD at the time — the roadmap is a record of what was built, and
erasing that loses the reason the dormant code exists. What is false today is the *implication* that
it is on a user's path, and that "school pick" is a completed add-a-calendar route. Each corrected
step gets its merged PR number, merge commit and named test evidence, so a reader can check the
claim rather than trust it.

**Rejected:** a separate "corrections" section at the bottom of Phase 03. A reader who stops at step
2 never reaches it, which is the same failure this change exists to fix.

## Decision D6 — audit the already-reconciled specs, and record the audit

**Decision.** `mobile-qr-scan`, `mobile-ical-import`, `mobile-feedback`, `mobile-user-calendars`,
`mobile-calendar-sync`, `mobile-import-journey`, `server-calendar-naming` and
`server-contact-submission` were each re-read against `main` and found accurate. They get no delta,
and the proposal says so explicitly.

The ticket lists them as in-scope surfaces, so a silent no-op is indistinguishable from having
skipped them. Naming the audit result makes "no change needed" a reviewable claim.

## Verification

There is no runtime behaviour to test. The change is verified by:

1. `openspec validate <change> --strict` — structure and the first-line `SHALL` rule.
2. A **rehearsal archive** run early (`openspec archive <change> -y`, inspect, then
   `git restore openspec/`) — the only thing that validates `MODIFIED`/`REMOVED` delta headers
   against the live specs. Running it last is how a header typo becomes a merge-time surprise.
3. A repository-wide grep proving no stale claim survives in the touched documents (`tasks.md` §6
   fixes the exact commands and the paths they are scoped to).
4. Reading every link added: each ADR link, roadmap PR link and merge commit must resolve.
