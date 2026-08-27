## Context

The four calendar-family Maestro flows assert only empty/not-found states because a fresh
e2e launch has an empty `user_calendars` table, so `useStartupSync` no-ops and nothing is
ever fetched. The server already seeds a token-addressable calendar under `NODE_ENV=test`
(`server/src/scripts/seed-e2e-calendar.ts`, `E2E_CALENDAR_TOKEN = "e2e-smoke-calendar"`,
`E2E_CALENDAR_ID = "e2e0e2e0-0000-4000-8000-000000000001"`), returned verbatim by `POST
/calendars/sync` with no external iCal fetch (fresh `lastUpdatedAt`). The one missing link
is a way for a flow to make the app **durably hold** that token so the sync fires.

The persist chain already exists and is the seam to reuse: the QR + iCal paths call
`useAddCalendar.addCalendarFromUrl` (`calendar-sources/data/user-calendars/add-calendar.ts`),
which is `POST /calendars {url}` → `GET /calendars/by-token/{token}` →
`fromCalendarForPublic(dto)` → `upsert(...)`. For an import-by-token we already hold the
token, so we skip the create-POST and go straight to resolve + upsert. The synced events
then flow through the unchanged events-source seam (`calendar/data/events.ts`
`useCalendarEvents`) into every view.

Binding rules read before designing: `testing.md` (the seeded-token deep-link E2E pattern,
the release-config dev-variant identity, the CI topology), `data.md` (the committed-client
seam, `customFetch`, the generated-hook-behind-`data/` B-1 rule), `navigation.md` (thin
route over a feature `ui/`; a deep-link target is a `Stack` sibling of `(tabs)`),
`storage.md` (the `user_calendars` durable token store + its `add-calendar.ts` shared
persist seam), and the DoD. Feature boundaries B-1…B-4 and the `data/`-only-seam rule
apply.

## Goals / Non-Goals

**Goals:**

- Give the E2E flows a stable way to make the app hold `e2e-smoke-calendar` and sync it,
  so the four flows assert **real synced data** end to end (app → generated client →
  `customFetch` → NestJS → Postgres).
- Keep the import path **dev-only at runtime** — inert and import-free in production, even
  though the route file ships in the prod bundle.
- Enrich the seed so the flows can assert: (a) a synced tile on the calendar grid, (b) a
  populated today timeline on home, (c) a stable event whose details+checklist are
  reachable by tapping a tile, (d) a stable event that can be hidden then un-hidden.
- Reuse the existing persist + sync seams (no new sync path, no new persistence path).

**Non-Goals:**

- **No production import feature.** This is not a user-facing "add by token" surface; the
  Flutter app has no such surface (R-2 — no speculative feature). The route is an E2E hook.
- **No new sync/persist mechanism.** `addCalendarFromToken` reuses `upsert` + the existing
  `useSyncCalendars`; it is a *narrower* entry to the same chain, not a parallel one.
- **No new dependency / native module / EAS-fingerprint change** (`expo-constants` is
  already a dep; the route is pure JS).
- **No change to the sync endpoint, its DTOs, or the OpenAPI spec.** Only the seeded row
  content changes on the server.
- **No dense-overlap column-packing perf assertion or frame-rate check** in Maestro (that
  stays the on-device manual pass) — the flows assert *presence and round-trip*, not layout
  fidelity.

## Decisions

### Decision 1 — A dev-only import deep link, runtime-gated on `Constants.expoConfig?.extra?.appVariant` (ADR-worthy)

**Choice.** Add a route `src/app/dev-import.tsx` reachable as
`timecalendar-dev://dev-import?token=<token>`. It reads the `token` query param and, **only
when the runtime variant is `development`**, runs `addCalendarFromToken(token)` → triggers a
sync → routes to `/calendar`. In production it renders an inert, accessible "not available"
state and imports nothing.

The runtime gate is `Constants.expoConfig?.extra?.appVariant === "development"`, backed by a
new `extra.appVariant: IS_DEV ? "development" : "production"` in `app.config.ts` (`IS_DEV`
already exists there). A tiny `src/config/variant.ts` (or `isDevVariant()` helper) is the
single read site, so the check is testable and swappable.

