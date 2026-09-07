# Handover — owned calendar renderer discovery

**Date:** 2026-09-07 · **Branch:** `main` · **Base:** `origin/main`
**Repo:** `/home/samuel/Projects/timecalendar` · **PR:** none

## Goal

Define the real product contract for a clean, owned React Native day/week calendar renderer before
choosing architecture or writing renderer code. The result must replace calendar-kit before the
unshipped React Native launch, be native-feeling and glance-fast, preserve correct dates/content and
complete accessibility, carry no deliberate compatibility baggage or hidden technical debt, and be
something the team is proud to maintain. Discovery succeeds when owner-facing product ambiguity is
resolved, evidence gaps are named rather than guessed, the owner approves a functional
specification, and only then can measured architecture and implementation begin.

## Current status

Owner grilling is wrapped up through Round 4. The canonical questionnaire has 280 unique rows:
190 `CONFIRMED_IN`, 50 `CONFIRMED_OUT`, five `DEFERRED`, 29 `NEEDS_RESEARCH`, and six
`UNANSWERED`. The 29 research rows are bounded evidence/engineering work, not owner guesses. The
six unanswered rows are deliberately architecture-stage decisions. No functional specification,
renderer code, native configuration change, architecture choice, commit, or PR exists yet. The
documentation changes are uncommitted on `main` at `f2b130a1`, which exactly matches
`origin/main` before the working-tree changes. Formatting, link existence, diff whitespace, row
uniqueness, and status arithmetic were verified after the edits.

## Checklist

- [x] Reconstructed Rounds 1–3 from the complete discovery evidence, questionnaire, README, and
      Round 3 audit.
- [x] Completed the Round 4 owner interrogation without asking the owner to invent measurements,
      algorithms, or repository facts.
- [x] Propagated Round 4 answers row by row into
      `docs/react-native-migration/03-owned-calendar-renderer/02-functional-specification-questionnaire.md`.
- [x] Added
      `docs/react-native-migration/03-owned-calendar-renderer/round-4-owner-answers-and-readiness.md`
      as the durable current owner-answer audit.
- [x] Updated the README, discovery evidence, and Round 3 banner so Round 3 remains historical and
      cannot be mistaken for the current 49-question backlog.
- [x] Reconciled the prior Calendar-loader, portrait-only, agenda-date, DST, all-day overflow,
      testing, and compatibility assumptions with the owner's corrections.
- [ ] **← IN PROGRESS:** obtain the owner's separate explicit authorization to create
      `03-functional-specification.md`. “Update the discovery docs” was treated as authorization to
      record Round 4, not as approval of a functional specification that does not yet exist.
- [ ] Complete pre-architecture repository research: `B-009`, `M-011`, and `M-012`.
- [ ] Obtain the privacy-safe production aggregates for `PF-006`–`PF-011` from an authorized
      execution context; derive fabricated p50/p95/p99 fixtures without event content or identifiers.
- [ ] Plan the bounded user/dogfood evidence for `U-002`, `U-005`, `U-006`, `U-008`, `U-009`, and
      `U-010`; do not block the already accepted accessibility contract on prevalence data.
- [ ] Carry device/design research for `P-004`, `PL-003`, `T-011`, `T-012`, `E-020`, and `V-009`
      into the functional/NFR/acceptance artifacts with explicit blockers where hardware or an
      implementation is required.
- [ ] Draft and obtain owner approval of `03-functional-specification.md` from confirmed product
      behavior and exclusions only. Do not insert architecture decisions.
- [ ] Write `04-non-functional-requirements.md` and `05-acceptance-plan.md`, preserving unmeasurable
      pre-implementation gates rather than fabricating results.
- [ ] After the functional specification is approved, compare architecture options and resolve
      `PF-021`, `B-006`, `B-010`, `B-011`, `B-012`, and `B-014` through evidence.
- [ ] Later, create the architecture decision and delivery plan before implementing the renderer.
- [ ] Explicitly deferred/out of scope: public npm publication and package compatibility promise;
      web; month/custom multi-day modes; Home/mini-renderer reuse; event creation, drag, resize,
      rescheduling, recurrence editing; per-event/per-calendar timezone display; routine computer
      keyboard/mouse optimization; calendar-kit fallback or dual renderer.

## Key context (non-inferrable)

### Authority and working style

- The owner explicitly requested rigorous questioning before implementation and prohibited
  inferring requirements from current React Native, Flutter, calendar-kit, old prompts, or tests.
- Flutter is historical evidence only. There is no blanket parity target with Flutter, current
  React Native, calendar-kit, or the legacy owned-renderer prompt.
