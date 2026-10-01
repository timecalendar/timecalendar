---
kind: product
status: approved
decision: go
---

# Product shaping

## Problem and evidence

The Calendar timeline is the app's main surface, and its paging is broken on both platforms:

- **iOS, rapid swipes.** A second swipe that starts while the first page is still settling goes
  nowhere. The user must wait for each page to finish before swiping again. Diagnosed in
  `docs/investigations/2026-09-21-calendar-rapid-swipes/` (owner device trace, 2026-09-21). The
  cause is structural: a three-page `react-native-pager-view` that commits only at idle, then
  blocks input (`consumedGenerationRef`, `renderer/owned-calendar-coordinator.ts:333,347,366,376`)
  until React remounts the whole pager for the next week (`renderer/owned-calendar-canvas.tsx:301`).
- **Android, frame rate.** The owner observes about 2 FPS on a release-config preview build on a
  OnePlus 6 (owner report, 2026-10-01). Source evidence (R01, R03, R06) shows why:
  - **Every swipe remounts the pager.** That is 345–690 native views and about 180–300 animated
    styles rebuilt per swipe.
  - **Every pinch frame re-lays out the grid.** Each pinch frame animates `top`/`height` on about
    179 + 2 × tiles views, which forces a shadow-tree commit plus a Yoga layout per frame
    (`PropValueProcessor.cpp:12`).
  - **Per-tile `onLayout`.** Every centre-page tile fires a JS event per pinch frame
    (`canvas.tsx:829`).
  - **The shell isn't compiled.** The React Compiler bails out on `OwnedCalendarShell`
    (`renderer/owned-calendar-shell.tsx:194-195`), so every tile re-renders on each swipe, scroll
    settle and minute tick.
  - **Data reads on the JS thread.** Every week change runs 8 synchronous, unindexed table scans
    on the JS thread (R04).

  No frame measurement exists yet. The owner waived a baseline: "we know the current one sucks."
- **Origin.** T03 (`openspec/changes/archive/2026-09-13-scroll-owned-calendar-full-day/design.md:52-64`)
  chose PagerView because it was already installed for onboarding. It rejected nested native
  ScrollViews as "viable, but" redundant. Its own stop-and-measure gate (`:110`) was never run,
  because human device tasks do not block `/ship` (R07 §3).

Doing nothing leaves the main screen unusable on Android and frustrating on iOS, ahead of the
React Native launch that replaces the Flutter app.

## Users and desired outcomes

Students checking and browsing their timetable, mostly in week view, on phones that include
low-end Android devices.

### P01 — A new swipe always takes over

**Outcome:** On iOS and Android, a swipe that starts while the previous page is still moving or
settling is accepted immediately. It continues from the current visual position and moves one
further page. This holds for any number of consecutive swipes in either direction, with reversal
and cancellation. No swipe is dropped, no obsolete completion snaps the view back, and paging
continues past any rendering or data window. Product law §6.1 of the owned renderer (one page per
swipe or fling, title and date change at settle) still holds.

**Acceptance evidence:**
- **Device script, both platforms:** 20 rapid forward swipes, 20 rapid backward swipes, and a
  reversal mid-settle, each new touch starting before the previous settle. The view lands exactly
  20 pages away, or back at the start for the reversal, with matching header, title and events.
- **Jest:** a "swipe three times before React commits" test on the window logic.

### P02 — Paging, scrolling and pinch run at the display's frame rate on low-end Android

**Outcome:** Horizontal paging, vertical scrolling and pinch zoom keep up with the display's
refresh rate on the Android proxy device (OnePlus 6, 60 Hz) and the iPhone floor devices. No
frame does JavaScript work or layout during a gesture. Crossing to a new page costs at most one
page mount.

**Acceptance evidence:**
- **Release builds measured with the `mobile/perf/` harness** (R03 §6, R07 §3):

  | Scenario | Threshold |
  | --- | --- |
  | 3-second pinch | ≥95% of frames ≤16.7 ms, none >33 ms, 0 React commits and 0 JS events during the pinch |
  | Fling across 5 pages | ≤5% janky frames, p99 ≤33 ms, ≤1 frame over 16.7 ms per page crossing |
  | Page mount | ≤12 ms on the UI thread |
  | JS work per page crossing | ≤8 ms |
  | View count | ≤700 views in the window |
  | iOS hitch ratio | ≤5 ms/s |