**Why the runtime gate is required.** The `timecalendar-dev` *scheme* is dev-only
(`app.config.ts`: `scheme: IS_DEV ? "timecalendar-dev" : "timecalendar"`), so in
production the `timecalendar-dev://…` URL is unroutable — but the **route file still ships**
in the prod bundle and is reachable as `timecalendar://dev-import?token=…`. Without a
runtime gate, a crafted `timecalendar://` link in a production build could import an
arbitrary attacker-supplied token into a user's device. The gate makes the *action* inert
in production regardless of how the route is reached.

**Why `Constants.expoConfig.extra.appVariant`, not the alternatives.**
- **`__DEV__`** — rejected: e2e builds are **release-config** dev-variant (`testing.md`),
  so `__DEV__` is `false` in exactly the build we need the import to work in. It would gate
  the import OFF in e2e. Wrong tool.
- **Sniffing the scheme (`Constants.expoConfig?.scheme === "timecalendar-dev"`)** —
  rejected: it works, but couples the security gate to a navigation string and reads as
  incidental. An explicit `extra.appVariant` states the intent (`R-1`: the meaning is
  encoded in a named field, not inferred).
- **`expo-application` bundle-id suffix (`.dev`)** — rejected: adds a read of a second
  source of truth for the same fact `app.config.ts` already computes as `IS_DEV`.

`extra` is embedded in the resolved manifest at build time and is the Expo-blessed place for
build-time constants the JS runtime needs — it is available via `Constants.expoConfig?.extra`
in both debug and release. This is the clean, explicit seam.

**Alternatives to the whole approach considered.** (a) A Maestro `inputText`/UI flow that
pastes a token into a real UI field — rejected: there is no such UI field, and adding one is
the forbidden speculative production feature. (b) Seeding the `user_calendars` row directly
via a debug MMKV/SQLite write from Maestro — rejected: Maestro can't reach app-internal
storage, and it would bypass the real resolve→upsert→sync chain we want to prove. (c) A
dev-only build-time flag stripping the route from prod entirely — rejected: Expo Router's
`require.context` bundles every `src/app/*.tsx`; conditionally excluding a route is not a
supported first-class mechanism, and the runtime gate is simpler and provably inert.

### Decision 2 — `addCalendarFromToken` is a new narrow seam beside `useAddCalendar`, reusing resolve+upsert

**Choice.** Add `addCalendarFromToken(token: string): Promise<void>` in
`calendar-sources/data/user-calendars/add-calendar.ts` (or a sibling `add-from-token.ts` in
the same sublayer). It is the resolve+upsert half of `addCalendarFromUrl` without the
create-POST: `calendarControllerFindCalendarByToken(token)` → `fromCalendarForPublic(dto)` →
`upsert(...)`. The generated-hook + resolve call stays inside `data/` (B-1). It is exported
from the `user-calendars` data sub-barrel and the `calendar-sources` feature barrel.

**Why a plain async function, not a hook.** `useAddCalendar` is a hook only because it owns
React pending/error state for the URL screens. The import route can own its own local
`{ pending, error }` and call a plain function — matching the non-hook `findAll`/`upsert`
repository style in the same sublayer. But to stay maximally consistent with the existing
seam and reuse its observability posture, the implementer MAY instead extend `useAddCalendar`
with an `addFromToken` method sharing its state — an apply-time choice; the spec requires
the resolve→upsert reuse, not a specific shape.

**Why reuse, not re-implement.** The persist chain (`fromCalendarForPublic` → `upsert` by
`id`) is the one tested durable-write path (`storage.md` `user_calendars`); a second write
path would risk fidelity drift. A failed resolve/upsert rejects so the route can surface an
accessible failure (and, on device, `recordError` through `@/firebase` consistent with the
existing persist seam).

### Decision 3 — Trigger the sync from the import route, then route to `/calendar`

**Choice.** After `addCalendarFromToken` resolves, the route calls the existing
`useSyncCalendars().sync()` (which now sees the freshly-held token and actually fetches),
then `router.replace("/calendar")`. This makes the flow deterministic: by the time the flow
asserts a seeded title on the calendar, the sync has completed (or the flow's
`extendedWaitUntil` covers the async settle).

