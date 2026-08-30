# Activity refresh triggers — release-device verification

**Date:** 2026-08-30
**Change:** `wire-mobile-activity-triggers`
**ADR:** the Activity trigger ADR added by this change (number assigned when it is written — see
[`decisions/README.md`](../../mobile/architecture-book/decisions/README.md))
**For:** Samuel `(HUMAN: physical iOS and Android release-device pass for push, foreground and prune)`

## What I need

On a physical iPhone and a physical Android phone, both running a **release** build with real FCM
delivery (not a debug build, not a simulator, not `expo start`), confirm that Activity becomes
current through the three triggers Jest cannot reach:

1. **Push, all three delivery states.** Send a real `calendar_changed` push for a held calendar and
   confirm the Activity list contains the new entry in each of:
   - **foreground** — app open on any screen; the entry appears without the app navigating away;
   - **background tap** — app backgrounded, tap the notification; the existing deep link still opens
     the affected event (or the calendar, for a `cancel` or a digest) *and* the entry is there;
   - **killed / cold start** — swipe the app away, tap the notification; same two outcomes.
   Repeat at least the foreground case with `calendar_digest`.
2. **Push survives a failing sync.** With the device offline for the calendar sync request but able
   to reach the Activity endpoint (airplane-mode toggling mid-flight, or a proxy blocking
   `/calendars/sync` only), confirm the push still refreshes Activity. The two calls are deliberately
   independent — this is the guarantee that cannot be proved in the same way off-device.
3. **Foreground return after five minutes.** Open the app, background it, wait **more than five
   minutes**, and return. Activity refreshes exactly once. Repeat with a return after **under** five
   minutes and confirm it does **not** issue a request. Then confirm that leaving and dismissing the
   notification shade or control centre (an `inactive → active` transition, not a real background)
   triggers nothing.
4. **Removal prune, offline.** With the device **offline**, remove one of two held calendars and
   confirm only the removed calendar's Activity history disappears — the remaining calendar's entries
   survive. Separately, **hide** (do not remove) a calendar while offline and confirm its Activity
   history is **untouched**; a hidden calendar is still held.

## Why

Jest proves the trigger policy, the five-minute window and the single-flight collapse against a
controlled clock and a mocked mutator, and it proves the prune's observed-transition rule including
the empty-set case. It cannot prove native FCM delivery in the killed state, the real
`background → active` transition the OS emits (as opposed to the one the test dispatches), or that a
real removal on a real device supplies the id list the prune reads. This workspace has no
emulator/simulator, so those three are physical-device-only.

## How to verify

Record the build profile, platform/OS version, the push `action` used, and for each numbered item
above: observed Activity entries, observed navigation, and observed request count. A pass requires
the new entry present in all three delivery states on both platforms, existing deep-link routing
unchanged, exactly one refresh on a >5-minute foreground return and none on a <5-minute one, and the
prune deleting only the removed calendar's history.

## Blocks

Nothing in this change. Ticket 7 ([TIM-400](/TIM/issues/TIM-400)) documents the device checks; this
note must not block the trigger-wiring merge.
