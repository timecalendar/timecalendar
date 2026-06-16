# Phase 04 — autonomous ship-loop prompt

The copy-this prompt that drives [Phase 04](./04-calendar-core.md) to completion autonomously.
Launch with `/loop <paste the fenced block below>` (no interval — dynamic self-pacing, since the
spike is open-ended exploration and each feature is a long `/ship` pipeline). The block is
self-orienting and idempotent: each wake it re-derives state from `origin/main` + the OpenSpec
archive, advances the spike-or-ship that's next, merges, and re-fires until the phase's exit
criteria are met.

**Why this phase's loop is different from [Phase 03](./03-ship-loop-prompt.md):** Phase 04 is the
**#1 risk in the whole migration** — the custom dense-week timeline. It does **not** open with a
clean serial worklist. It opens with a **time-boxed exploratory spike** (K-5) whose **decision gate
— adopt / fork / build custom** — reshapes every ship after it. So iteration 1 is research, not a
ship: explore, try the library, write throwaway code, benchmark on real hardware, then decide and
record an ADR. The remaining worklist is only fully knowable *after* the gate.

**Decisions baked in** (confirmed 2026-06-16): spike first, exploratory, throwaway code allowed ·
the spike's decision gate is a real ADR · after the gate, ship the rest SERIALLY · human-only /
device-only work is inboxed, never blocks the loop · calendar is a **designed brand surface**, not
native-default chrome.

---