**Alternative — rely on `useStartupSync` alone.** Rejected as the sole mechanism: startup
sync runs once at launch, before the import happens, so it would miss the just-held token
until the next cold start. Explicitly triggering a sync after the upsert removes a
launch-ordering race. (The screen a flow lands on also re-syncs on focus in the existing
design, but an explicit trigger is the robust path.)

### Decision 4 — Seed a today-anchored dense-overlap cluster alongside the existing week events

**Choice.** Keep the three existing Mon/Tue/Wed non-overlapping week events (some flows /
the week grid benefit from a full week) and ADD a today-anchored cluster on `now`'s UTC day:

- At least **two overlapping** timed events on today (e.g. 10:00–12:00 and 11:00–13:00) so
  the grid and the home mini-timeline exercise column-packing.
- One **stable, uniquely-titled** today event whose details + checklist the flows open by
  tapping its tile (deterministic ASCII-safe title, e.g. `E2E Today Lecture`).
- One **stable, uniquely-titled** today event used for the hide/un-hide round-trip (e.g.
  `E2E Today Seminar`), distinct from the details one so the two flows don't interfere.

Titles/locations stay ASCII-safe (`mobile/e2e/README.md` guidance — avoids accent-matching
fragility across platforms). `E2E_CALENDAR_TOKEN` / `E2E_CALENDAR_ID` stay constant so the
import resolves the same calendar. The UTC-anchoring arithmetic already in the file is
reused; today = `now`'s UTC day at chosen hours. The stale `calendar_flow_test.dart` /
"Flutter side seeds a matching local `UserCalendar`" docstrings are corrected — that harness
is retired and the RN import deep link is the new mechanism.

**Why anchor on today, not Monday.** `home.yaml` asserts the **today** timeline; the
existing Monday anchor is usually not today, so home would still be empty. Anchoring the
cluster on `now` guarantees a populated today view. **Why keep the week events too:** they
already anchor the week grid and cost nothing; folding them away risks under-populating the
week view. Deterministic titles are chosen so each flow asserts a title no other seeded event
shares (no ambiguous taps).

**Timezone caveat (recorded).** "Today" is computed in **UTC** on the server (CI runs
server and device in UTC, matching the existing seed's UTC arithmetic). On a developer
machine whose local day differs from UTC near midnight, the device's `isToday`
(local-time) could disagree with the seed's UTC "today" — a known local-run edge, not a CI
concern. Recorded so it isn't mistaken for a flake.

### Decision 5 — Maestro selector strategy: assert/tap synced tiles by seeded title text

**Choice.** Calendar-kit grid tiles render the event `title` (and `location`) as visible
text but carry **no per-event testID** (the grid owns tile layout); Maestro taps by text.
So:

- **Calendar grid:** assert a seeded title is `visible`, then `tapOn: text: "<seeded
  title>"` to open details. Assert the details screen shows the real title / a content line
  (not the not-found message).
- **Home timeline:** the home tiles DO expose `testID="today-tile-${id}"` and render the
  title text; assert the seeded today title is visible (and optionally tap by title to open
  details).
- **Hidden-events:** open a synced event's details, use the header hide action (a native
  `Alert` chooser — tap the localized "hide this event" option), assert the title is gone
  from the calendar/home views, then open `timecalendar-dev://hidden-events`, assert the
  title is listed, tap un-hide, and assert it reappears.
- **Checklists:** open a synced event's details, tap `testID="checklist-add"`, type into
  `testID="checklist-input-*"` (the row testID is uuid-suffixed — assert the typed content
  is visible rather than matching the dynamic id), toggle via `testID="checklist-check-*"`,
  and delete via `testID="checklist-remove-*"`. Because these ids are uuid-suffixed and
  Maestro can't template a runtime id, the flow asserts by the **typed content text** and
  uses index-based `tapOn` where a testID prefix isn't matchable — the add button
  (`checklist-add`) has a stable id.

