# Event checklists — on-device durability + manual screen-reader pass

**Date:** 2026-06-16
**Roadmap:** Phase 05 Ship B (Event checklists)
**Change:** `add-mobile-event-checklists`
**ADR:** [024](../../../.claude/rules/mobile/decisions/024-event-checklist-storage-and-surfacing.md)
**For:** Samuel (needs a real device / installed dev build — the autonomous loop and CI cannot do this)

This is the **on-device manual axis** for the event-checklists ship. `checklist_items` is
**IRREPLACEABLE** (no server backup, a Phase-09 importer target), so CI proves the write
paths hard — the pure mappers, the repository query shapes (the ordered read with NO
`deletedAt` filter, the insert, the column update, the **transactional re-number**, the
**HARD delete**), the actions hook (1-based order, `recordError`-on-throw, remove-then-renumber,
move-up/down), the reactive read, the component, and the **write/read-back + a
restart-simulation** through a stateful in-memory `@/db` fake
(`src/features/event-checklists/data/restart.test.ts`) **including survival across a simulated
`calendar_events` `replaceAll`**. CI **cannot** prove on-disk **SQLite** survival across a real
restart/kill/cache-clear, the reorder **atomicity** after a mid-write process kill, the
**auto-focus** keyboard-raise feel, the checklist surviving a **real** sync drop+replace, nor
judge screen-reader focus order / announcement quality — those are this pass.

## What to verify on a real device (dev variant, `npm run ios` / `npm run android`)

1. **On-disk survival.** Open an event's details (a synced event from a real calendar, or a
   personal event), add a few checklist items, toggle some, edit content. **Kill the app**
   (swipe away / force-stop), relaunch, reopen the same event — the items must be present, in
   the same order, with the same checked state and content. Repeat after an OS reboot.

2. **Reorder + delete re-numbering.** Add 4–5 items, move some up/down, delete a middle one.
   The order must stay contiguous 1-based and survive a restart. Kill the app **mid-reorder**
   if you can (hard, but try a rapid move then immediate force-stop) — on relaunch there must
   be **no duplicate or gap orders** (the transaction is atomic).

3. **The checklist survives a real sync.** For a **synced** event: add checklist items, then
   pull-to-refresh the calendar (or wait for a startup sync) so `calendar_events` is
   drop+replaced. Reopen the event — the checklist must still be there (the `eventUid` soft-ref,
   no FK cascade — the load-bearing survival property).

4. **Auto-focus.** Tap "Add note" — the new item's text field must receive focus and raise the
   keyboard immediately (Flutter parity). Verify on both iOS and Android.

5. **Both event kinds open the unified details screen.** Tap a **personal** event in the
   day/week timeline, the agenda, and the home today view — each must open the unified
   event-details screen (with the checklist + an **Edit** action that reaches the form), NOT the
   edit form directly. Tap a **synced** event — same details screen, with the checklist + the
   **hide/un-hide** action (no Edit). The `/personal-events` **list** row must still open the
   edit form directly.

6. **Observability — a forced write failure reaches Crashlytics.** A failed checklist write
   records through `@/firebase` `recordError(error, "event-checklists/<action>")`. Forcing a real
   SQLite write failure on-device is hard; if you can (e.g. a debug hook), confirm the breadcrumb
   + the recorded error land in the Crashlytics dashboard, and the accessible failure surface
   shows. Otherwise note this as un-exercised on-device (CI proves the wiring).

7. **Manual screen-reader pass (VoiceOver + TalkBack).** Each checklist item: the checkbox is
   announced as a checkbox with its checked state; the content field is editable with its label;
   the move-up/down + remove controls announce their translated labels and are skipped/disabled
   correctly at the ends; the "Add note" button announces its label; reorder/add changes are
   announced; the failure surface (if reachable) is a polite live region. Focus order is sane
   top-to-bottom.

8. **Touch targets + Dynamic Type.** Every control ≥44pt/48dp; the row stays usable at the
   largest OS font size (the inline TextInput + the icon controls must not clip).

## Status

NOT a loop blocker. CI is green (the write-path correctness floor). This note is the human DoD
axis CI cannot drive. File any defect found as a follow-up.
