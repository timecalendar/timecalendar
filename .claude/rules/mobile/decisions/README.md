# ADR log — TimeCalendar mobile

One short record per architectural decision: context, choice, alternatives,
"revisit if…". One of the [five living artifacts](../architecture.md#the-five-living-artifacts);
sibling of the Architecture Book, source of truth for *decisions* the way the book
is source of truth for *rules*.

## The process (mirrors migration-approach §7)

A load-bearing decision (R-4 triage: affects patterns reused across features) earns
an ADR. To add one:

1. Copy [`TEMPLATE.md`](./TEMPLATE.md) to `NNN-kebab-title.md` (next free number below).
2. Fill Context / Decision / Consequences / Revisit-if; set Status.
3. Add the row to the index.
4. If the decision changes a rule, update the Architecture Book **and** append to the
   [Rule changelog](../architecture-changelog.md) — the act of changing rules is itself recorded.

We expect to revise. A fired revisit is recorded **in place** (dated, in the ADR's
Status) — superseding an ADR means writing the new one and marking the old
`Superseded by NNN`, never deleting it.

## Index

| # | Title | Status | Revisit trigger |
| --- | --- | --- | --- |
| [001](./001-sdk-target.md) | SDK target: latest stable Expo SDK at scaffold | Accepted · revisit fired 2026-06-12 (scaffolded directly on SDK 56) | A future SDK forces a deferred breaking change, or a beta capability becomes load-bearing pre-GA |
| [002](./002-minimum-os.md) | Minimum OS: iOS 15.1 / Android API 24 | Accepted · revisit fired 2026-06-12 (effective floors iOS 16.4 / API 24) | Install base below the floors, or an SDK raises its own minimum again |
| [003](./003-coverage-threshold.md) | Coverage: 90% logic / 70% global, CI-enforced | Accepted · **enforced 2026-06-14** (wired by Settings prefs, TIM-130) | The gate drives cargo-cult tests rather than catching regressions |
| [004](./004-phase-1-feature-order.md) | Phase 1 feature order: Settings → Personal events → School selection | Accepted · not started | A dependency forces a different order, or a feature is too thin for its axis |
| [005](./005-calendar-spike.md) | Calendar spike: 3-day read-only spike opens Phase 2 | Accepted · not started | The spike clearly succeeds or fails early |
| [006](./006-eas-distribution.md) | EAS distribution: fingerprint runtime policy, human-invoked builds (CI untouched) | Accepted | Manual dogfood builds become a friction point (wire `.eas/workflows/`), or fingerprint forces rebuilds so often OTA stops paying off |
| [007](./007-drop-web-target.md) | Drop the web target: iOS + Android only | Accepted | A real web roadmap appears (a genuine browser deliverable, not the template default) |
| [008](./008-brand-color.md) | Brand color: adopt the Flutter pink hue as the `primary` token | Accepted | A designer-driven palette change, or a real surface fails the brand-color contrast |
| [009](./009-settings-feature-prefs.md) | First feature folder; Settings owns app preferences, consumed by infra seams | Accepted | `eslint-plugin-boundaries` lands (TIM-135) — resolve the infra→feature edge; or a 2nd feature needs cross-cutting prefs |

ADRs 001–005 are the Phase 0 kickoff knobs K-1…K-5 from migration-approach §8,
authored as real ADRs here (the Phase 0 exit criterion: "first ADRs written —
K-1…K-5 become real ADRs"). §8 is their origin record; this log is their canonical
home going forward.

## Pending lifts

Some change-local ADRs already live **inside their archived change** and are lifted
into this log (as the next free numbers, 006+) when they are next revised — moving
an archived change's file now would rewrite history in the archive, and these are
already authoritative where the book cites them.

| Where it lives now | What it decides | Lift when |
| --- | --- | --- |
| `openspec/changes/archive/2026-06-12-add-mobile-api-client/adr-001-committed-spec-seam.md` | The committed-spec seam (`openapi/openapi.json` as the single server↔mobile contract). Authoritative in the Architecture Book "Data layer" section. | Next revised, or when the contract seam itself changes. |
