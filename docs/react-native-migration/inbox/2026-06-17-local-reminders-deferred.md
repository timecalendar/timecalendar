# Local reminders deferred — personal-event reminders are future debt

**Type:** decision record / future-debt tracker (not a HUMAN action — nothing to do now)
**Date:** 2026-06-17 · **Phase 06 Ship D** · see ADR [029](../../mobile/architecture-book/decisions/029-local-reminders-deferred.md)

## The decision

Phase 06 ships **server push only** (FCM, ADRs 026–028). **`expo-notifications` local reminders are NOT built** — see ADR 029 for the full rationale. Short version:

- Server push covers every **synced** calendar (the `calendar_changed` notifications). Stacking local reminders on top would be the roadmap's forbidden "double-stack."
- The only surface server push can't reach is **personal events** (device-local; the server never sees them).
- The in-production **Flutter app has no local notifications at all** — no `flutter_local_notifications`, no reminder field on its `personal_event` model. Local personal-event reminders have **never existed in the product**, so building them now is net-new scope, not migration parity (R-2: no speculative adoption).

## The future debt (if it's ever picked up)

Local reminders for **personal events** are the one legitimate gap. If a validated demand appears, build them as a dedicated feature with its own ADR, covering:

- Add `expo-notifications` (config plugin + permission). **Reconcile the permission with the existing FCM grant** (`POST_NOTIFICATIONS` / `UNUserNotification` already requested by Ship A) — do **not** prompt the user twice.
- Schedule a local notification on personal-event **create**, **reschedule on edit**, **cancel on delete** (the `personal_events` write paths in `mobile/src/features/personal-events/`). Add a reminder field (e.g. `notifyMinutesBefore`) to the `personal_events` schema + a migration.
- Correctness: timezone / all-day / DST handling for the scheduled fire time.
- A device-verification pass (a scheduled local notification fires at the right time on both platforms, in a release build).

Until then: **no action required.** This note exists so the gap is discoverable, not silent.
