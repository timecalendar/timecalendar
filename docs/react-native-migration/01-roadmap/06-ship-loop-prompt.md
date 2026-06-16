# Phase 06 — autonomous ship-loop prompt

The copy-this prompt that drives [Phase 06](./06-notifications.md) to completion autonomously.
Launch with `/loop <paste the fenced block below>` (no interval — dynamic self-pacing, since each
feature is a long `/ship` pipeline). The block is self-orienting and idempotent: each wake it
re-derives state from `origin/main` + the OpenSpec archive, ships the next feature, merges, and
re-fires until the phase's exit criteria are met.

**Like [Phase 03](./03-ship-loop-prompt.md) / [Phase 05](./05-ship-loop-prompt.md), NOT
[Phase 04](./04-ship-loop-prompt.md):** a clean serial worklist with **no spike** — the
adopt/fork/build call was the calendar's, not notifications'. The push transport decision is
**already made** (FCM + `firebase-admin`, Expo Push rejected). The distinguishing feature of
Phase 06 is that its **load-bearing exit criteria are DEVICE-ONLY and un-CI-able**: push received
foreground / background / **killed**, tap-routing, on **both** platforms, in a **release** build.
CI proves the seam wiring; real delivery is inboxed for human hardware. The loop must not mistake
"the wiring is green" for "push works."

**Decisions baked in** (confirmed 2026-06-16, grounded in the Flutter
`modules/firebase/services/notification/notification.dart` + the server
`notification-subscription` module, which is **already built and stays UNCHANGED**):
- **No server ship.** The server `firebase-admin` sender + `notification-subscription` PUT flow are
  done and frozen. Every ship in this phase is **mobile-only**. Expo Push stays rejected (firebase.md
  R-2 / roadmap "Reject Expo Push"). The production Firebase project (`timecalendar-samuelprak`) is
  **shared with the live Flutter app, which already ships push** — so the production APNs key + FCM
  sender already exist; this phase is **client-side wiring**, not new infrastructure.
- **New native dep:** `@react-native-firebase/messaging` v24 (match the installed RNFB v24
  `app`/`crashlytics`/`analytics`), **extending the existing `@/firebase` seam**
  (`mobile/src/firebase/index.ts`). Messaging is currently listed **DEFERRED** in
  `docs/mobile/architecture-book/firebase.md` ("Auth + Messaging are deferred… R-2: no speculative
  adoption") — Ship A flips that to built. This is a **load-bearing ADR** (messaging seam shape +
  re-affirm the Expo-Push rejection + the iOS-APNS-token-first rule).
- **Local reminders (`expo-notifications`) are NOT built by default.** The roadmap gates them on
  "only if needed beyond server push — don't double-stack." Server push already covers synced
  calendars. The ONE genuine local-only gap is **personal events** (Phase 05, device-local — the
  server can't push reminders it doesn't know about). Ship D's job is to make that call **explicitly
  and in writing** (build a minimal personal-event local reminder, or inbox a recorded "deferred"
  decision) — never silence.
- **The subscription API is PUT-only.** `PUT /notification-subscription` is create-or-update; there
  is **NO GET**. So preference state has no server read-back — it must persist **locally** (MMKV
  `@/storage`) and PUT idempotently. "Round-trips with the server" (exit criterion) = the PUT
  succeeds and the local store is the source of truth.
- Human-only / device-only / release-build-only work is inboxed, never blocks the loop.

---

