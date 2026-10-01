---
kind: decision
id: D08
status: approved
traces-to: [P06, P02, P01]
supersedes: []
---

# D08 — Spike first, merge freely to main, device evidence gates releases, straight cutover without native code

## Context and evidence

**T03's device proof never happened.** Human-only tasks don't block the reviewer, and `/ship`
merges with no human step (R07 §3).

**No runtime switch.** The app has no flag or remote-config system, and owned-renderer D07/P08
forbid a runtime switch (R07 §4).

**Build constraints:**
- The owner's Mac cannot build native releases.
- The Windows PC builds Android release APKs.
- iOS can receive new JS by OTA when the native fingerprint is unchanged. Otherwise it needs an
  EAS cloud build (R07 §3).

**Maestro.** No Maestro journey pages the timeline, and ADR 057 caps the pack at 3 journeys.

## Options considered

- **Feature flag versus straight cutover.**
- **Gate options:**
  - keep HUMAN tasks non-blocking (status quo);
  - a merge-blocking evidence check (rejected by the owner: merging unfinished work is fine);
  - device evidence as epic definition of done plus a release gate (chosen).
- **Native module.** Rule it out now (proposed), or keep it as an escalation.

## Proposed choice

**Order of work:**
1. Quick wins: compile the shell and gate the per-tile `onLayout`. Plus housekeeping: archive T06
   and T09, reconcile the owned-renderer ticket statuses, fix the stale rule pointers.
2. A device spike with the kill criteria in `product.md`. It may land on `main` as a dev-only route, because `main` may be unfinished.
3. The rebuild, as one OpenSpec change per ticket. The cutover change carries the
   MODIFIED/REMOVED spec deltas, the new Architecture Book ADR and the amendments to ADRs 033 and
   061.

**Device gate.** Merges to `main` are not gated. Unfinished or broken Calendar states on `main` are
acceptable during the rebuild (owner, 2026-10-01). Device evidence gates releases instead:
- Each epic's definition of done includes its device checks, recorded in an `evidence/` file that
  names the tested revision and the owner's verdict.
- No preview or production build (store binary or OTA) that carries the new paging owner is
  published until the evidence file covers that revision.

**Perf harness.** `mobile/perf/` holds adb gfxinfo and Perfetto scripts plus a perf build variant
(profileable, with Reanimated profiling), run on the PC against release APKs.

**Rollout.** A straight cutover with no flag and no native module.
- Rollback is a git revert plus an OTA republish, while the fingerprint matches.
- Enabling the Reanimated flags changes the fingerprint once, so it ships in a new binary
  alongside the cutover.

## Tradeoffs and consequences

- `main` can carry a broken Calendar for days. Releases must therefore be cut from a revision with
  evidence, which the release checklist enforces.
- `/ship` keeps merging without a human step. The device pass moves from the PR to the epic's
  definition of done and the release gate, which is where T03's skipped proof would have been
  caught.

## Approval

Owner (Samuel Prak) approved explicitly in the Claude Code planning session, 2026-10-01 (round-1 answers). Revised on approval: the merge gate became a release gate (answer 11).
