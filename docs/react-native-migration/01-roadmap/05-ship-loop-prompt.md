# Phase 05 — autonomous ship-loop prompt

The copy-this prompt that drives [Phase 05](./05-personal-data.md) to completion autonomously.
Launch with `/loop <paste the fenced block below>` (no interval — dynamic self-pacing, since each
feature is a long `/ship` pipeline). The block is self-orienting and idempotent: each wake it
re-derives state from `origin/main` + the OpenSpec archive, ships the next feature, merges, and
re-fires until the phase's exit criteria are met.

**Like [Phase 03](./03-ship-loop-prompt.md), NOT [Phase 04](./04-ship-loop-prompt.md):** this is a
clean serial worklist with **no spike** — Phase 04 already de-risked the calendar foundation. The
distinguishing feature of Phase 05 is that it writes the **irreplaceable, no-server-backup data**
(`personal_events`, `hidden_events`, `checklist_items` are the Phase-09 importer set) — so the
write paths must be correct and tested, and every new schema must be importer-ready.

**Decisions baked in** (confirmed 2026-06-16, grounded in the Flutter `hidden_event` /
`event_details` modules):
- **Roadmap step 1 (personal events on the calendar) is ALREADY DONE** — it landed in Phase 04. The
  `useCalendarEvents` seam (`mobile/src/features/calendar/data/events.ts`) already merges
  `usePersonalEvents()` into day/week/agenda + home, with origin-keyed tap routing. Step 1 is a
  **verify-only checkpoint**, not a ship.
