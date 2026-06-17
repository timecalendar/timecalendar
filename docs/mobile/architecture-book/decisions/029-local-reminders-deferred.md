# 029 — Local reminders (`expo-notifications`) deferred

## Status

Accepted (2026-06-17). Phase 06 Ship D decision. Records a deliberate **non-adoption**.

## Context

Phase 06's roadmap lists three notification mechanisms, the third gated on need:

> 3. **Local reminders** — `expo-notifications` for purely-local event reminders *only if* needed beyond server push (don't double-stack).

Ships A–C delivered **server push** end-to-end: the `@/firebase` messaging seam (ADR 026), FCM-token registration + subscription preferences (ADR 027), and tap-through routing (ADR 028). The server's `firebase-admin` sender pushes a `calendar_changed` notification per changed event for every **synced** calendar the user subscribes to. That covers the entire synced-calendar surface.

The one surface server push **cannot** reach is **personal events** (Phase 05) — they are device-local (`personal_events` SQLite rows) and the server never sees them, so it can never push a reminder for them. So the genuine question Ship D must answer in writing: **is a local personal-event reminder a real user need now, warranting `expo-notifications`?**

Two facts decide it:
- **Parity.** The in-production Flutter app has **no local notifications at all** — no `flutter_local_notifications` dependency, no scheduling code, and its `personal_event` model carries **no reminder/notify field**. Its only notification path is the same FCM push we mirrored. Local personal-event reminders have **never existed in the product**.
- **Cost.** `expo-notifications` is a new native dependency → config plugin + a second notification permission to reconcile with FCM's + a scheduling lifecycle (schedule on create, **reschedule on edit**, **cancel on delete**, timezone/all-day/DST correctness) + its own device-only verification axis. Non-trivial, and it would be the **second** notification stack in the app.

## Decision

**Do not build local reminders in Phase 06.** Skip the `expo-notifications` dependency entirely.

Rationale: building it would be **net-new product scope**, not migration parity (Flutter never had it) — a speculative adoption R-2 forbids. Server push already covers the only events the server knows about (synced calendars), and stacking `expo-notifications` on top of FCM for those would be the explicit "double-stack" the roadmap warns against. The single legitimate gap — local reminders for **personal events** — is recorded as **future product debt**, not silently dropped (see the inbox note `docs/react-native-migration/inbox/2026-06-17-local-reminders-deferred.md`).

Alternatives rejected:
- *Build a minimal `expo-notifications` reminder scoped to personal events now* — rejected: no parity basis, no validated user demand, and it introduces a second notification stack + permission + scheduling-lifecycle debt for a feature the product has never had. R-2.
- *Add reminders for synced events via local scheduling* — rejected outright: server push already delivers these; this is the forbidden double-stack.

## Consequences

- **No `expo-notifications` dependency, no config-plugin/permission/native/fingerprint change** lands in Phase 06. The notification surface is exactly the FCM server-push stack (ADRs 026–028).
- Personal events have **no reminders** — same as the Flutter app today. Acceptable parity.
- If/when local reminders are built, they arrive as their own feature with their own ADR, permission reconciliation with FCM, scheduling lifecycle, and device-verification — not retrofitted under Phase 06.
- The decision is **recorded, not silent** — the inbox note carries the future-debt so the gap is discoverable.

## Revisit if

- Users ask for personal-event reminders (a validated demand signal), **or**
- A future phase adds any device-local event type whose value depends on a reminder, **or**
- The product decides reminders are a differentiator worth a second notification stack.

At that point, build it as a dedicated feature + ADR, reconciling the `expo-notifications` permission with the existing FCM `POST_NOTIFICATIONS`/`UNUserNotification` grant rather than prompting twice.