- The owner corrected the one-question-at-a-time approach: multiple focused questions per batch are
  preferred. Do not restart broad grilling now; Round 4 concluded it. Ask again only if research
  exposes a genuinely new product choice.
- The OpenSpec explore stance was used: documentation and investigation only, no implementation or
  technology selection.

### Compatibility is explicitly unwanted

The strongest spoken constraint in this session was:

> “No compatibility at all. And I know AI agents LOOOOVE keeping backward compatibility. So, I
> state it again: it's totally fine to break the existant, and redo the calendar and have a broken
> calendar on main branch.”

This means:

- `CalendarEvent`, `useCalendarEvents(range)`, the renderer facade, and the Calendar implementation
  are not authoritative APIs.
- Break and replace them cleanly when architecture warrants it.
- A broken Calendar on `main` during development is acceptable because the React Native app has not
  shipped.
- Do not create adapters, shims, aliases, dual renderers, feature flags, or transitional layers to
  preserve old calendar behavior/API merely because agents usually prefer compatibility.
- Calendar-kit may be removed before the owned renderer is complete and must not ship.

### Calendar data is local; synchronization is separate

The question sequence initially assumed a distant `goToDate` might wait for network data. The owner
rejected that premise:

> “it's fetching from the device, not from network... sync is done separately from UI rendering”

The settled contract is:

- Calendar navigation reads device-local data only and never triggers synchronization.
- Date changes have no loading state. An empty local range is a real empty date.
- Initial network synchronization finishes before Calendar is made available and owns its own
  loading/failure UI.
- Routine synchronization runs in the background at app startup. Calendar shows no subtle
  refreshing state for it, keeps local events visible, and applies completed changes atomically.
- If first synchronization succeeds with zero events, day/week opens with the visible grid and a
  no-events message; agenda omits empty dates.
- A local data-store error uses the general accessible failure/retry behavior. Do not describe it as
  a distant-date network failure.

This superseded earlier `R-001`, `R-002`, and `V-014` language about a Calendar-owned initial loader
and stale/refresh status.

### Agenda and timeline share date state

- There is no explicit agenda “select date” interaction. That was an invented option and the owner
  rejected it.
- Agenda's active date is the visible date section nearest the top. “Topmost section” versus
  “nearest the top” was a meaningless distinction introduced during questioning; do not revive it.
- Timeline and agenda transfer date context bidirectionally.
- Entering agenda from the current week targets today; from another week it targets Monday.
- Returning to day uses agenda's active date; returning to week uses its containing Monday week.
- Today and deep links preserve agenda mode and scroll it to the requested section.
- Multi-day events appear in every covered agenda date section.
- Empty dates do not appear in agenda.
- Show weekends changes week mode only and never hides agenda weekend events.

### All-day overflow model

- The first proposal incorrectly put `+N` in the hours gutter. The owner corrected it with a
  concrete week example: every date column owns its own `+N` beneath visible all-day events.
- `N` is the number hidden on that date. A hidden multi-day event counts once for every covered
  date.
- Each date's `+N` is its expansion action. Activating one expands the all-day lane for the whole
  day/week.
- Collapse is global and lives by the hours gutter.
- Expanded all-day content has a bounded maximum height and its own vertical scrolling. The timed
  grid scrolls only when a gesture begins inside the timed grid.
- Any page/date or mode change lands collapsed. Expansion is never persisted.
- The accessibility tree mirrors collapsed state: visible events plus per-date “show N more”
  actions. Hidden events become navigable only after expansion. Collapsing returns focus from a
  hidden event to the relevant expansion control.
- Exact collapsed row count and expanded maximum height are design/device research. Do not ask the
  owner to invent numbers.

### Orientation, resizing, and human QA

The repository currently says:

- `mobile/app.config.ts:61`: `orientation: "portrait"`;
- `mobile/app.config.ts:74`: `supportsTablet: true`;
- `mobile/app.config.ts:77`: `requireFullScreen: true`.

The owner clarified that “tablet support” is not limited to the current full-screen portrait
configuration:

- portrait and landscape are supported on phones and tablets;
- resizable/split-screen tablet windows are supported;
- narrow space never auto-switches week mode to day; the user changes mode themselves;
- orientation/resizing preserves mode, date/week, shared zoom, and visible clock position, settles
  or cancels gestures, and atomically replaces geometry;
- native/Expo configuration changes needed to enable this are allowed and use a compatible binary
  fingerprint rather than an incompatible OTA.

The owner said this acceptance is “manual QA by human not agentic testing” and later: “yes i'll do
it.” Stable automated invariant/component tests are still welcome, but human owner QA on
representative compact/medium/expanded windows and orientations is the binding acceptance evidence.
Do not claim agent inspection or automated tests satisfy it.