- **Perfetto:** no Fabric commits during pinch or fling.

### P03 — Dates, header and events always agree

**Outcome:** At every point during movement and settling, the header strip, title, page dates and
event tiles describe the same days. A page whose events are not yet loaded is never shown or
announced as an empty week. Late or out-of-order data fills the correct page and never moves the
view. Memory and view counts stay bounded during long paging sessions.

**Acceptance evidence:**
- **Jest:** out-of-order chunk completions, and loading versus confirmed-empty presentation.
- **Soak:** a 500-page-crossing heap and view-count soak, and the 30-minute stress run from §13,
  with views within ±50 of start.
- **Device:** a dense-week device check.

### P04 — Paging is fully usable with VoiceOver, TalkBack and reduced motion

**Outcome:** Screen-reader users can page by day or week with a single adjustable control on both
platforms, reach every event, and hear exactly one context announcement per settle. Today and
deep links honour the live reduced-motion preference. This also fixes two probable defects in the
current build (R05 §2.1):
- On iOS, the event tiles are hidden inside the adjustable ScrollView.
- On Android, the ScrollView's own accessibility handling swallows its accessibility actions.

**Acceptance evidence:**
- **Device checks:** the R05 spike checklist on VoiceOver and TalkBack.
- **Jest:** the exposure and announcement tests ported from the shell suite.

### P05 — The renderer is small, idiomatic and verifiably compiled

**Outcome:** The paging owner has no generation, revision, epoch or "callbacks blocked" machinery.
Every renderer component compiles under the production React Compiler, and CI enforces it. Paging
math lives in `calendar/data` under the 90% branch gate. Tests encode behaviour rather than the
mechanism. Specs, ADRs and the Architecture Book describe the new design.

**Acceptance evidence:**
- **CI:** a compiler check with zero bail-outs in `renderer/`.
- **Size:** coordinator and zoom state reduced to the product-required state.
- **Tests:** the contract test is rewritten, and OpenSpec deltas plus Architecture Book updates
  are merged.

### P06 — No paging change reaches users without device proof

**Outcome:** Work may merge to `main` unfinished, and `main` may carry a broken Calendar while the
rebuild is in progress. No build that carries the new paging owner reaches users (store binary or
OTA to the preview or production channels) until device evidence exists for that exact revision,
with the owner's verdict. Device checks are part of each epic's definition of done, not optional
human tasks.

**Acceptance evidence:** an evidence file per epic that names the tested revision, the device runs
and the owner's verdict. The release checklist refuses a preview or production build without it.

## Appetite and constraints

- **Appetite:** about 3–5 agentic days plus owner device passes; one spike, then about 6–9 PRs.
  Kill or rescope if the spike fails its kill criteria.
- **Binding product law:** `docs/projects/owned-calendar-renderer/product.md`: §6.1 (paging),
  §7.2 (pinch with focal preservation), §9 (gestures), §12 (accessibility), §13 (continuity and
  performance). This project does not change those outcomes unless the owner amends them below.
- **Device and build constraints:**
  - No local native release builds on the owner's MacBook Air, because it froze. Android release
    builds run on the Windows PC (`ssh pc`).
  - iOS evidence goes through OTA to a TestFlight preview build, or an EAS cloud build.
  - The iOS deployment floor is 16.4. No runtime feature flags (owned-renderer D07).
- **Dependencies:** `react-native-pager-view` stays installed for onboarding (ADR 036).

## In scope

- Replacing the timeline's horizontal paging owner, plus its header projection, page window, data
  window and settlement contract.
- A transform-based pinch, the shared hour-line layer, and the Reanimated synchronous UI-props
  flags.
- Moving the accessibility paging control, the live reduced-motion preference, and Today/deep-link
  motion.
- Cleanup absorbed by the rebuild: the transition reducer, generation, epochs, the PagerView event
  bridge, focus-restoration refs, the per-page Modal, the dev overlay, double presentation builds,
  per-render formatting, and `adjustsFontSizeToFit` in the header.
- A pre-rebuild quick-win PR: compile the shell and gate the per-tile `onLayout`.
- Housekeeping that blocks clean specs: archive the zoom (T06) and local-events (T09) OpenSpec
  changes, reconcile the owned-renderer ticket statuses, and fix the stale
  `.claude/rules/mobile.md` pointers.
