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

**Status:** ☐ open

---

## Issue 4 — Grid doesn't render under the liquid-glass nav bar (wasted vertical space)

**Original feedback item #2.**

**Symptom (user):** the week/day calendar **doesn't extend below the liquid-glass nav bar**,
so vertical space is lost. Idea floated: add **top padding inside the library's scrolling
container** (so content can scroll *under* the translucent bar and start below it) — **NOT
bottom padding** (bottom padding lands us back where we are today). Unknown whether this is
technically feasible since calendar-kit owns that scroll view.

**Where:** the `Stack.Screen` header options in `calendar-screen.tsx` (~181–200) currently
force an **opaque inline nav bar** with a code comment explaining why: a large/transparent
title needs a native `UIScrollView` to collapse against, and calendar-kit's grid is a custom
Reanimated view, so a translucent header degraded to a floating bar with the grid rendering
under the status bar. The current design **reserves** the header's space (opaque). The user
now wants the *opposite*: let the grid live under a translucent bar to reclaim the space.

**Diagnosis / feasibility question (for the RN-code + native reviewers):**
- Can calendar-kit's `CalendarBody`/`CalendarHeader` take a **top content inset / initial
  scroll offset** so the timed grid starts below a translucent header while still scrolling
  content up under it? Check the **installed** `@howljs/calendar-kit` props in `node_modules`
  (e.g. a `scrollView` content-inset / header-height / spacing prop) — citation oracle.
- If the library exposes no inset hook, the alternative is a translucent
  (`headerTransparent`) nav bar + a manual top spacer sized to the header height — but the
  original comment says that degraded on device. Any change here is **device-verify** and
  must be re-proven on hardware.

**Risk:** medium-high (fights a documented device failure mode). Investigation-first;
may conclude "not feasible with the current lib" and stay as recorded debt.

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

**Status:** ☐ open

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

**Status:** ☐ open

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