### Automated gesture testing must stay useful

The owner asked, “it's hard to test gestures no?” The accepted refinement is:

- automate deterministic state, geometry, direction locking, focus, recycling, and environment
  transitions where stable;
- retain maintainable gesture smoke coverage;
- do not build brittle coordinate-heavy automation merely to claim coverage;
- human physical-device QA decides real gesture feel, two-finger pinch precedence, focal stability,
  axis arbitration, rotation, and resizing.

Gesture outcomes remain binding: two fingers give pinch precedence; one-finger movement locks to
horizontal or vertical, never both; movement beyond tap tolerance cancels an event tap.

### DST is intentionally visually simple, not logically incorrect

The owner considered special 23/25-hour DST presentation an edge case that did not justify complex
UI. After being challenged about the existing correctness/DST-fixture contract, the owner accepted:

- always draw the ordinary 24-hour wall-clock grid;
- spring-forward's nonexistent hour appears as an ordinary empty hour;
- no duplicate fall-back hour row or special DST visual explanation;
- underlying instant projection, dates, navigation, deterministic behavior, and crash resistance
  remain correct.

Do not reintroduce a complex DST visual model. Also do not interpret this as permission to place an
event on the wrong date or silently normalize invalid input.

### Event content, truncation, and accessibility

- Missing title: `(No title)` / `(Sans titre)`, following the owner's Google Calendar reference.
- Missing location: omit it. Missing/invalid color: neutral theme-safe fallback. Malformed optional
  field: omit it. Malformed required date: skip only that event and report privacy-safe metadata.
- Narrow/short tiles use normal truncation; title wins, location appears only if it fits, and full
  title/time/location remain accessible and available in details.
- The owner said: “don't overkill this feature we'll iterate after.” Do not create an elaborate
  text-fitting engine in the first delivery.
- All-day accessible names include title/fallback, all-day state, covered date/range, and location
  when present.
- Accessible zoom controls announce increase/decrease/reset and min/max limits. Visual zoom does
  not change the chronological screen-reader event representation.

### Performance and risk

- Today and arbitrary local-date navigation: correct frame within 250 ms p95, usable interaction
  within 500 ms p95.
- Cold Calendar render from local data: one second p95, subject to release baseline validation.
- No unbounded retained memory, pages, native views, semantic nodes, or recurring idle work.
- Run a 30-minute paging/scrolling/zoom/mode stress test on the non-flagship floor with battery and
  thermal observation. Numeric memory/node/idle/regression thresholds come from release evidence.
- The owner said lower-severity defects may ship “only if i approve it, but let's not take
  compromises for now. we'll see when it happens.” No lower-severity defect is pre-approved. Record
  impact/risk and obtain explicit case-by-case approval; the default is no compromise.

### Architecture questions are not owner product questions

The questioning briefly asked the owner to accept generic dependency criteria. The owner replied
“Wdym???” That question was withdrawn: selecting/qualifying Skia, Reanimated, Gesture Handler, or
another dependency is engineering architecture work. Do not make the owner choose a technology
without measured options.

The six intentionally unanswered architecture rows are:

- `PF-021`: visible work and bounded prefetch/overscan;
- `B-006`: whether/how an imperative renderer API exists;
- `B-010`: final Hermes/New Architecture constraint;
- `B-011`: Reanimated/Gesture Handler role;
- `B-012`: evidence required for a native/rendering dependency; and
- `B-014`: dependency ownership, maintenance, licensing, release, and security criteria.

### Research blockers already established

- `PF-006`–`PF-011`: the workspace can list production Kubernetes resources but cannot exec or
  port-forward into `timecalendar-production`; direct PostgreSQL access timed out. An authorized
  operator must run the already documented aggregate-only read-only SQL with a 60-second timeout,
  cohort suppression, and no event content/identifiers.
- `P-004`/`PL-003`: this host has no `adb`, attached device, iOS toolchain, or `/dev/kvm`. Current
  calendar-kit symptoms and the Galaxy A16 physical floor need actual device access.
- Release memory/frame/node/thermal thresholds cannot be honestly measured before an owned renderer
  and release binary exist.
- User frequency/source-count/input-method claims require privacy-safe opt-in dogfood/usability
  evidence. There is no React Native production population because the app has not shipped.

### Worktree gotchas

- Branch `main` and `origin/main` are both at `f2b130a1`; all owned-renderer discovery changes are
  uncommitted.
