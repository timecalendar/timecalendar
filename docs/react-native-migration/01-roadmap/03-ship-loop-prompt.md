# Phase 03 — autonomous ship-loop prompt

The copy-this prompt that drives [Phase 03](./03-onboarding-and-sources.md) to completion
autonomously. Launch with `/loop <paste the fenced block below>` (no interval — dynamic
self-pacing, since each feature is a long `/ship` pipeline). The block is self-orienting and
idempotent: each wake it re-derives state from `origin/main` + the OpenSpec archive, ships the
next feature, merges, and re-fires until the phase's exit criteria are met.

**Decisions baked in** (confirmed 2026-06-15): one `/ship` per roadmap step · serial execution
(one PR merged before the next) · human-only work is inboxed, never blocks the loop.

---

```
Autonomously complete Phase 3 of the RN migration (docs/react-native-migration/01-roadmap/03-onboarding-and-sources.md): everything that gets a calendar onto the device. You are FULLY AUTONOMOUS — no human approval for any command (run simulators, tests, merge PRs, push, all of it). You CONDUCT; you do not write code yourself — every unit of work is delegated to sub-agents per the /ship pipeline. Adhere to the Architecture Book (.claude/rules/mobile/architecture.md + topical files) and pass the full Definition of Done for every feature.

## The worklist (ship SERIALLY, in this order — one PR merged to main before the next starts)

Each item is one `/ship` run (plan → apply → simplify → review-loop → archive → PR → wait-green → zero-touch merge). Flutter modules to mine for parity: onboarding, add_school, school, school_group, qr_code, import_ical. Before each ship, have the planner READ the existing code — Phase 2's school-selection already created src/app/onboarding/ (nested Stack) and src/features/school-selection/, so several of these GROW existing seams rather than start fresh.

1. **Onboarding flow** — grow Phase 2's src/app/onboarding/ nested Stack into the real first-run experience (brand surface, Expo Router stack). DESIGN ASSETS ARE HUMAN-BLOCKED: build a tasteful native-default brand surface (R-3 — platform is the design reference) and inbox a "designer onboarding polish" follow-up; do NOT stall.
2. **Full school / school-group picker** — grow Phase 2's read path (src/features/school-selection/) into the complete picker (add_school / school / school_group parity).
3. **QR scan** — add a calendar by token via barcode scanning. Use `expo-camera` (replaces Flutter's mobile_scanner). New native dep → config plugin in app.config.ts + camera permission strings, autolink check via prebuild; this is an ADR-worthy decision (camera lib choice) — let the planner write it. e2e can't drive a real camera, so prove the token→state wiring at the Jest/component level and inbox the manual on-device camera check.
4. **iCal import** — add a calendar by URL/file (import_ical parity).
5. **Identity persistence — user_calendars tokens** — the load-bearing one. Store calendar-subscription tokens DURABLY (Drizzle/@/db is the likely seam — relational identity; planner decides MMKV vs Drizzle with an ADR). CRITICAL: this schema is a **Phase 09 migration target — design it to receive the recovered `user_calendars.token` verbatim** (mirror the Flutter wire format for importer fidelity, exactly like personal_events/ADR 011 did). Token correctness IS the user's identity — the change MUST test restart/kill/cache-clear persistence scenarios (Jest + a Maestro restart assertion where feasible).

## Two HUMAN-ONLY items — inbox immediately, never block the loop on them
- **Onboarding design artifacts** (handled inline in ship 1 above).
- **Android storage verification (roadmap step 6)** — verify the open Android items from data-persistence-migration.md §6 (prefs backend + sembast path) on a REAL Android device. Needs physical hardware → write a `docs/react-native-migration/inbox/` HUMAN note once and move on; it is NOT a ship.

## Per-iteration algorithm (this prompt re-fires each wake — be idempotent)
1. ORIENT: `git fetch origin`, check `git log origin/main` + `openspec/changes/archive/` to see which of the 5 ships already merged. Read the roadmap doc for any checkboxes you've been ticking.
2. If all 5 are merged AND both inbox notes exist → Phase 3 is DONE. Verify the exit criteria (fresh user can add a calendar via school pick + QR + iCal; tokens persist across restart; Android check is inboxed), tick the roadmap, then STOP the loop (do not schedule another wakeup) and report.
3. Otherwise pick the FIRST unmerged ship in the worklist and run the full `/ship` pipeline for it (see .claude/commands/ship.md). Delegate every phase to the sub-agents (change-planner / change-implementer / change-simplifier / change-reviewer). You own only git/PR/merge.
4. Ship invariants: reviewer is the sole merge gate (cap 3 review rounds, then inbox-escalate + leave PR draft + skip to next only if truly stuck); wait for GREEN with `gh pr checks <pr> --watch` before `gh pr merge --squash --delete-branch` (NEVER `--auto` — main is unprotected); do NOT add the run-e2e label (E2E runs on main only) — for the runtime-heavy ones (QR camera, identity persistence) run Maestro LOCALLY via mobile/e2e/run_e2e.sh for extra confidence.
5. After a successful merge, schedule the next wakeup (dynamic /loop) to start the next ship. After a genuine hard block you can't resolve, inbox it and continue to the next shippable item rather than halting the whole loop.

## Stop-the-bleeding escape hatch (refactor over more features)
If at ANY point you stumble on a HARD ARCHITECTURAL problem — a seam that's fighting you, a pattern the Architecture Book didn't anticipate, mounting duplication, a boundary that no longer holds, or a decision that would bake in horrible tech debt if you push the next feature on top of it — STOP shipping new features. Do not paper over it to keep the worklist moving. Instead:
1. Name the problem precisely (what's bleeding, why the next feature makes it worse).
2. Per R-4 triage: a load-bearing blocker earns a deep-dive + an ADR + an Architecture Book update. Spin up a dedicated REFACTOR `/ship` (its own change: planner frames the refactor, implementer executes, reviewer gates) BEFORE resuming the feature worklist.
3. Update the Book/changelog so the new pattern is the rule going forward, then resume the feature you paused.
A clean refactor that prevents debt is SUCCESS, not a detour (migration-approach §4/§7 — patterns are earned, revising the Book is the job). Better to stop and fix the foundation than to ship five features onto a cracked one.

## Guardrails
- SERIAL only — never run two ships concurrently; each touches shared files (architecture.md, app.config.ts, lockfile, db schema) and would collide.
- Every feature updates the Architecture Book + appends to architecture-changelog.md + adds an ADR if load-bearing (the implementer/reviewer enforce this — it's part of DoD).
- Report faithfully at each merge: change name, PR link, merge SHA, inbox handoffs, what's next. If CI is red or a step was skipped, say so.
- Delegate, don't code. Sub-agents do the work.
```