```
Autonomously complete Phase 6 of the RN migration (docs/react-native-migration/01-roadmap/06-notifications.md): push + reminders on Firebase, server side UNCHANGED. You are FULLY AUTONOMOUS — no human approval for any command (run simulators/emulators, tests, merge PRs, push, all of it). You CONDUCT; you do not write production code yourself — every unit of shippable work is delegated to sub-agents per the /ship pipeline. Adhere to the Architecture Book (docs/mobile/architecture-book/architecture.md + topical files) and pass the full Definition of Done for every feature.

## THE thing that makes this phase different: the real exit criteria are DEVICE-ONLY and un-CI-able
Push received foreground/background/KILLED, tap routes correctly, on BOTH platforms, in a RELEASE build (debug under expo-dev-client does not report native crashes — roadmap risk). A CI emulator cannot receive a real FCM push, and iOS push does not work on the simulator AT ALL (needs a physical device + an APNs key in the Firebase console). So: CI proves the SEAM WIRING (token/permission/onMessage/payload→route against mocked native messaging — extend jest/setup-firebase.ts, the firebase.test.ts posture). Real delivery is INBOXED for human hardware. Do NOT tick an exit criterion because the wiring is green — green wiring + an honest device-verification inbox note is the bar. The server is UNCHANGED and the production Firebase project (timecalendar-samuelprak) is shared with the live Flutter app that already ships push, so the production sender + APNs key already exist; this is client wiring.

## The worklist (ship SERIALLY — one PR merged to main before the next starts)
Each item is one full /ship (plan → apply → simplify → review-loop → archive → PR → wait-green → zero-touch merge). Flutter module to mine for parity: modules/firebase/services/notification/notification.dart (getFcmToken with iOS-APNS-token-first, foreground onMessage, handleNotification action-dispatch on message['action'] e.g. 'calendar_changed'/CALENDAR_CHANGED, requestPermission, subscribeDelay). Server (UNCHANGED, read-only reference): server/src/modules/notification-subscription/* — DTO NotificationSubscriptionCreate { frequency: immediately|hourly|daily, nbDaysAhead 1–30, isActive, calendarIds: UUID[], fcmToken }, PUT /notification-subscription. The Orval client is ALREADY generated: mobile/src/api/generated/notification-subscription/ (useNotificationSubscriptionControllerCreateOrUpdateSubscription). Before each ship, have the planner READ the existing code — these ships GROW the @/firebase seam (Phase 01), Settings (Phase 02), user_calendars (Phase 03), and the calendar/event routing (Phase 04).

### Ship A — FCM push receive + the messaging seam (the load-bearing one)
- Extend @/firebase (mobile/src/firebase/index.ts) with messaging, mirroring the Flutter notification.dart: requestPermission (iOS UNUserNotification + Android 13+ POST_NOTIFICATIONS), getToken with the iOS APNS-token-FIRST guard (getAPNSToken before getToken, exactly like the Flutter getFcmToken), foreground onMessage, the TOP-LEVEL setBackgroundMessageHandler (must register at module init, not inside a component — RN harness constraint), and a token-refresh listener. Keep the lazy-resolve-native-inside-each-helper posture (importing @/firebase must never touch native — safe in Jest).
- NEW native dep @react-native-firebase/messaging v24 (match the installed RNFB v24) → config plugin in app.config.ts, iOS push entitlement (aps-environment) + UIBackgroundModes remote-notification, Android POST_NOTIFICATIONS permission, autolink check via prebuild. iOS static frameworks are ALREADY set (firebase.md) — messaging rides that; if a pod breaks, ios.forceStaticLinking is the escape.
- ADR (load-bearing — mirror ADR 020/021 rigor): the messaging seam shape, re-affirm the Expo-Push rejection (FCM + firebase-admin, server unchanged), and the iOS-APNS-first token rule. FLIP firebase.md's "Messaging deferred" line to built + append to architecture-changelog.md.
- CI proves: extend jest/setup-firebase.ts to mock native messaging; assert the seam drives permission/token/onMessage with expected args (the firebase.test.ts pattern). CI CANNOT prove a push ARRIVES — inbox the device step.

### Ship B — Token registration + subscription preferences
- Register the FCM token with the backend via the EXISTING generated client (useNotificationSubscriptionControllerCreateOrUpdateSubscription, PUT /notification-subscription). Server UNCHANGED. calendarIds come from Phase 03's user_calendars; fcmToken from Ship A's seam; re-PUT on token-refresh.
- Subscription-preferences UI — grow Phase 02's Settings with a sub-screen bound to the DTO: frequency (immediately/hourly/daily), nbDaysAhead (1–30), isActive toggle. Mirror the Flutter notification settings.
- WRINKLE the planner MUST resolve (ADR-record if load-bearing): the API is PUT-only — there is NO GET, so pref state has no server read-back. Persist frequency/nbDaysAhead/isActive LOCALLY (MMKV @/storage) and PUT idempotently on change + on token-refresh; the local store is the source of truth. "Round-trips with the server" (exit criterion) = the PUT succeeds.
- Observability: a failed subscription PUT → @/firebase recordError + an accessible failure surface (a retryable network write — not irreplaceable, but the user's reminders silently break if it fails). Tested write path (Jest: PUT-on-change, re-PUT-on-token-refresh, local persist/read-back).

### Ship C — Tap-through routing
- A notification tap opens the CORRECT calendar/event screen across all three app states: foreground (onMessage), background (onNotificationOpenedApp), killed/cold-start (getInitialNotification). Grow Phase 04's calendar/event routing (the origin-keyed tap routing already exists in the events seam).
- Mirror the Flutter handleNotification dispatch on message['action']: 'calendar_changed' (CALENDAR_CHANGED) → trigger a sync/refetch rather than navigate; an event/calendar-targeted payload → route to that screen. Decide the payload→route contract and record it.
- CI proves the payload→route mapping at the component/Jest level (mock the messaging events + the router). Real tap-from-KILLED is DEVICE-ONLY — inbox it.

### Ship D — Local reminders (expo-notifications) — DEFAULT: NOT BUILT, decide explicitly
- The roadmap gates this on "only if needed beyond server push — don't double-stack" (R-2: no speculative adoption). Server push already covers SYNCED calendars. The ONE genuine local-only gap is PERSONAL EVENTS (Phase 05, device-local — the server cannot push reminders for events it never sees).
- The planner's job is to make the call IN WRITING: is a local personal-event reminder a real user need now? If YES → ship a minimal expo-notifications local reminder scoped to personal_events (new dep → config plugin + permission; schedule on create/edit, cancel on delete). If NO → inbox a recorded "local reminders deferred — server push suffices, personal-event reminders are future debt" decision and skip the dep. Either way it ENDS with a written decision (ADR or inbox note), never silence. Do NOT stack expo-notifications on top of FCM for events the server already pushes.

## HUMAN-ONLY / DEVICE-ONLY / RELEASE-ONLY items — inbox immediately, never block the loop
- **Real push delivery, foreground/background/KILLED, both platforms, in a RELEASE build** — the core exit criterion and the one CI cannot touch (emulator can't receive FCM; iOS push needs a physical device). Write a docs/react-native-migration/inbox/ HUMAN note with a concrete test script (send a test push from the Firebase console / server to a seeded token; verify each app state; verify tap routes). It is NOT a ship.
- **iOS APNs / dev Firebase project prerequisites** — production (timecalendar-samuelprak) already has an APNs key via the Flutter app, but the dev project (timecalendar-dev) may need its own APNs auth key uploaded in the console + a real device for any dev-build push test. Console + hardware → inbox a HUMAN note; not a ship.
- **Native-crash reporting under expo-dev-client** — the roadmap risk: native crashes aren't reported to Crashlytics in dev-client builds, so notification reliability MUST be verified in a release/standalone build. Fold this into the device-verification note.
- **Visual + a11y review** of the subscription-prefs UI (and any reminder surface) on both platforms — the DoD native-correctness + manual screen-reader axes need human eyes. Inbox once.
- **OEM/Android delivery throttling** is a known, unchanged limitation (no guaranteed delivery time) — note it in the device-verification inbox so a "slow/missing push on a throttling OEM" is not mistaken for a regression.
- Any design-asset gap: ship a tasteful native-default version (R-3) and inbox a polish follow-up; do NOT stall.

## Per-iteration algorithm (this prompt re-fires each wake — be idempotent)
1. ORIENT: `git fetch origin`, check `git log origin/main` + `openspec/changes/archive/` to see which ships already merged. Read the roadmap doc for checkboxes; check whether firebase.md still says "Messaging deferred" (if it does, Ship A hasn't landed).
2. Pick the FIRST unmerged ship in order (A → B → C → D) and run the full `/ship` pipeline (see .claude/commands/ship.md). Delegate every phase to the sub-agents (change-planner / change-implementer / change-simplifier / change-reviewer). You own only git/PR/merge.
3. If ALL of A–C are merged, D has a written decision (built or recorded-deferred), AND the device-verification inbox notes exist → verify the EXIT CRITERIA (push received foreground/background/killed [INBOXED for human hardware — green wiring + honest note is the bar]; tap routes correctly; subscription prefs round-trip [PUT succeeds, local store is source of truth]; both platforms; full DoD). Tick the roadmap, then STOP the loop (do not schedule another wakeup) and report.
4. Ship invariants: reviewer is the sole merge gate (cap 3 review rounds, then inbox-escalate + leave PR draft + skip to next only if truly stuck); wait for GREEN with `gh pr checks <pr> --watch` before `gh pr merge --squash --delete-branch` (NEVER `--auto` — main is unprotected); do NOT add the run-e2e label (E2E runs on main only) — for the messaging/routing ships run Maestro LOCALLY via mobile/e2e/run_e2e.sh where it adds confidence (but remember Maestro can't deliver a real push — the seam-wiring tests + the human inbox note are the real proof).
5. After a successful merge, schedule the next wakeup (dynamic /loop). After a genuine hard block you can't resolve, inbox it and continue to the next shippable item rather than halting.

## Stop-the-bleeding escape hatch (refactor over more features)
If at ANY point you stumble on a HARD ARCHITECTURAL problem — the @/firebase seam can't cleanly carry messaging without breaking its no-startup-side-effect / lazy-native posture, the background-handler registration fights the Expo Router entry, the PUT-only/no-GET pref state forces a messy local-source-of-truth hack, or the tap-routing can't reach both calendar and event screens from a cold start without duplication — STOP shipping. Do not paper over it.
1. Name the problem precisely (what's bleeding, why the next feature makes it worse).
2. Per R-4 triage: a load-bearing blocker earns a deep-dive + an ADR + an Architecture Book update. Spin up a dedicated REFACTOR /ship BEFORE resuming the worklist.
3. Update the Book/changelog so the new pattern is the rule going forward, then resume.
A clean refactor that prevents debt is SUCCESS, not a detour (migration-approach §4/§7).

## Guardrails
- SERIAL only — never run two ships concurrently; they grow shared files (architecture.md, firebase.md, app.config.ts, the @/firebase seam, Settings, the calendar/event routing, lockfile) and would collide.
- SERVER IS UNCHANGED — no server ship, no server edits. The notification-subscription module + firebase-admin sender are frozen; treat them as read-only reference for parity only.
- Don't mistake green CI for working push. The load-bearing exit criteria are device/release-only; CI proves wiring, the inbox note carries the rest. Report the gap honestly.
- Every real ship updates the Architecture Book + appends to architecture-changelog.md + adds an ADR if load-bearing (the implementer/reviewer enforce this — it's part of DoD). Ship A flips firebase.md's Messaging-deferred line to built.
- Report faithfully at each merge: change name, PR link, merge SHA, inbox handoffs, what's next. If CI is red, a write path is untested, or a device criterion is only inboxed-not-proven, say so plainly.
- Delegate, don't code. Sub-agents do the shippable work.
```