```
Autonomously complete Phase 4 of the RN migration (docs/react-native-migration/01-roadmap/04-calendar-core.md): the calendar core — the timeline, sync, offline cache, read-only event details, home. This is the LARGEST, HIGHEST-RISK phase in the whole migration. You are FULLY AUTONOMOUS — no human approval for any command (run simulators/emulators, tests, benchmarks, merge PRs, push, all of it). For the SPIKE you MAY write and drop throwaway code yourself (experiments, benchmarks, prototypes — that is the point of a spike). For every real SHIP you CONDUCT; you do not write production code yourself — every unit of shippable work is delegated to sub-agents per the /ship pipeline. Adhere to the Architecture Book (.claude/rules/mobile/architecture.md + topical files) and pass the full Definition of Done for every feature.

## THE central question this loop must answer: LIBRARY or CUSTOM calendar?
The whole phase hinges on it. The spike (item 0 below) exists to answer it with EVIDENCE, not a guess. The roadmap's prior says "likely custom" — but you must EARN that conclusion: try the library for real, measure it against a real dense university week, and only then commit. The gate output is a real ADR (adopt / fork / build custom) that becomes the load-bearing decision the rest of the phase is built on. Salvage reusable primitives (time-grid math, overlap layout, now-indicator) into our own components REGARDLESS of the outcome.

## The worklist

### Item 0 — THE CALENDAR SPIKE (do this FIRST, time-boxed ~3 working days of effort — K-5). NOT a /ship — exploratory.
This is research. You drive it directly (and may spin up Explore/general-purpose sub-agents for parallel investigation, e.g. one reads @howljs/calendar-kit v2's source/API while another drafts the custom FlashList-v2 time-grid math). Allowed and EXPECTED: write throwaway prototype code in a scratch location (e.g. mobile/spike/ or a throwaway branch — NOT in src/, NOT shipped, NOT under the coverage/lint gates), install candidate deps temporarily, run it on a simulator AND a real low-end Android, capture frame-rate / jank measurements.
- Build a READ-ONLY render of a real dense university week (many overlapping events) with our brand styling, targeting 120fps.
- Candidate to beat: `@howljs/calendar-kit` v2 (adopt). Alternatives: fork it, or build CUSTOM (FlashList v2 vertical time + horizontal day/week paging + gesture-handler swipe + Reanimated 4 worklets — see roadmap step 2).
- Evaluate honestly against: dense-overlap correctness, frame rate on low-end Android (the hard bar), brand-styling freedom (calendar is a designed surface, not native chrome), gesture/paging feel, maintenance/upgrade-lane cost, and Hermes/New-Arch/SDK-56 compatibility.
- DECISION GATE: adopt / fork / build custom. End early if the answer is obvious early (the 3 days is a CEILING, not a quota).
- OUTPUT of the spike: (a) a written ADR capturing the decision + evidence + rejected options + revisit-if (this is THE load-bearing ADR of the phase — author it carefully, mirror the rigor of ADRs 011/013/017/018); (b) the measured numbers in the ADR or an inbox note; (c) salvaged primitives identified for the rendering ship; (d) the throwaway spike code DELETED or clearly quarantined out of src/. The spike ITSELF ships nothing to main except possibly the ADR doc — decide whether to land the ADR as its own tiny PR or fold it into the rendering ship's change (planner's call).

### Items 1–5 — the real ships (each a full /ship: plan → apply → simplify → review-loop → archive → PR → wait-green → zero-touch merge). DERIVE the exact shape from the spike outcome.
Flutter modules to mine for parity: calendar, event_details (view), home, activity (sync logs — partial). Before each ship, have the planner READ the existing code — Phase 03 landed user_calendars (durable tokens) + calendar-sources; Phase 02 landed the query persister + offline cache. These ships GROW those seams.

1. **Timeline rendering** — day / week / agenda views, per the spike's decision. If CUSTOM: FlashList v2 (vertical time axis + horizontal day/week paging) + gesture-handler + Reanimated 4 worklets, with the salvaged time-grid/overlap/now-indicator primitives as their own reusable components. The dense-overlap layout at target frame rate is the crux — Reassure perf baselines are part of DoD here. This may be LARGE enough to split into >1 /ship (e.g. day-view first, then week, then agenda) — planner decides; if split, each sub-ship still passes full DoD.
2. **Sync** — TanStack Query → syncCalendars(tokens) → local cache (the drop+replace flow, RN-side; read the Flutter sync flow for parity). Offline reads from the persister/SQLite. Tokens come from Phase 03's user_calendars store.
3. **Event details (view)** — read-only event screen (event_details parity, view half only — no edit).
4. **Home** — the landing / today view.
5. **Date/time** — `date-fns` + `date-fns-tz`, DISPLAY ONLY (recurrence is server-side; NO rrule / Temporal on the client). New deps → autolink/bundle check; small, likely folded into rendering or its own tiny ship — planner decides. (May be pulled EARLY if item 1 needs date formatting first — order within 1–5 is the planner's to optimize, but Sync/Details/Home all depend on rendering existing.)

## HUMAN-ONLY / DEVICE-ONLY items — inbox immediately, never block the loop
- **Low-end Android frame-rate verification** — the 120fps-on-dense-week bar is the exit criterion, and a CI emulator is NOT a low-end device. Capture what you can in CI/Reassure, then write a `docs/react-native-migration/inbox/` HUMAN note for the on-real-hardware perf pass. It is NOT a ship.
- **Visual brand review of the calendar surface** on both platforms (it's a designed surface — DoD native-correctness axis needs human eyes). Inbox once.
- Any design-asset gap (if the calendar needs brand artifacts we don't have): inbox a "designer calendar polish" follow-up and ship a tasteful native-default-styled version (R-3); do NOT stall.

## Per-iteration algorithm (this prompt re-fires each wake — be idempotent)
1. ORIENT: `git fetch origin`, check `git log origin/main` + `openspec/changes/archive/` to see how far the phase has progressed. Read the roadmap doc + check whether the spike ADR exists yet (decisions/ in .claude/rules/mobile/) — its existence is how you know the gate has been passed.
2. IF the spike ADR does NOT yet exist → you are at item 0. Run the spike (exploratory, you drive it). Produce the ADR + measurements + salvaged-primitive list + inbox the on-device perf note. Land the ADR (its own tiny PR or quarantined for the rendering ship — your call). Then schedule the next wakeup.
3. IF the spike ADR exists → pick the FIRST unmerged item in 1–5 (re-derive their shape from the ADR if you haven't) and run the full `/ship` pipeline (see .claude/commands/ship.md). Delegate every phase to the sub-agents (change-planner / change-implementer / change-simplifier / change-reviewer). You own only git/PR/merge.
4. If ALL of 1–5 are merged AND the inbox notes exist → verify the EXIT CRITERIA (day/week/agenda render real timetables with overlaps at target frame rate on low-end Android [the perf bar is inboxed for human hardware verification]; works offline from local cache with no network; calendar surfaces pass full DoD; Reassure baselines captured). Tick the roadmap, then STOP the loop (do not schedule another wakeup) and report.
5. Ship invariants: reviewer is the sole merge gate (cap 3 review rounds, then inbox-escalate + leave PR draft + skip to next only if truly stuck); wait for GREEN with `gh pr checks <pr> --watch` before `gh pr merge --squash --delete-branch` (NEVER `--auto` — main is unprotected); for the runtime/perf-heavy ships (rendering, sync) run Maestro LOCALLY via mobile/e2e/run_e2e.sh for extra confidence (a calendar that renders real seeded data offline is the real proof).

## Stop-the-bleeding escape hatch (refactor over more features) — ESPECIALLY live this phase
This is the riskiest phase: a wrong rendering foundation poisons sync, details, and home built on top of it. If at ANY point you stumble on a HARD ARCHITECTURAL problem — the chosen rendering approach fighting you, perf that won't hit the bar, a seam the Architecture Book didn't anticipate, mounting duplication, or a decision that would bake in horrible tech debt if you push the next feature on top of it — STOP shipping. Do not paper over it.
1. Name the problem precisely (what's bleeding, why the next feature makes it worse).
2. Per R-4 triage: a load-bearing blocker earns a deep-dive + an ADR + an Architecture Book update. Spin up a dedicated REFACTOR `/ship` BEFORE resuming the feature worklist. If the spike's adopt/fork/custom call turns out WRONG once you build on it, RE-OPEN the spike ADR (supersede it, dated) and re-decide — that is the revisit clause doing its job, not a failure.
3. Update the Book/changelog so the new pattern is the rule going forward, then resume.
A clean refactor that prevents debt is SUCCESS, not a detour (migration-approach §4/§7). Better to stop and re-decide the calendar foundation than to ship sync + details + home onto a cracked timeline.

## Guardrails
- SERIAL only for ships 1–5 — never run two concurrently; they touch shared files (architecture.md, app.config.ts, lockfile, db schema, the calendar components) and would collide. (Parallel EXPLORE sub-agents during the spike are fine — they only read/prototype in scratch, not src/.)
- Spike code never enters src/ and never ships to main (except the ADR). Quarantine or delete it. The coverage/lint/boundary gates apply to shipped code only.
- Every real ship updates the Architecture Book + appends to architecture-changelog.md + adds an ADR if load-bearing (the implementer/reviewer enforce this — it's part of DoD). The calendar is a designed brand surface — hold the native-correctness + perf DoD axes especially hard.
- Report faithfully at each merge AND at the spike gate: spike decision + the numbers behind it, change name, PR link, merge SHA, inbox handoffs, what's next. If CI is red, a perf bar is unmet, or a step was skipped, say so plainly.
- Spike = you may code (throwaway). Ships = delegate, don't code. Sub-agents do the shippable work.
```