**Stable testIDs added where needed (additive, no behaviour change).** If a text tap proves
ambiguous or a needed anchor is missing, add stable testIDs — candidates: a
`calendar-empty` marker on the empty state (so a flow can assert the *non*-empty transition),
and a stable container id if a title text match is not unique enough. The Alert-based hide
chooser is localized text the flow taps by (FR+EN parity already exists for
`eventDetails.hide.*`). All new selectors stay cross-platform (localized text or
platform-neutral testIDs), preserving the `stopApp`→`openLink` cold-start idiom and generous
`extendedWaitUntil` timeouts.

**Why not add per-tile testIDs to the calendar grid.** The grid tile is rendered inside
`@howljs/calendar-kit`'s `renderEvent`; the outer positioned wrapper is the library's. We
could wrap each tile in a testID'd `View`, but text assertion is sufficient and avoids
touching the seam's render contract — R-2 (don't over-engineer past the need).

### Decision 6 — Import order & PR split: land the seam + `calendar.yaml` first (1 PR of the seam, 1 PR of the rest)

**Recommendation: two PRs.** The issue explicitly invites splitting per-flow if seeding
lands separately.

- **PR 1 — the seam + anchor proof.** Server seed enrichment (Decision 4) + the dev-import
  deep link (Decisions 1–3) + `addCalendarFromToken` + the shared `import-seed.yaml`
  subflow + **`calendar.yaml`** rewritten as the anchor round-trip (import token → synced
  tile renders → tap → real details). This is the load-bearing half: it proves the whole
  mechanism (import → sync → render → tap) works on both platforms in CI. If PR 1 is green,
  the pattern is validated.
- **PR 2 — the remaining three flows.** `home.yaml`, `event-checklists.yaml`,
  `hidden-events.yaml` rewritten on top of the now-proven preamble, plus the Architecture
  Book / ADR / changelog documentation finalization.

This keeps each PR's `run-e2e` CI cost focused and lets the anchor prove the seam before the
three dependent flows pile on. A single PR is acceptable if the implementer prefers one
`run-e2e` cycle, but two is recommended to de-risk the anchor first. The `tasks.md` phases
map to this split.

### Decision 7 — Retry only a fresh, current-flow iOS app-process `SIGSEGV(11)` within the existing attempt bound

**Choice.** Extend the existing per-flow retry classifier rather than adding a second loop
or changing CI. Immediately before each Maestro attempt, capture an attempt-start timestamp.
If that attempt fails and a booted iOS simulator is available, query its unified log from
that timestamp forward, filter to the TimeCalendar development app identity
(`fr.samuelprak.timecalendar.dev` and its app process), and save the result beside the
Maestro output as a flow-and-attempt-specific simulator log. A retry is eligible when that
fresh log positively reports the app process exiting with `SIGSEGV(11)` during the failed
launch/relaunch.

The SIGSEGV classifier runs before interpreting the visibility assertion that Maestro emits
after the process has already died: that assertion is a consequence of the proven launch
death, not an independent product assertion. If no fresh app-specific SIGSEGV evidence is
present, the existing XCTest transport classifier applies unchanged, including its
assertion-evidence exclusion. Everything unmatched is terminal.

The retry consumes the same `--startup-attempts` budget already configured per flow and
starts a fresh `maestro test <flow>` process. The server remains single-lived. When the last
allowed attempt also has the signal, the harness returns that final failed attempt's nonzero
status and does not run later flows.

**Freshness and attribution are part of the safety boundary.** Classification reads only
the simulator-log result queried for the current flow and current attempt after its recorded
start. It never scans the persistent Maestro log root, a prior attempt's simulator log, or
another flow's artifacts. The query must match the TimeCalendar dev app identity as well as
`SIGSEGV(11)`; a crash from SpringBoard, Maestro, XCTest, or another process is not eligible.
If simulator log collection is unavailable, fails, or produces an unfamiliar shape, the
failure remains terminal.

**Why this is a leaf harness refinement, not an architecture-rule change.** The existing
rule remains bounded startup recovery with fresh Maestro processes and fail-closed unknown
classification. Exact-head evidence identifies this app-process death as an intermittent
iOS release-simulator launch failure before the import request, while multiple earlier
flows in the same job complete the real seeded round-trip. The refinement adds a second
positive startup signal; it does not retry arbitrary app crashes, weaken assertions, alter
timeouts, or change the server → client → SQLite proof.