- **Two real ships:** Hidden events, then Event checklists (serial; planner may reorder/split).
- **Roadmap step 4 (confirm Phase-09 migration targets)** folds into each ship's DoD — not a ship.
- **Hidden events:** full Flutter parity — hide by **uid AND by name** (`namedHiddenEvents` = hide
  all events sharing a title). Storage backend (MMKV single-blob vs Drizzle) is the **planner's
  ADR call** (mirroring ADR 018's MMKV-vs-Drizzle decision); it is a Phase-09 migration target
  either way (round-trip `{uidHiddenEvents, namedHiddenEvents}` verbatim).
- **Checklists:** a 4th Drizzle table `checklist_items` (importer-fidelity, soft-delete via
  `deletedAt`). Scope = **both personal and synced events** (Flutter parity — both implement
  `EventInterface` and open the same details screen with a checklist). The planner must resolve
  **how a personal event surfaces its checklist**, since Phase 04 routes personal events to their
  edit form and synced events to the read-only details screen (a design/ADR call).
- Human-only / device-only work is inboxed, never blocks the loop.

---

```
Autonomously complete Phase 5 of the RN migration (docs/react-native-migration/01-roadmap/05-personal-data.md): the user-owned, device-local data layer on top of the calendar — hidden events and per-event checklists (personal-events-on-the-timeline already landed in Phase 04). You are FULLY AUTONOMOUS — no human approval for any command (run simulators/emulators, tests, merge PRs, push, all of it). You CONDUCT; you do not write production code yourself — every unit of shippable work is delegated to sub-agents per the /ship pipeline. Adhere to the Architecture Book (.claude/rules/mobile/architecture.md + topical files) and pass the full Definition of Done for every feature.

## THE thing that makes this phase different: IRREPLACEABLE DATA
personal_events, hidden_events, and checklist_items are the Phase-09 importer's irreplaceable set — there is NO server backup. Loss here is permanent. So: every new schema must mirror the Flutter wire format VERBATIM for importer fidelity (the ADR-011/018/021 posture — read the actual Flutter toMap()/fromMap() before designing), and every write path must be correct and TESTED (Jest write/read-back + a restart-simulation, like Phase 03's user_calendars ship and Phase 04's calendar_events ship did). The planner/implementer hold this hard; the reviewer gates on it.

## The worklist (ship SERIALLY — one PR merged to main before the next starts)

### Step 1 — VERIFY-ONLY checkpoint (NOT a ship). Personal events on the calendar.
This already landed in Phase 04: useCalendarEvents (mobile/src/features/calendar/data/events.ts) merges usePersonalEvents() into the day/week/agenda timeline AND the home today view, with origin-keyed tap routing (personal → edit form, synced → read-only details). On the first orient, CONFIRM this is true (read the seam + run the calendar/home Maestro flows locally if useful). If confirmed, tick roadmap step 1 and move on — do NOT open a ship for it. If you find a genuine gap (e.g. personal vs synced events are visually indistinguishable on the grid and that's deemed a defect), inbox it as a small follow-up rather than blocking the phase — it is not part of the two real ships.

### Ship A — Hidden events (hide / un-hide synced events; persist; filter out of the timeline)
One full /ship (plan → apply → simplify → review-loop → archive → PR → wait-green → zero-touch merge). Mine the Flutter hidden_event module for parity (models/hidden_event.dart, repositories/hidden_event_repository.dart, widgets/event_details_hidden_dialog.dart, screens/).
- Flutter stores a SINGLE sembast record (store "hidden_events") = { uidHiddenEvents: String[], namedHiddenEvents: String[] }. Full parity: hide by UID (this instance) AND by NAME (all events sharing a title, e.g. a recurring class). Default-empty when absent.
- STORAGE BACKEND is the planner's ADR call: MMKV single-blob (matches the flat 2-list shape, importer writes it verbatim) vs Drizzle (relational, consistent with the other importer tables). Either way it is a Phase-09 MIGRATION TARGET — the schema must receive the recovered { uidHiddenEvents, namedHiddenEvents } verbatim with no loss. Write the ADR mirroring ADR 018's MMKV-vs-Drizzle rigor.
- FILTERING happens at the single events-source seam useCalendarEvents (the same file personal events merge through) — filter out events whose uid is in the uid set OR whose title is in the named set, so it covers day/week/agenda AND home with no consumer change. The seam absorbs it, exactly as designed.
- The HIDE action is reached from the event-details screen (Phase 04's read-only synced-event view) — grow it with a hide/un-hide control (the Flutter event_details_hidden_dialog parity: choose hide-this vs hide-all-by-name). An un-hide surface (a hidden-events list/management screen — Flutter hidden_event/screens) is parity too; planner decides whether it's in this ship or a tiny follow-up, but un-hiding MUST be reachable (never a one-way trap).
- Observability: a failed hidden-set write is a crash-worthy local-persistence failure → @/firebase recordError (the personal-events/calendar-sync write posture), plus an accessible failure surface. A filter read is total/infallible.

### Ship B — Event checklists (per-event checklist items, interactive, in event details)
One full /ship (may split if large — planner's call; each sub-ship still passes full DoD). Mine the Flutter event_details checklist parity (models/checklist_item.dart, repositories/checklist_item_repository.dart, widgets/event_details_checklist*.dart, controllers/hooks for add/toggle/reorder/focus).
- A 4th real Drizzle table checklist_items, mirroring the Flutter toMap() VERBATIM for importer fidelity: uuid TEXT primaryKey (the sembast record key / identity), eventUid TEXT (SOFT ref to the event — NO FK, like calendar_events.userCalendarId), content TEXT, isChecked boolean (integer mode), order INTEGER, createdAt/updatedAt/deletedAt TEXT UTC ISO-8601 (the ADR-011/D4 TEXT-over-epoch posture). NOTE the SOFT-DELETE: deletedAt is set rather than the row removed (Flutter parity) — the importer must round-trip it; decide how reads filter deletedAt != null. A 4th committed migration (drizzle-kit generate, driver expo); the runner applies all four; migrate.test.ts stays green.
- The UI turns the Phase-04 read-only event-details screen INTERACTIVE (add item, toggle checked, reorder, delete, the auto-focus-new-item behavior — Flutter parity). This is the "edit half" of event details that Phase 04 deliberately deferred (calendar.md / inbox 2026-06-16-event-details-deferrals.md).
- SCOPE = both personal AND synced events (Flutter parity — both implement EventInterface and open the same details screen with a checklist). The planner MUST resolve how a personal event surfaces its checklist: Phase 04 routes personal events to their edit form (/personal-event-form) and synced events to the read-only details screen (/event-details/[uid]). Read both routes, then decide (and ADR-record if load-bearing) — e.g. add a checklist section to the personal-event form, or give personal events a details surface too. Don't silently scope checklists to synced-only without recording the divergence.
- Observability: a failed checklist write (insert/update/delete/reorder) → @/firebase recordError + an accessible failure surface (irreplaceable data — a lost checklist item never comes back).

### Step 4 — confirm Phase-09 migration targets (folds into each ship's DoD, NOT a ship)
personal_events is already importer-ready (ADR 011). Ship A confirms hidden_events is importer-ready; Ship B confirms checklist_items is importer-ready. Each ship's DoD + ADR records the verbatim-wire-format property and the restart/read-back tests. By the end, all three irreplaceable schemas are confirmed migration-ready.

## HUMAN-ONLY / DEVICE-ONLY items — inbox immediately, never block the loop
- **On-device persistence durability** for the irreplaceable data — restart / process-kill / cache-clear read-back of the hidden set and the checklists on a REAL device (CI proves write/read-back + a restart-simulation against a stateful @/db or @/storage fake; on-disk survival across a real kill is human, exactly like Phase 03's user_calendars restart-durability note). Write a docs/react-native-migration/inbox/ HUMAN note per ship; it is NOT a ship.
- **Visual + a11y review** of the new surfaces (the hide dialog / hidden-events list, the interactive checklist) on both platforms — the DoD native-correctness + manual screen-reader axes need human eyes. Inbox once.
- Any design-asset gap: ship a tasteful native-default version (R-3) and inbox a polish follow-up; do NOT stall.

## Per-iteration algorithm (this prompt re-fires each wake — be idempotent)
1. ORIENT: `git fetch origin`, check `git log origin/main` + `openspec/changes/archive/` to see which ships already merged + whether step 1 is confirmed. Read the roadmap doc for checkboxes.
2. FIRST wake only: confirm step 1 (personal events on the timeline) per the verify-only checkpoint above; tick the roadmap; do not ship it.
3. If BOTH real ships (Hidden events, Checklists) are merged AND the inbox notes exist → verify the EXIT CRITERIA (personal events render alongside synced events; hide/un-hide works and persists; checklists persist per event; all pass full DoD on both platforms; all three irreplaceable schemas confirmed migration-ready). Tick the roadmap, then STOP the loop (do not schedule another wakeup) and report.
4. Otherwise pick the FIRST unmerged ship (Hidden events → Checklists) and run the full `/ship` pipeline (see .claude/commands/ship.md). Delegate every phase to the sub-agents (change-planner / change-implementer / change-simplifier / change-reviewer). You own only git/PR/merge.
5. Ship invariants: reviewer is the sole merge gate (cap 3 review rounds, then inbox-escalate + leave PR draft + skip to next only if truly stuck); wait for GREEN with `gh pr checks <pr> --watch` before `gh pr merge --squash --delete-branch` (NEVER `--auto` — main is unprotected); do NOT add the run-e2e label (E2E runs on main only) — for the data-write-heavy ships run Maestro LOCALLY via mobile/e2e/run_e2e.sh for extra confidence (a checklist/hidden state that survives a relaunch from local storage is the real proof).
6. After a successful merge, schedule the next wakeup (dynamic /loop). After a genuine hard block you can't resolve, inbox it and continue to the next shippable item rather than halting.

## Stop-the-bleeding escape hatch (refactor over more features)
If at ANY point you stumble on a HARD ARCHITECTURAL problem — a seam fighting you (e.g. the events-source seam can't cleanly express name-hiding, or the event-details routing can't carry checklists for both event kinds without a mess), mounting duplication, or a decision that would bake in horrible tech debt — STOP shipping. Do not paper over it.
1. Name the problem precisely (what's bleeding, why the next feature makes it worse).
2. Per R-4 triage: a load-bearing blocker earns a deep-dive + an ADR + an Architecture Book update. Spin up a dedicated REFACTOR /ship BEFORE resuming the worklist.
3. Update the Book/changelog so the new pattern is the rule going forward, then resume.
A clean refactor that prevents debt is SUCCESS, not a detour (migration-approach §4/§7).

## Guardrails
- SERIAL only — never run two ships concurrently; both grow shared files (architecture.md, the event-details screen, useCalendarEvents, db schema/migrations, lockfile) and would collide.
- Irreplaceable data: hold the verbatim-wire-format + tested-write-path bar especially hard. Every new schema mirrors the Flutter toMap()/fromMap() verbatim and is proven importer-ready as part of DoD.
- Every real ship updates the Architecture Book + appends to architecture-changelog.md + adds an ADR if load-bearing (the implementer/reviewer enforce this — it's part of DoD).
- Report faithfully at each merge: change name, PR link, merge SHA, inbox handoffs, what's next. If CI is red, a write path is untested, or a step was skipped, say so plainly.
- Delegate, don't code. Sub-agents do the shippable work.
```
