# Calendar screen — iteration backlog (device feedback, 2026-07-06)

Open feedback from the user's device pass on the **day/week/agenda calendar screen**
(`mobile/src/features/calendar/ui/calendar-screen.tsx` + its grid `EventTile`, plus the
chrome seam `mobile/src/components/chrome/calendar-kit.tsx`). This is a **living backlog**,
not a device-pass sign-off: the screen redesign that introduced native nav-bar chrome
(month-year title, `ViewMenu`, `HeaderActions`, `TodayButton`, `AddFab`) is currently
**uncommitted** on `main`, and these are the remaining rendering/behaviour defects on top
of it.

## How to use this doc (for the next agent)

1. **Pick ONE issue** (or one clearly-related group — issues are pre-grouped where the fix
   is shared). They are ordered by recommended sequence; **Issue 1 is the current pick**.
2. **Run it through `/iterate-screen`** — this screen is already in that loop. The oracle
   rules apply: reviewers are citation truth (HIG / Material 3 / WCAG + *installed*
   `node_modules` sources), the **user's device is the only rendering truth**. Propose
   first (ASCII previews + `AskUserQuestion` for genuine choice points), build, run the
   3-reviewer panel, then hand the user a precise device checklist.
3. **Gates after every change set** (binding — see `.claude/rules/mobile.md` +
   `docs/mobile/architecture-book/testing.md`): `npx tsc --noEmit`, `npm run lint`, and the
   **full suite as `npm test -- --coverage`** (plain `npm test` passes blind past the 90%
   per-file branch gate).
4. **Tick the issue's Status** below and note what shipped. If a fix needs an ADR or a
   topical-book change, update `docs/mobile/architecture-book/` + the changelog (that is
   part of the feature DoD, not optional).

Binding reading before touching code: `docs/mobile/architecture-book/calendar.md`
(the calendar surface), `theming.md`, `accessibility.md`, `testing.md`, and for the
storage/perf issues **ADR 021** (`decisions/021-calendar-event-storage-and-sync.md`,
including the 2026-07-05 `harden-mobile-db-seam` amendment).

---

## Issue 1 — Grid event tiles are unreadable (title truncation + location not differentiated) ← **PICK THIS FIRST**

**Grouped: original feedback items #5 + #6** — both are the same tile, one text-hierarchy fix.

**Symptom (user):**
- The subject name is shown as `"Dev…"` / `"Exp…"` / `"Intr…"` — totally unreadable. The
  text should be **smaller**, and should be allowed to **break in the middle of words**
  (like Google Calendar). The space is small and that is acceptable.
- The **location** is shown in the **same font size/weight as the title**, so the two
  can't be told apart.

