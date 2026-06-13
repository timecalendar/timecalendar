# Design — the four remaining living artifacts

## Context

Migration-approach §2 defines five living artifacts; only the Architecture Book
(`.claude/rules/mobile/architecture.md`) exists. The book itself already forward-references
the four that don't: its header names "the five artifacts foundation step", "the Rule
changelog", and "the `decisions/` log"; the data-layer section says its ADR is "to be
lifted into the `decisions/` log when the five-artifacts step creates it"; the i18n/a11y/
firebase sections each park concrete obligations on a DoD that doesn't exist yet (manual
screen-reader passes, touch targets, contrast, reduced motion, the K-3 coverage threshold).
This is foundation step 12 — create the four, even mostly empty.

Constraints shaping the design:
- **One book, one directory.** All four artifacts are siblings under `.claude/rules/mobile/`
  — no second book elsewhere (the roadmap and the `mobile-architecture-book` spec forbid it).
- **R-1 pointer style.** The book links to each artifact and does not duplicate its content;
  the artifact is the source of truth for its own concern.
- **Names already promised.** Migration-approach §2 and the book's own prose fix the
  filenames: `decisions/`, `definition-of-done.md`, `architecture-changelog.md`. We honor
  them exactly so existing references resolve without rewording.
- **Docs-only, pipeline shakedown.** No source/deps/native change; the value is structure +
  honesty, so the artifacts must start *truthful* (real ADRs, a backfilled changelog), not
  as empty husks.

## Goals / Non-Goals

**Goals:**
- The four artifacts exist at their promised paths, each immediately useful to step 13.
- K-1…K-5 are recorded as real ADRs (Phase 0 exit criterion), reusing their fully-written
  §8 text including the K-2 revisit that already fired.
- The DoD captures every obligation the existing book sections already defer to it, so the
  splash has a complete checklist to pass.
- The changelog starts truthful — backfilled with the rule-establishing changes that landed.
- The Architecture Book's scattered forward-references all resolve to the now-real files.
- `tsc`/lint/Jest stay green (proving a docs change broke nothing).

**Non-Goals:**
- **No golden-path exemplar content** — the exemplar is earned in Phase 1.5 from features
  1–3 (§4); declaring it now from a sample size of zero violates philosophy principle 5.
  The file is an honest placeholder, not a template to copy.
- **No new lint rule, no CI proof test** — there is no runtime behavior to encode or prove
  (R-1: nothing here is encodable). Said explicitly so the implementer/reviewer don't look
  for one.
- **No DoD enforcement automation** — the DoD is a human checklist by nature (manual
  screen-reader passes, visual platform review); its encodable axes already point at their
  live gates (tsc/lint/Jest/coverage). Building a "DoD runner" would be cargo-cult tooling.
- **No rewrite of migration-approach** — it already names the artifacts and is the upstream
  source; we point at it, not fork it.

## Decisions

### D1 — K-1…K-5 are authored as **real ADRs now**, not stubbed
The Phase 0 exit criteria state plainly: "first ADRs written (**K-1…K-5 become real ADRs
here**)". Migration-approach §8 already calls each knob "a proto-ADR" that "becomes a real
ADR when `mobile` is scaffolded", and supplies the complete decision · why · revisit-if text
for all five — including the **K-2 revisit that already fired** at scaffold time (SDK 56's
iOS 16.4 floor) and the **K-1 revisit that fired** (SDK 56 stable before Phase 0, interim
upgrade skipped). The content exists and is load-bearing; stubbing it would (a) miss the exit
criterion, (b) leave the data-layer section's "lifted into the decisions log" promise half-
kept, and (c) provide no value over copying text that is already written. So this change
writes `decisions/001`–`005` from the §8 text, each in the standard ADR shape (Context /
Decision / Consequences / Status incl. fired revisits / Revisit-if). *Alternative:* one-line
stubs to fill later — rejected; the text is ready and the exit criterion is explicit.

This is the **ADR-worthy call** of this change and is recorded here so it can be lifted into
the ADR log it creates: the meta-decision to seed the log with the proto-ADRs rather than
defer them.

### D2 — ADR numbering and the per-change ADRs already on disk
ADRs are numbered `NNN-kebab-title.md` per migration-approach §2 (`decisions/NNN-*.md`).
K-1…K-5 take **001–005** (chronologically first — they were the Phase 0 kickoff decisions).
The change-local ADRs that already live inside archived changes — notably
`add-mobile-api-client`'s `adr-001-committed-spec-seam.md`, which the book says is "to be
lifted into the `decisions/` log" — are **indexed in the README as pending lifts** rather
than physically moved in this change: moving an archived change's file would rewrite history
in the archive, and the committed-spec seam is already authoritative in the book's data
section. The README records them as known future ADR numbers (006+) with a one-line pointer,
so the log is honest about what exists where without disturbing the archive. *Alternative:*
copy them in now — rejected; duplicates the source of truth and edits archived changes.
*Alternative:* renumber so lifts come first — rejected; the kickoff knobs are genuinely first.