- `docs/react-native-migration/05-tech-specs/export-guides-monkified.md` is an unrelated untracked
  user file. It existed before this handover and was deliberately not read, edited, formatted,
  staged, or deleted.
- Prettier reformatted the wide questionnaire tables after row answers changed, so its diff is
  mechanically larger than the semantic edits.
- The old 172/45/5/9/49 counts remain inside explicitly historical Round 3 sections. Do not replace
  those historical snapshots. Current counts are 190/50/5/29/6 and are stated in the README,
  questionnaire header, Round 4 record, and final Round 4 evidence section.
- A pre-existing Expo development server was running as PID 93831 when this handover was created.
  This session did not start or stop it.
- The skill catalog referenced handover version `0.3.0`, which was absent; the installed
  `0.4.0` handover instructions were used instead.

## Files touched

- `docs/react-native-migration/03-owned-calendar-renderer/README.md:3` — current Round 4 status,
  document map, counts, readiness, and next-stage boundary.
- `docs/react-native-migration/03-owned-calendar-renderer/01-discovery-scope-and-evidence.md:701` —
  Round 4 evidence summary, corrections, readiness, and future ADR consequence.
- `docs/react-native-migration/03-owned-calendar-renderer/02-functional-specification-questionnaire.md:1`
  — canonical row-level answers and exact 190/50/5/29/6 audit.
- `docs/react-native-migration/03-owned-calendar-renderer/round-3-triage-and-owner-questions.md:3`
  — banner marking Round 3 counts and unanswered list as historical.
- `docs/react-native-migration/03-owned-calendar-renderer/round-4-owner-answers-and-readiness.md:1`
  — new durable owner-answer and current-readiness record.
- `docs/handovers/2026-09-07-owned-calendar-renderer-discovery.md:1` — this handover.

No application code, native configuration, ADR, OpenSpec change, or unrelated file was modified.

## How to run / verify

Run from `/home/samuel/Projects/timecalendar`.

```sh
git status -sb
git diff --check
mobile/node_modules/.bin/prettier --check docs/react-native-migration/03-owned-calendar-renderer/*.md docs/handovers/2026-09-07-owned-calendar-renderer-discovery.md
```

Verify the canonical row count and unique disposition:

```sh
awk '/^\| [A-Z]+-[0-9]+ / {if($0~/`CONFIRMED_IN:/)a++;else if($0~/`CONFIRMED_OUT:/)b++;else if($0~/`DEFERRED:/)c++;else if($0~/`NEEDS_RESEARCH:/)d++;else if($0~/`UNANSWERED`/)e++} END{print a,b,c,d,e,a+b+c+d+e}' docs/react-native-migration/03-owned-calendar-renderer/02-functional-specification-questionnaire.md
```

Expected output:

```text
190 50 5 29 6 280
```

Verify the only remaining unanswered rows:

```sh
rg -n '^\| [A-Z]+-[0-9]+ .*`UNANSWERED`' docs/react-native-migration/03-owned-calendar-renderer/02-functional-specification-questionnaire.md
```

Expected IDs: `PF-021`, `B-006`, `B-010`, `B-011`, `B-012`, `B-014`.

No application test suite was run because this session changed documentation only. The final
documentation verification before writing this handover passed: Prettier check, `git diff --check`,
relative-link existence, 280 unique table rows, and exact status arithmetic.

## Open questions

1. Will the owner explicitly authorize creation of
   `docs/react-native-migration/03-owned-calendar-renderer/03-functional-specification.md`? The
   discovery notes are ready for it, but no specification has been created or approved.
2. The six architecture-stage questions listed above remain intentionally unanswered until options
   are measured. They are not a reason for another speculative product-owner round.
3. The 29 `NEEDS_RESEARCH` rows remain open. Several require production operator access, physical
   devices, user/dogfood participation, or an implemented release renderer.
4. Exact collapsed all-day row count, expanded maximum height, zoom bounds/default, overlap density
   threshold, and contrast algorithm remain bounded design/engineering research.

No other owner-facing product question is currently known.

## Suggested next step

Open the current status and Round 4 record, then ask for the one missing authorization:

```sh
sed -n '1,120p' docs/react-native-migration/03-owned-calendar-renderer/README.md
sed -n '1,240p' docs/react-native-migration/03-owned-calendar-renderer/round-4-owner-answers-and-readiness.md
```

If the owner explicitly says to create the functional specification, draft
`03-functional-specification.md` from `CONFIRMED_IN`, `CONFIRMED_OUT`, and `DEFERRED` behavior only.
Keep the 29 research dependencies visible, keep all six architecture rows out of product behavior,
and do not implement or preserve compatibility while doing so.
