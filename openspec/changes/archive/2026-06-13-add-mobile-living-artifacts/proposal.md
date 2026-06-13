# Create the four remaining living artifacts beside the Architecture Book

## Why

Migration-approach §2 names **five living artifacts** that drive the migration; only
one — the **Architecture Book** (`.claude/rules/mobile/architecture.md`, born with the
scaffold) — exists today. The book's own header already promises the other four ("the
five artifacts foundation step", "the Rule changelog", "the `decisions/` log") and
several sections defer obligations to a DoD that does not yet exist. Foundation roadmap
**step 12** closes that gap: create the remaining four artifacts (even mostly empty) so
the splash (step 13) and every later slice has a real DoD to pass, a real ADR log to
append to, a real changelog to record rule changes in, and a golden-path placeholder
that names where the exemplar will live. This is a **docs-only** change and the pipeline
shakedown — kept deliberately clean and exemplary.

## What Changes

- **ADR log** — new `.claude/rules/mobile/decisions/` directory (the name the book
  already uses), with a `README.md` index + ADR template, and the **five resolved knobs
  K-1…K-5 authored as real ADRs** (`001`–`005`), per the Phase 0 exit criterion "first
  ADRs written (K-1…K-5 become real ADRs here)". Their decision/why/revisit text already
  exists fully-written in migration-approach §8 (each knob is explicitly a "proto-ADR…
  becomes a real ADR when `mobile` is scaffolded"), including the **K-2 revisit that
  already fired**. The README also indexes the per-change ADRs the book says are "to be
  lifted into the `decisions/` log" (`adr-001-committed-spec-seam`) as future entries.
- **Definition of Done** — new `.claude/rules/mobile/definition-of-done.md`: the
  per-feature finite-perfection checklist from migration-approach §5, with each axis
  carrying the concrete obligations the existing book sections already park on the DoD
  (manual VoiceOver/TalkBack passes, touch-target minimums, color contrast, reduced
  motion, Dynamic Type, the K-3 coverage threshold the first logic feature owns,
  analytics-event verification). Defines the **✅ Done / ➖ N/A+reason / no third state**
  rule and that the DoD is itself a living artifact.
- **Rule changelog** — new `.claude/rules/mobile/architecture-changelog.md`: a dated,
  append-only log of every change to the rules (the act of changing the rules is itself
  recorded, per §7). Seeded retroactively with the rule-establishing changes that already
  landed (scaffold, api-client, test-harness, lint-format, i18n, a11y, firebase) so the
  log starts truthful, plus this change's own entry.
- **Golden-path placeholder** — new `.claude/rules/mobile/golden-path.md`: a placeholder
  that states the exemplar is **earned, not declared** (extracted in Phase 1.5 from
  features 1–3, per §4), names what it will eventually contain, and points at the current
  closest-thing references so it is not a dead stub.
- **Architecture Book** — `architecture.md` gains a short **"The five living artifacts"**
  section pointing at the four new files (R-1 pointer style: the book links to each
  sibling rather than duplicating it), and its scattered forward-references ("the five
  artifacts foundation step", "to be lifted into the `decisions/` log", DoD obligations)
  are updated to point at the now-real files.
- **Roadmap** — `docs/react-native-migration/01-roadmap/01-foundation.md` step 12 marked
  done.

## Capabilities

### New Capabilities
<!-- none. This change does not introduce a new behavioral capability; it completes the
governance structure the mobile-architecture-book capability already describes. -->

### Modified Capabilities
- `mobile-architecture-book`: adds requirements that the four remaining living artifacts
  (ADR log, DoD, Rule changelog, golden-path placeholder) exist as siblings of the book
  under `.claude/rules/mobile/`, that K-1…K-5 are recorded as real ADRs, and that the
  book links to each (it does not duplicate them). The existing "book lives at
  `.claude/rules/mobile/`" and "seeded with real rules" requirements are unchanged.

## Impact

- `.claude/rules/mobile/`: new `decisions/` (README + template + ADRs 001–005),
  `definition-of-done.md`, `architecture-changelog.md`, `golden-path.md`; `architecture.md`
  gains the artifacts pointer section and its forward-references are resolved.
- `docs/react-native-migration/01-roadmap/01-foundation.md`: step 12 marked done.
- **Docs-only.** No `mobile/` source, deps, native config, server, web, or `app/` code
  changes. No new lint rule, no CI proof test is applicable (there is no runtime
  behavior to prove) — local verification only re-confirms `tsc`/lint/Jest stay green.