### D3 — ADR log shape: `README.md` index + `TEMPLATE.md` + numbered files
`decisions/README.md` is the index (table: number · title · status · revisit trigger) and
states the ADR process (mirrors §7). `decisions/TEMPLATE.md` is the copy-me skeleton so every
future ADR has one shape (Context / Decision / Status / Consequences / Revisit-if). Numbered
files are the ADRs. This matches how the archived-change ADRs are already shaped and gives
step 13 a frictionless "copy the template" path. *Alternative:* a single flat `decisions.md` —
rejected; §2 says `decisions/NNN-*.md`, one file per decision, which keeps each ADR diffable
and linkable.

### D4 — The DoD is the migration-approach §5 checklist, *enriched* with parked obligations
The DoD file is the §5 checklist verbatim as its spine, but each axis is annotated with the
concrete, currently-homeless obligations the existing book sections explicitly defer to it:
- **a11y** ← the a11y section's deferred list: manual VoiceOver/TalkBack passes, touch-target
  minimums (44pt iOS / 48dp Android), Dynamic Type / font-scaling check, color contrast,
  reduced motion (the splash, step 13, inherits the reduced-motion obligation by name).
- **Unit/component + coverage** ← K-3: the first logic-bearing feature (Settings) sets the
  `coverageThreshold`; the DoD names that this axis is "reported, not yet gated" today.
- **Observability / analytics** ← the firebase section: errors reach Crashlytics, key actions
  logged, no PII; meaningful events defined/fired/**verified on-device** (DebugView).
- **Native correctness** ← R-3 + the Liquid Glass degradation baseline (iOS 16.4–25 fallback).
- **i18n** ← FR + EN complete, zero hardcoded strings (lint-enforced).
Each annotation **points at** its owning book section / live gate (R-1) rather than re-deriving
it. The DoD restates the **✅ Done / ➖ N/A + one-line reason / no third state** rule (§5) — the
mechanism that keeps "no concessions" finite. *Alternative:* a bare copy of §5 — rejected; it
would leave the parked obligations homeless, which is the whole reason step 13 needs the DoD.

### D5 — The Rule changelog is backfilled to start truthful
"The act of changing the rules is itself documented" (§7) only works if the log doesn't start
with a lie of omission. So `architecture-changelog.md` is seeded with one dated entry per
rule-establishing change that already landed (scaffold, api-client, test-harness, lint-format,
i18n, a11y, firebase — each already has a dated Architecture Book section to cite), plus this
change's own entry. Entries are terse (date · change · what rule moved · why · link to the
book section), newest-last (append-only). Dates come from the archived change directory names.
*Alternative:* start empty from today — rejected; the book already documents seven rule eras,
so an empty changelog would misrepresent history on day one.

### D6 — Golden-path placeholder is an honest signpost, not a template
`golden-path.md` states the exemplar is **earned in Phase 1.5**, not now (§4, principle 5);
names the axes a future exemplar must demonstrate (folder layout, data/query seam, navigation,
i18n/a11y wiring, test+e2e shape); and points at today's closest concrete references
(`schools-screen` as the live API round-trip surface, the test/e2e harness) so a reader has
something real to look at. It explicitly is **not** to be copied yet. *Alternative:* skip the
file until Phase 1.5 — rejected; §2 lists it as one of the five and step 12 says "even mostly
empty", so its existence (with the right expectation set) is the deliverable.

### D7 — Architecture Book gains one pointer section; forward-refs resolved in place
A new short "## The five living artifacts" section in `architecture.md` lists all five with
a one-line role + relative link (R-1 pointer style — the book points, the artifact owns). The
existing forward-references are updated minimally: the data-layer "to be lifted into the
`decisions/` log when the five-artifacts step creates it" becomes a link to `decisions/`;
the i18n/a11y "owned by the DoD (roadmap step 12)" notes become links to
`definition-of-done.md`; the header's "five artifacts foundation step" / "Rule changelog"
prose now resolves to real files. No rule text changes — this is wiring, not a rule revision
(but it *is* a book change, so it earns a changelog entry, D5).

## Risks / Trade-offs

- **Docs drift** — five artifacts can rot independently. Mitigated by R-1 pointer style (one
  owner per concern, the book only links) and by §7's discipline that every rule change touches
  the changelog. Accepted: living docs are the point.
- **ADR text duplicates §8** — K-1…K-5 ADRs restate migration-approach §8. Accepted and
  intended: §8 is the kickoff-decision *record*; the ADR log is the *canonical home* going
  forward (§8 itself says the knobs "become real ADRs"). The ADRs cite §8 as origin; future
  revisits update the ADR, and §8 becomes historical.
- **DoD has no runner** — it's a human checklist with no automation. This is correct, not a
  gap: its encodable axes already point at live gates; the manual axes (screen-reader, visual
  review) are irreducibly human. Recorded so no one mistakes the absence for debt.
- **Pending-lift ADRs (D2) are indexed but not present** — a reader could expect a `006` file.
  Mitigated by the README stating clearly they live in their archived change and are lifted
  when next revised.

## Open Questions

None blocking. The K-1…K-5-as-real-ADRs decision (D1) is the one load-bearing call and is
resolved here. Deferred by design: golden-path content (Phase 1.5), DoD coverage threshold
(first logic feature, K-3), physically lifting the change-local ADRs (when next revised).