- The `mobile/perf/` harness and the device-evidence release gate.

## Out of scope and non-goals

- New calendar features: multi-week fling travel, month view, an all-day lane, or new gestures.
- Agenda redesign. Sharing the data store with the agenda is an open question, not a goal.
- Native modules, Skia, or a custom native pager.
- SQLite indexing beyond what the data window needs. Index work is limited to the event range
  columns the chunk query uses.
- Upgrading Expo SDK, React Native, Reanimated or pager-view.

## Assumptions and unknowns

| Assumption or unknown | How it gets tested |
| --- | --- |
| A1. A horizontal `Animated.ScrollView` nested in the vertical one arbitrates axes natively on Android (equal touch slop) as well as iOS. Inference from source (R02 §5). | Spike checks 1–3 |
| A2. Android `snapToInterval` + `disableIntervalMomentum` feels native and reconciles a second touch during its snap. Plain `pagingEnabled` settles with a fixed 250 ms animation. Read from source only. | Spike, OnePlus 6 |
| A3. Most of Android's ~2 FPS comes from remounts, layout-animated pinch and the uncompiled shell, so it disappears with D04 and D07. | Quick-win PR then spike measurement. If FPS stays low after both, re-open D04. |
| A4. A 4-week chunk read is cheap enough on a OnePlus 6 that loading pages are rare. | Spike measurement with the chunk query |
| A5. The two probable accessibility defects (R05 §2.1) exist on the current build. | Spike checks 1–2 on the current build |
| U1. Resolved: one page per fling (§6.1 unchanged). | Owner, 2026-10-01 |
| U2. Resolved: title follows each settle; a loading page shows the grid only. | Owner, 2026-10-01 |

## Alternatives

Full analysis: `research/R08-alternatives-and-adversarial-review.md`.

- **Do nothing.** The iOS failure is structural and Android stays unusable. Rejected.
- **Smallest intervention.** Keep PagerView, drop `generation` from the key, add the flags and the
  quick wins.
  - **What it gives:** the quick-win half ships anyway (E01).
  - **Why it can't fix iOS:** the 3-page edge is built into PagerView, and widening it resets the
    SwiftUI view. On Android, `NestedScrollableHost` halves horizontal motion before the slop test.
  - **Verdict:** a stopgap only.
- **An owned Reanimated/Gesture Handler horizontal pager** over the native vertical ScrollView.
  - **Problems:** non-native physics, and arbitration based on gesture thresholds, which T03
    already rejected.
  - **Verdict:** the fallback if the spike kills the ScrollView option.
- **Virtualized list** (FlatList, FlashList, LegendList). Windowing runs on the JS thread.
  Dominated by the ScrollView option.
- **The @expo/ui pager.** It needs iOS 17 or later, but the floor is 16.4. Not viable now.

## Risks and kill criteria

**Risks:**
- **Android nested arbitration** (RN #32023, TalkBack).
- **Blank pages** at index +2 during long chains.
- **Rewrite cost** (about 60 contract sites, a 2,310-line shell test).
- **Platform claims read from source only** (R02, R05 confessions).
- **`main` may be broken mid-rebuild** (owner accepted); the release gate must hold.

**Kill or rescope the ScrollView option (fall back to the owned pager, E-level replan) if the
spike shows any of these:**
- A horizontal drag on Android loses to the vertical scroll more than 1 time in 20 on diagonal
  starts, after tuning.
- A second touch during the Android snap cannot be reconciled without a visible jump.
- Pinch cannot run simultaneously with both native scroll views.
- The P02 thresholds are missed by more than 2× with the shared grid and transform pinch in place.

## Recommendation

**Go**, gated. Ship E01 (quick wins and housekeeping) immediately. Then run the device spike
(E02) with the kill criteria above before committing to the rebuild epics.

## Approval

Owner (Samuel Prak) approved explicitly in the Claude Code planning session, 2026-10-01 (round-1 answers). Round-1 resolutions: U1 one page per fling kept; U2 title follows each settle (final settle when chained), loading page shows the grid without events and is never announced as empty; navigation has no limit. P06 revised per owner: merging unfinished work on main is acceptable; device proof gates user releases, not merges.