**Where:** `EventTile` in `mobile/src/features/calendar/ui/calendar-screen.tsx`
(currently ~lines 401–441, styles `tile` ~539). This is the tile rendered *inside the
calendar-kit grid* via `renderEvent` — **distinct** from the agenda `EventTile` in
`agenda-list.tsx` (the agenda tile already differentiates title vs location correctly;
this issue is grid-only, though check the agenda tile for parity while you're there).

**Diagnosis:** the grid tile renders both title and location with the same
`ThemedText type="small"` and `numberOfLines={2}`/`{1}`. Truncation with `…` is the
default `ellipsizeMode="tail"`; the fix is to (a) shrink the title font for the grid
context, (b) allow **mid-word breaking** so a long single word wraps instead of ellipsising
(RN: no `numberOfLines` cap OR a higher cap, and note RN wraps at word boundaries by
default — to break *inside* a word on native you generally need the text to have
break opportunities; verify the actual behaviour on device, this is the kind of thing the
device oracle settles), and (c) give **location a smaller/lighter treatment** than the
title (a distinct `ThemedText type` or `themeColor`, e.g. a de-emphasised weight/opacity)
so hierarchy is visible.

**Gotchas / constraints:**
- Tokens only, no call-site color/size math (R-3 + `theming.md`). If you need a new text
  size/weight, add it as a `ThemedText` type / theme token, don't inline it.
- `MIN_TILE_WIDTH` already hides text below a threshold column width — respect it; this
  issue is about the *readable-width* case.
- The tile's **`accessibilityLabel`** (`calendar.event.label` with title/time/location)
  must stay intact — the visual change must not regress the screen-reader label.
- The screen test (`calendar-screen.test.tsx`) asserts the tile wiring through the mocked
  grid (`jest/setup-calendar-kit.ts`) — update assertions if you change the text structure,
  keep coverage ≥90%.

**Risk:** low. Pure presentational, single component, no data/perf/library surface.
**Why first:** highest readability payoff for the least risk, fully self-contained.

**Status:** ☑ shipped (2026-07-06, device-verified clean). Two new `ThemedText` tokens
`caption` (12px/600) + `captionSmall` (11px/400) give the grid tile a title↔location
hierarchy; the title now char-wraps + breaks mid-word. **Device oracle caught a defect
theory missed:** an *uncapped* iOS `Text` sets the Fabric line-break container to
`NSLineBreakByClipping` (paragraph stays word-wrapping), so a long *trailing* word clipped
mid-glyph at the right edge + reserved a phantom empty line. Fix = a **5-line
`numberOfLines` cap** (any `N>0` flips iOS onto the tail-truncation path; `ellipsizeMode="clip"`
is the bug mode and must not be used). Encoded in `calendar.md` + the `EventTile` code comment.
Agenda tile already differentiated correctly (unchanged). **Deferred a11y follow-ups (next
slice):** (a) `accessible={true}` on the tile container so VoiceOver reads one stop, not
title+location separately (pre-existing); (b) `maxFontSizeMultiplier` on the caption tokens for
graceful degradation at very large Dynamic Type. **Parity note:** `home/ui/today-timeline.tsx`
has the same title/location tile but already caps at `numberOfLines={2}` (so it is NOT exposed
to the clipping defect); its title/location still share `type="small"`, so the *hierarchy*
refinement is an open parity item there if desired.

---

## Issue 2 — All-day events span two days (timezone rendering bug)

**Original feedback item #4.**

**Symptom (user):** a full-day event is drawn across **two days** on the grid, e.g.
*"Férié : Lundi de Pentecôte"* (from `but-informatique-2026.ics` on
`cdn-dev.timecalendar.app`). The details screen shows
`"Monday, May 25th, 2026 02:00 – Tuesday, May 26th, 2026 02:00"`.

**Diagnosis — this is OUR app, not the ICS.** The `02:00` is the tell: an all-day event
is stored as **UTC midnight** (`startsAt = 2026-05-25T00:00:00.000Z`,
`endsAt = 2026-05-26T00:00:00.000Z`), and France in summer is **UTC+2**, so it renders as
`02:00` local on May 25 → `02:00` local May 26 — i.e. it correctly occupies 24h but
straddles the local-midnight boundary and paints on two grid days.

The **root lever already exists and is currently ignored**: `CalendarEvent.allDay: boolean`
is decoded end-to-end (`dtoToRow`/`rowToCalendarEvent` in
`data/sync/types.ts:72,119`; `data/types.ts:20`) **but no rendering surface reads it** —
the grid (`mapToEventItem` in `calendar-screen.tsx`) and the agenda both treat every event
as a timed `startsAt→endsAt` block. calendar-kit v2 has native all-day-row support
(an all-day events lane above the timed grid) keyed off the `EventItem`'s all-day-ness —
**verify against the installed `@howljs/calendar-kit` types/source in `node_modules`**, it
is the citation oracle here.

**Fix direction (decide with the reviewers, do NOT guess):**
- Map `allDay` through to the `EventItem` shape the library expects for an all-day event
  (likely a date-only `start.date`/`end.date` rather than `start.dateTime`, so the lib
  places it in the all-day lane instead of the timed grid) — confirm the exact contract in
  the installed calendar-kit types.
- On the **details screen** (`event-details-screen.tsx` + `formatEventDateRange` in
  `data/format.ts`), an all-day event should format as a **date (or date range) with no
  time** — Flutter parity. `format.ts` currently has no all-day branch; `formatEventDateRange`
  always prints `HH:mm`. Add an all-day-aware path (it will need `allDay` passed in).
- Agenda tile likewise should show an all-day event without a `02:00 – 02:00` time range.

**Gotchas:**
- Do **not** "fix" this by mutating stored timestamps — the row is verbatim by design
  (ADR 021 / D1). This is a **rendering/projection** fix keyed on the `allDay` flag.
- Cross-day (multi-day) all-day events exist too (a real range) — don't collapse them.
- `format.ts` is 90%-gated pure code; add tests for the all-day branch.

**Risk:** medium. Touches the grid mapping, the agenda, the details formatter, and needs a
verified library contract. Self-contained to the calendar feature; no storage change.

**Status:** ◐ built + panel-passed, awaiting device pass (2026-07-06). All-day events now map to
calendar-kit's **date-only** shape (`mapToEventItem`) so the lib lanes them in the **all-day row**,
rendered by a custom brand `AllDayTile` via `<CalendarHeader renderEvent>` (title-only chip idiom;
location in the a11y label + details). Two verified library contracts drive the mapping (both in the
book): all-day `end.date` is **inclusive** (`eventUtils.js:11`) so the last day = `endsAt − 1ms` (our
end is exclusive), clamped `max(startsAt, endsAt−1ms)` against a degenerate zero-duration event; and the
day is keyed off **UTC** (new pure `utcDayKey`) since an all-day date is floating. `formatEventDateRange`
gained an `allDay` branch (date/date-range, no time, UTC-proxy) — same guard; the agenda tile + details
drop the time; `EventDetails` + both mappers thread `allDay`; new `calendar.allDay` FR+EN.
`AllDayTile` announces the **real** `allDay` flag (a timed ≥24h event the lib also lanes here shows its
real time range, not a false "all day"). **Device-caught defect the panel's theory missed:** a `flex:1`
tile collapsed to a 1-2px bar with no text — calendar-kit's event content is an `absoluteFillObject`
sized by a **Reanimated animated height**, so a flex child resolves against a height Yoga reads as auto →
0px; the fix is flowing non-flex text (encoded in `calendar.md` + a code comment). Gates green (tsc +
lint + 591 Jest + coverage; `data/` all-day math 100%). Three-reviewer panel (native/rn/a11y) **all
APPROVE**. **Deferred (recorded, non-blocking):** (a) title-over-`event.color` WCAG 1.4.3 contrast — a
**cross-cutting** all-tile gap for a dedicated palette/token ship (a11y-reviewer owns); (b)
`maxFontSizeMultiplier` on the caption tokens (shared deferred debt); (c) a multi-day *timed* event laned
in the all-day row speaks its HH:mm range without the day span (rare; details screen carries the full
span). **On device:** confirm the two-day span is gone (single column), the title is readable, the
details/agenda show no `02:00 – 02:00`, and VoiceOver/TalkBack read the chip **once** ("… , Toute la
journée").

---

## Issue 3 — Top-right header actions (Today + Add) are not iOS-standard and look glued together

**Original feedback item #1.**

**Symptom (user):** the two top-right icons (go-to-today, add-an-event) are **not iOS
standard** for these button patterns and need an **expert review**. The design is bad — the
two icons look **stuck together as if they were one icon**.

**Where:** `HeaderActions` / `TodayButton` / `AddFab` in `calendar-screen.tsx`
(~lines 320–395) + their styles (`headerActions`, `todayButton`, `todayTab`, `todayNumber`,
`addGlyph` ~465–504). Currently: iOS `headerRight` holds a hand-drawn calendar-day glyph
(bordered page + today's day number) next to a `"+"` text glyph; Android splits Today into
the header and Add into a FAB.

**Diagnosis / why it's hard:** no icon font is wired in the app (R-3 forbids porting
Flutter's FontAwesome), so both actions are hand-drawn from `View`/text — which is exactly
why they read as one blob. This needs a **native-patterns reviewer decision**, not a quick
tweak:
- What is the HIG-correct pattern for "jump to today" + "add" in a nav bar? (SF Symbols via
  a real icon source? `expo-symbols`? Two separate `headerRight` items with proper spacing?
  Is "Today" even a nav-bar action on iOS calendars, or does Apple Calendar put it elsewhere?)
- Whether to introduce an **icon source** at all is an architectural call (a new dep / a
  chrome seam) — flag it, it may warrant an ADR.

**Fix direction:** this is a **Phase 1 proposal** issue — bring options to the user with
`AskUserQuestion` (icon source vs. text, placement, per-platform split) before building.
Don't ship a hand-drawn tweak; get the native-patterns oracle to cite the correct idiom.

**Risk:** medium (may add a dependency / ADR). Design-led, needs user choice.

**Status:** ◐ built + panel-passed, awaiting device pass (2026-07-09). **The "no icon font is wired"
diagnosis was stale** — `expo-symbols` (`SymbolView`) landed after this backlog was written and is
already the app's blessed icon idiom (used in `school-selection` + `user-calendars`), so **no new
dependency, no ADR**. User chose (Phase-1 `AskUserQuestion`): an **SF Symbol** for Today (over a text
button) + **always visible** (not Apple's contextual hide). Result: iOS renders real SF Symbols via the
`expo-symbols` seam — Today = `calendar`, Add = `plus` (Apple's bare nav-bar add glyph) — each a **44pt
(iOS) / 48dp (Android)** target with **no `hitSlop`** (the frame is the target; hitSlop overlaps the
adjacent action across the 8px gap) + `gap: Spacing.two` so two 24pt glyphs sit ~28px apart (kills the
"glued glyph"). **Android** falls back to themed text (`SymbolView` renders blank for a bare string SF
name on Android), `themeColor="text"` (on-surface ~21:1) — **not** brand `primary` (#E91E63 on white =
4.35:1, below WCAG 1.4.3's 4.5:1 body floor; `primary` is tint-only); Add stays a **FAB**, Today is
header text. FR label is the full `Aujourd'hui` (SC 2.5.3 Label-in-Name). New i18n `calendar.today`
(FR+EN); the hand-drawn `TodayButton` + its styles removed. Encoded in `calendar.md` (nav-bar-actions
bullet). Gates green (tsc + lint + 591 Jest + coverage; `ui/` file 84% branch ≥ the 70% `ui/` floor).
**Three-reviewer panel (native/rn/a11y) all APPROVE.** **Panel caught (fixed this round):** an a11y
**BLOCKER** — the Android fallback text was brand `primary` (fails 1.4.3 contrast); a native **MAJOR** —
`hitSlop` on the 44pt frames overlapped across the gap; a Material target-size gap (48dp) + the FR
abbreviation. **Deferred to the on-device pass (device-verify, non-blocking):** (a) does `calendar` read
as "jump to today" (no SF Symbol encodes "today" — `calendar` is the most defensible generic; VoiceOver
gets the true meaning from the label); (b) `plus` vs `calendar` optical balance at 24pt; (c)
custom-`Pressable` bar-button pressed-state feedback (no native bar-item fade — matches the existing
`event-details` header pattern); (d) VoiceOver reads the nested `SymbolView`+`Pressable` as ONE stop; (e)
the Android `Aujourd'hui` on-surface color still reads as a **tappable** action (Material text buttons
normally use primary — contrast won here); (f) Android text at 200%+ Dynamic Type not clipped in the
fixed nav-bar height; (g) real painted 44/48 hit area in the nav bar. **On device:** confirm the two
top-right icons read as two distinct controls (not one blob), the `calendar` icon means "today" + the
`plus` means "add", tapping each works, and the pair looks native on both platforms/schemes.

---

## Issue 4 — Grid doesn't render under the BOTTOM liquid-glass tab bar (wasted vertical space)

**Original feedback item #2.**

> ⚠️ **This is about the BOTTOM tab bar, NOT the top nav bar.** The "liquid-glass nav bar"
> in this issue is the **`NativeTabs` bottom tab bar** (Home · Calendar · Profile —
> `src/components/app-tabs.tsx`), which on iOS 26 is a translucent Liquid Glass bar. The
> top navigation bar (month-year title, view menu, Today/Add) is **out of scope here** —
> that's Issue 3. Do not touch the top `Stack.Screen` header for this issue.

**Symptom (user):** the week/day calendar grid **stops above the bottom liquid-glass tab
bar** instead of extending underneath it, so vertical space is lost at the **bottom** of the
screen. The grid's last visible hours end above the tab bar rather than scrolling *under* the
translucent bar. Idea floated: let the grid's scroll content extend the full height (under
the bottom bar), adding an **inset so the last content can still be scrolled clear of the
bar** — the standard "content scrolls under a translucent bottom bar" pattern. **NOT** a plain
bottom margin that just re-reserves the tab-bar's height (that lands us back where we are
today). Unknown whether this is technically feasible since calendar-kit owns that scroll view.

**Where:** `calendar-screen.tsx` — the grid is wrapped in
`<SafeAreaView edges={["bottom", "left", "right"]}>` (~229), whose **bottom** edge inset is
what pushes the calendar-kit grid up **above** the tab bar (reserving the bar's space). The
grid itself is `<CalendarContainer>` + `<CalendarBody>` (~288–312). The tab bar is the
`NativeTabs` in `src/components/app-tabs.tsx` (iOS 26 Liquid Glass, translucent).

**Diagnosis / feasibility question (for the RN-code + native reviewers):**
- The goal: the calendar-kit **`CalendarBody` scroll view extends full-height under the
  translucent bottom tab bar**, with a **bottom content inset** equal to the tab-bar height so
  the last hour can be scrolled above the bar (native "scroll under the bottom bar" idiom).
- calendar-kit exposes **`insetBottom`** and **`spaceFromBottom`** props (verify their exact
  effect in the **installed** `@howljs/calendar-kit` source — `types.ts:345,736`, and how
  `CalendarBody` consumes them — the citation oracle). Determine whether `insetBottom` +
  dropping/adjusting the `SafeAreaView` bottom edge gives content-scrolls-under-the-bar with a
  clearance inset, without clipping the last events.
- The tab-bar height comes from the native tab bar; get it from the safe-area / tab-bar
  context rather than a magic number. Any change here is **device-verify** and must be
  re-proven on hardware (both platforms — Android's tab bar is opaque, so the under-the-bar
  behaviour is iOS-Liquid-Glass-specific; don't regress Android).

**Risk:** medium. Self-contained to the calendar screen's bottom inset wiring; the main
unknown is the exact `insetBottom`/`spaceFromBottom` contract and the tab-bar height source.

**Status:** ☐ open

---

## Issue 5 — Events lag on fast week-to-week scrolling

**Original feedback item #3.**

**Symptom (user):** scrolling quickly between weeks, events take a moment to appear —
presumably the DB read for the new range. **Warning from the user:** we already hit perf
issues loading *all* events; see ADR 021 + the `harden-mobile-db-seam` change before
touching this.

**Diagnosis / context:** the range follows the grid via `onDateChanged → setWindowStart`,
and the grid pre-buffers **one page on each side** of the visible window (`range` useMemo in
`calendar-screen.tsx:111–121`) precisely so an adjacent week is ready. `useCalendarEvents`
reads reactively (`useLiveQuery` over `calendar_events`, coalesced per the 2026-07-05 seam
hardening) merged with personal events, then range-filters **once**. The lag on a *fast*
multi-week fling is the buffer being outrun (you scroll past the ±1 page buffer before the
next read settles).

**Do NOT naively "load all events"** — the `harden-mobile-db-seam` amendment to ADR 021
records that a ~588-event calendar froze the app for minutes via an O(N²) per-row-change ×
synchronous whole-table re-read storm; the fix was a **coalescing reactive read**, and
range-scoping the SQL read is recorded there as the *future* escalation. Options to weigh
(with measurement, not vibes — this is the perf reviewer's domain):
- Widen the pre-buffer (±2 pages) — cheap, but re-reads more.
- **Range-scope the read in SQL** (the recorded ADR-021 future escalation) so a scroll reads
  only the needed window from `calendar_events` rather than the whole table + JS filter.
- Debounce/settle `setWindowStart` so a fast fling issues one read at rest, not one per week.

**Gotchas:** any change here must be **measured on a real dense synced calendar** (the
on-device perf pass owns the bar — `inbox/2026-06-16-calendar-low-end-android-perf.md`), and
must not reintroduce the whole-table re-read storm. Likely warrants an ADR-021 amendment.

**Risk:** high (perf-sensitive, documented past regression). Measure first.

**Status:** ◐ built + panel-passed (native/rn/a11y), awaiting device pass (2026-07-09; grouped with
Issue 6 — one root, one ship). **Root confirmed:** the diagnosis above was partly wrong — the DB read
is NOT the bottleneck (events are already all in memory, the coalesced whole-table reactive read; the
range is a JS post-filter, not a SQL scope). The lag was a **starved buffer**: the old feed
range-filtered to `windowStart −7d…+14d` (~3wk) — **narrower** than calendar-kit's OWN internal pack
window (`pagesPerSide=2` default × `defaultOffset=7` ≈ −2wk/+3wk, verified in installed source) — **and**
shifted only at settle, so the lib's forward/back buffer pages had no events fed to them until the fling
stopped. **Fix (NOT any of the three options above):** a **quarter-quantized feed window** (new pure
`data/event-window.ts` — `quarterStartMs` + `quarterWindow`), `useMemo(…, [bucketMs])` keyed on the
quarter start-ms so the feed is **referentially stable while scrolling within a quarter** — no per-settle
refilter/remap, no lib `useEffect([events])` re-pack — and a **±1-month buffer** keeps the boundary page
fed across a quarter cross. Bounds the prop to ~a quarter of events (scales) yet stays a **JS projection
width, not a SQL scope**, so the O(N²) storm cannot recur — **no ADR-021 amendment needed** (the recorded
"SQL range-scope" future escalation stays unspent). Agenda keeps its tight exact-week range. **Panel MAJOR
(native, fixed):** `setVisibleDate(new Date(iso))` fired a fresh Date per visible-column → re-rendered the
whole nav header (SwiftUI Picker + SF-Symbols) ~1/day on a fling; fixed with a **month-quantized functional
setState** (returns the prev reference within a month → React bails). **Deferred to the device pass
(panel-flagged, non-blocking):** (a) the residual mid-fling blank for a fling >3 weeks past the last settle
is **inherent** to calendar-kit's settle-gated internal re-pack (`EventsProvider` keys on `currentStartDate`,
which only advances at settle) — out of this diff's reach, don't misread as a regression; (b) the
title flips on the **active column's** day, not the majority-visible month — verify the flip-timing feels
right vs Apple Calendar. **On device (dense synced calendar):** fast-fling several weeks — events should
appear promptly (no lingering blank within ±3wk of where you land), and the month title should track the
scroll with no lag and no header flicker.

**Device-pass follow-up (2026-07-10) — the quarter feed alone did NOT fix it; `pagesPerSide` did.** iOS
dense pass: a fast multi-week fling still showed **~2s of blank grid**, then events appeared. Phase-7
diagnosis (rn-reviewer, verified in installed source) found the theory was incomplete: calendar-kit paints
events ONLY from an internal store re-packed around the **settle-driven** anchor, and "settle" is behind
**two stacked 150ms debounces that only start after the fling's MOMENTUM ends** (RN default coast ~1-2s —
no `onMomentumScrollEnd` fast-path, no `decelerationRate` prop). Mid-fling pages MOUNT (grid lines slide in)
but read the store, which is packed only over `currentStartDate ± (defaultOffset=7·pagesPerSide)` days =
**±2-3wk at the default pagesPerSide=2** — a fast fling overshoots that radius and lands on
mounted-but-eventless pages. **The wide quarter prop was orthogonal** — paint is gated by the store window,
not the prop (a full quarter's `filterEvents` is a sub-ms scan, so it did NOT trade a starve for a slow
pack; the feed fix was still correct, it just addressed a different starve). **Fix:** `pagesPerSide={4}`
(new `GRID_PAGES_PER_SIDE`, up from the lib default 2) widens the pre-pack + render-ahead to **±4-5wk** so a
typical fast fling lands inside the already-packed store and events paint the instant the page mounts —
**coupled** with `BUFFER_MONTHS 1→2` in `event-window.ts` (the prop buffer must exceed the wider pack reach
or the pre-pack re-starves at the quarter edge; raising `pagesPerSide` requires re-checking it). **Residual,
INHERENT:** the 2×150ms debounces + momentum coast are hardcoded in calendar-kit (no prop), so a fling
*beyond* ±4-5wk still blanks until it settles — only a lib fork (pack on visible-column-change / adaptive
debounce) removes that; the `pagesPerSide` bump covers the overwhelming majority of real flings. **Re-gated
green** (tsc + lint + 599 Jest + coverage). **On device (retest):** a fast multi-week fling should now paint
events on landing (no ~2s blank within ~±4-5wk); confirm the heavier per-settle pack stays smooth at ~600
events (watch for a frame hitch at the settle). If flings routinely travel farther than ±5wk, tune
`pagesPerSide` up (5-6) + `BUFFER_MONTHS` to match.

**Round 3 (2026-07-10) — device pass failed again; root cause finally mechanical; VENDOR PATCH shipped
(ADR 032).** The round-2 "settle behind two debounces after momentum ends" theory was incomplete: verified
in installed source, a Reanimated offset reaction (`service/CalendarList/index.tsx:191-197`) calls
`onVisibleColumnChanged` on **every scroll frame**, and each call unconditionally resets the 150ms settle
debounce (`useSyncedList.tsx:73-75,92`) — so during a *sustained* fast scroll (rapid successive week swipes)
the events-store anchor **freezes at the week where scrolling began** and never advances until the user
fully rests. Every packed radius is therefore a cliff (`pagesPerSide=4` moved it 3wk→5wk — it can never
remove it), and no public prop/handle reaches the mechanism (`CalendarKitHandle.setVisibleDate` writes refs
only, `CalendarContainer.tsx:515-523`). **Fix (user-approved): patch-package vendor patch**
(`mobile/patches/@howljs+calendar-kit+2.5.6.patch`, new `postinstall`; patches `src/`, which Metro runs):
(1) `useSyncedList` advances the anchor (`notifyDateChanged`) per visible-COLUMN change — a new
`lastDateChangedUnix` ref keeps the settled `onDateChanged` contract exact (else the live anchor would
swallow it and `windowStart` would never move); (2) `VisibleDateProvider`'s trailing debounce → a
leading+trailing 150ms **throttle** (re-pack ≤ every 150ms DURING the fling). `GRID_PAGES_PER_SIDE=4` +
`BUFFER_MONTHS=2` stay as coupled runway. Plus an app-side completion: `windowStart` now ALSO
advances mid-scroll on a QUARTER crossing (`onChange`, functional bail — in-quarter scrolling still never
refilters), so a no-pause fling can't outrun the fed quarter+buffer either. Gates green (tsc + lint +
600 Jest + coverage). Encoded: ADR 032, calendar.md, changelog. **Three-reviewer panel (native/rn/a11y):
no blockers; both rn MAJORs were doc-accuracy (stale ±1-month buffer line; an ineffective `isEqual`
mitigation claim) — fixed; calendar-kit pinned exact `2.5.6` + `postinstall --error-on-fail` (a patch
mismatch now fails local installs too).** Panel awareness (recorded, no change): the empty-state banner's
meaning widened with the quarter feed — it announces only when ~7 months are empty, not the visible week
(quieter on Android; copy call for a later round). **On device (retest, dense calendar):** (1) fling fast
for many consecutive weeks WITHOUT pausing — events should paint as each page lands, no cliff at any
distance; (2) watch for mid-fling frame hitches (~each 150ms re-pack: full pack + all mounted pages
re-render + a whole-snapshot deep-compare per page) — if it hitches, the levers in order are the throttle
interval (150→200-250ms), lower `pagesPerSide`, then patching the lib's snapshot compare; (3) tap Today
from months away — events should paint DURING the fly-in animation (new, was blank), no hitch.

---

## Issue 6 — Month-year title transitions too slowly when scrolling

**Original feedback item #7.**

**Symptom (user):** the nav-bar month title (`"April 2026" → "May 2026"`) takes a few
seconds to update after scrolling into the new month.

**Where:** `monthTitle = formatMonthYear(windowStart, locale)` in `calendar-screen.tsx:129`,
driven by `windowStart`, which updates via `onDateChanged → setWindowStart(...)`
(~268–270), fed into the `Stack.Screen` `headerTitle` option (~189).

**Diagnosis (to confirm):** the lag is likely either (a) calendar-kit firing
`onDateChanged` late/coarsely (only after the scroll settles, not while paging), or (b) the
`Stack.Screen` `headerTitle` option re-render lagging the state update, or (c) it being
coupled to the same read/settle cost as Issue 5. The month title should track the **visible
page** promptly — check whether calendar-kit exposes a more immediate "visible date" signal
(a scroll/visible-range callback distinct from `onDateChanged`) in the installed source.

**Gotchas:** related to Issue 5 (both are about how promptly the visible window is observed).
If you take Issue 5, evaluate whether the same visible-date signal fixes this. Updating a
`Stack.Screen` header option every frame can be its own cost — measure.

**Risk:** low-medium. Possibly a free win alongside Issue 5, or a small `onDateChanged` →
visible-date-callback swap.

**Status:** ◐ built + panel-passed, awaiting device pass (2026-07-09; shipped WITH Issue 5 — one root).
**Diagnosis (a) confirmed** as the cause: `onDateChanged` fires only at scroll SETTLE (150ms-debounced —
`useSyncedList.tsx:92-109`, installed source), and the title rode it. calendar-kit DOES expose the more
immediate signal — **`onChange`** (fires per visible-column change *during* the scroll,
`useSyncedList.tsx:83-90`). **Fix:** a separate **`visibleDate`** state fed by `onChange` drives the title;
the events feed stays on the settled `windowStart` (the decoupling the panel endorsed). The "header option
every frame" cost the gotcha warned about was **real** and caught by the native reviewer (a fresh Date per
column re-committed the native header) — fixed with the month-quantized functional setState (see Issue 5).
`goToToday` sets `visibleDate` too (agenda has no grid → no `onChange`, so that's the only path home there).
**a11y verified clean:** the native `headerTitle` is a passive label on both platforms (no live region, no
announce-on-change — react-native-screens@4.25.2 source), so per-column title churn is silent to
VoiceOver/TalkBack. **On device:** the month title should update the instant a new month scrolls into view,
no seconds-late lag.

---

## Suggested sequence & grouping

| Order | Issue | Why here | Risk |
| --- | --- | --- | --- |
| **1** | **#1 tile readability (fb #5+#6)** | self-contained, pure UI, highest payoff/risk | low |
| 2 | #2 all-day two-day span (fb #4) | correctness bug, lever already exists (`allDay`) | med |
| 3 | #3 header actions (fb #1) | design-led, may add dep/ADR, needs user choice | med |
| 4 | #5 + #6 scroll perf + month-title lag (fb #3 + #7) | **related** — both about observing the visible window; do together, measure on dense data | high |
| 5 | #4 grid under nav bar (fb #2) | feasibility-gated by the library, may be recorded debt | med-high |

Issues **#5 and #6** (fb #3 + #7) share a root — how promptly the visible window/date is
observed from calendar-kit — so tackle them as one investigation. Everything else is
independent.