**Alternatives considered.** Retrying every failed visibility assertion was rejected
because it hides real data and navigation regressions. Scanning all simulator history or
reusing an old crash artifact was rejected because stale or cross-flow evidence could make
an unrelated failure retry. Raising the attempt ceiling or timeout was rejected because
neither classifies the process death. Editing `.github/workflows/` or `ci/` was rejected:
the harness already receives the bounded attempt count and can inspect the booted simulator
without a pipeline change.

## Risks / Trade-offs

- **[Prod route reachable via `timecalendar://dev-import`]** → The runtime variant gate
  (Decision 1) makes the action inert in production; the route renders a "not available"
  state and performs no import/network call. A unit test asserts the production branch never
  calls `addCalendarFromToken`. The gate, not the scheme, is the security boundary.
- **[Calendar-kit tiles have no stable testID → text-tap fragility]** → Assert/tap by
  **unique** seeded titles (Decision 4 gives each flow its own title); ASCII-safe text
  avoids cross-platform accent issues. Add a `calendar-empty` testID so the empty→populated
  transition is assertable deterministically.
- **[Sync timing race: flow asserts before sync settles]** → The import route explicitly
  triggers `sync()` after upsert (Decision 3) and the flows keep generous
  `extendedWaitUntil` timeouts (60s, as today) around the first synced-title assertion.
- **[Today-anchored "today" is UTC; local-run midnight edge]** → Recorded (Decision 4);
  CI is UTC end-to-end so it's deterministic there. A `mobile/e2e/README.md` note flags the
  local edge.
- **[Checklist/hide round-trips mutate the shared seeded DB / device state within a run]** →
  The checklist writes go to device-local SQLite (`checklist_items`), not the server, so they
  don't disturb the seeded server rows; the hide/un-hide flow un-hides at the end
  (idempotent, restores state). Flows are ordered-independent because Maestro cold-starts
  (`stopApp`) each flow, but each flow leaves device state as it found it where practical.
- **[E2E is only fully verifiable on device]** → CI `ci-mobile-e2e.yml` runs both platforms;
  locally we prove `addCalendarFromToken` + the variant gate in Jest and typecheck/lint. The
  verification plan is explicit in tasks.md. **This is the honest boundary, not a gap.**
- **[Only run-e2e-labelled PRs run the flows]** → Both PRs must carry the `run-e2e` label to
  exercise the change's core proof in CI before merge (main always runs it on mobile changes,
  but pre-merge needs the label). Called out in tasks.md.
- **[A stale crash could mask a real assertion]** → Record the attempt boundary before
  launching Maestro, query only the current simulator window, persist per-flow/per-attempt
  evidence, and never scan earlier artifacts. Filter to the dev app plus `SIGSEGV(11)`.
- **[Unified-log collection is unavailable or changes shape]** → Fail closed: retain the
  original Maestro exit and do not retry. No broad fallback classifier is permitted.
- **[A repeated simulator crash consumes CI time]** → Reuse the existing maximum of four
  attempts; exhaustion stays red and later flows do not run.

## Migration Plan

No runtime migration — no schema change, no new native module, no EAS-fingerprint bump. The
dev-variant e2e binary is rebuilt every CI run via `expo prebuild`, so the new
`src/app/dev-import.tsx` route ships automatically; no separate rebuild step is required.
The SIGSEGV recovery is shell-harness-only and needs no workflow or `ci/` change. Rollback
is a straight revert (the prod app is unaffected — the route is inert there, and no
API/schema changed).

## Open Questions

- **(For the founding engineer)** Confirm the two-PR split vs. one PR. Default: two PRs
  (seam+calendar anchor first). Non-blocking — tasks.md is phased either way.
- **(For the founding engineer)** Any objection to a small `extra.appVariant` field in
  `app.config.ts`? It's the cleanest runtime variant read (Decision 1); alternative is
  scheme-sniffing. Default: add `extra.appVariant`.
- **(Non-blocking)** Whether to fold the existing Mon/Tue/Wed week events away or keep them
  (Decision 4 keeps them). Default: keep — zero cost, week grid stays populated.
