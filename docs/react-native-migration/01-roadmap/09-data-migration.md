# Phase 09 — On-device data migration

> **Goal:** the one-shot, first-RN-launch importer that recovers existing users' irreplaceable on-device data when the RN binary lands on top of Flutter. **Non-negotiable** — there is no server backup for personal events / checklists / hidden events.
>
> **Depends on:** all data-owning schemas existing (Phases 03 + 05). **Modules:** new `migration` module. **Full research (device-verified):** [`../00-exploration/data-persistence-migration.md`](../00-exploration/data-persistence-migration.md).

## Rough steps

1. **Read legacy stores natively** on first launch:
   - **sembast** `simple_database.db` (JSONL) → replay the log (last-write-wins, drop tombstones) per the verified parser in the research doc §3.2.
   - **shared_preferences** (`flutter.`-prefixed) → native prefs read.
2. **Recover the irreplaceable set only:** `user_calendars.token`, `personal_events`, `checklist_items`, `hidden_events` → write into the new RN schemas (Phases 03/05).
3. **Re-sync everything else** from the server using the recovered token(s) — do **not** migrate `calendar_events` / `calendar_logs`.
4. **Optionally** copy `flutter.`-prefixed settings (theme, view type) for UX continuity.
5. **`migration_done` flag** so it runs exactly once; crash-mid-migration is retried, not skipped.
6. **Safety net:** keep the old sembast file on disk for one release so a botched migration is recoverable.

## Exit criteria

- Migration tested against a **real pre-update install** (capture device `simple_database.db` + prefs, run, diff) on **both** iOS and Android.
- The open Android items from the research (prefs backend + sembast path) are confirmed.
- Idempotent (flag-guarded), with the one-release safety net in place.
- Passes full DoD, held to the highest bar (this is the riskiest code in the project).

## Risks & decisions

- **Permanent data loss if wrong.** This is the single most dangerous feature — treat it as such: extensive fixtures, real-device dumps, retry-safe.
- Built **late** (needs target schemas) but its **target shape was considered early** (Phases 02/03/05 designed schemas to receive recovered records).
</content>
