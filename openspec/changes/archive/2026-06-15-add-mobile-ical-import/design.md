## Context

Phase 03 roadmap ship 4 of 5: add a calendar by **pasting an iCal URL**. The prior ships
landed the onboarding welcome surface (`add-mobile-onboarding-flow`, ADR 015), the school
picker (`add-mobile-school-picker`, ADR 016), and the QR scanner — the **first** input
method of the "add a calendar source" cluster (`add-mobile-qr-scan`, **ADR 017**). ADR 017
D3 already decided this cluster (QR · iCal · durable persistence) lives in **one**
`src/features/calendar-sources/` folder and that ships 4/5 grow it by adding **sublayers,
not folders**. This ship is that growth: the **second input surface**, the `POST /calendars`
create flow ADR 017 named as "ship 4's `POST /calendars` is the real validator."

**What the Flutter app actually does (read before designing —
`app/lib/modules/import_ical/`):**

- `import_ical_screen.dart` shows a screen with two affordances: `ScanQrCode` (ship 3's QR
  path) and `AskForIcalUrl`. **`AskForIcalUrl` is a single `TextField`** in a dialog —
  "Entrez l'URL de votre calendrier" — with Cancel / Import. **URL-only. There is no file
  picker** anywhere in the module.
- On Import, `onSubmit(text)` → `useImportIcalController.loadIcalUrl(url)`:
  - `ref.read(apiClientProvider).calendarsApi().createCalendar(CreateCalendarDto(url:
    url.trim(), schoolId, schoolName, name))` → `POST /calendars` → the **server** returns
    `CreateCalendarRepDto { token }`.
  - `calendarCreationServiceProvider.loadCalendarFromToken(token)` → navigate to the tabs.
  - **On error** (`catch`): logs the failure (`AppLogger.error('Failed to import iCal
    calendar', …)`) and shows a context-aware error dialog ("we couldn't import your
    timetable… check the URL and try again").

**Therefore:** iCal import is a **server POST of the URL**, not a client-side `.ics` fetch/
parse. The server owns parsing; the client posts `{ url }` and gets `{ token }`. This is the
exact create flow ADR 017 said QR and iCal share. The mobile generated client **already**
exposes it (`src/api/generated/calendars/calendars.ts` →
`useCalendarSyncControllerCreateCalendar`, `CreateCalendarDto`, `CreateCalendarRepDto`) — no
OpenAPI regen needed.

Constraints inherited from the Architecture Book: golden-path feature-module pattern (ADR
014); `data/` is the only generated-hook import site (B-1); the single `customFetch` mutator
+ TanStack Query + accessible loading/error/retry (`data.md`); pure validators returning
**localizable keys not sentences** (`personal-events/form/validate.ts`); i18n FR/EN parity +
no-literal-strings; a11y on touchables + accessible async status; `@/firebase` `recordError`
for failures; mock-at-the-`customFetch`-seam testing (`testing.md`); the K-3 90/70 coverage
split.

## Goals / Non-Goals

**Goals:**
- A pure, 90%-gated **URL validator** (`data/validate-url.ts`) returning a localizable error
  key (`null` when valid) — mirroring `personal-events/form/validate.ts`.
- A **`data/create.ts`** create-calendar layer — the feature's **first** generated-hook
  import site (B-1) — wrapping `useCalendarSyncControllerCreateCalendar` over `customFetch`,
  posting `{ url }`, returning `{ token }` + TanStack state flags.
- A **URL-entry screen** with a labeled `TextInput`, submit control, and accessible
  loading / server-error-with-retry states; inline validation error; reuse of ship 3's
  `ScannedCalendarSource` + ephemeral holder for the success handoff.
- **Onboarding reachability**: a thin `src/app/onboarding/ical-url.tsx` route + a welcome
  "add by URL" CTA (the accent-border pattern ship 3 established next to "scan a QR code").
- A **create-failure** path through `@/firebase` `recordError` (observability ✅).
- FR + EN i18n; a Jest proof at the `customFetch` seam; `features.md` / `data.md` /
  changelog updates. **No new ADR** (growth within ADR 017 D3).

**Non-Goals:**
- **No file picker / `expo-document-picker`** — Flutter `import_ical` is URL-only; file-pick
  is deferred (recorded debt below). Adding a native dep for a path Flutter doesn't have is
  the speculative scope R-2 forbids.
- **No client-side `.ics` fetch/parse** — the server owns parsing (Flutter parity); the
  client posts the URL.
- **No durable `user_calendars` token store / schema** — ship 5 (the Phase 09 migration
  target). The success handoff stays in ship 3's **ephemeral** holder.
- **No calendar load / `findCalendarByToken` / `loadCalendarFromToken`** — the post-create
  calendar materialization belongs to the durable-store + calendar-render ships, not this
  input surface. This ship's job ends at "URL → server create → token in the ephemeral
  holder."
- **No `schoolId`/`schoolName`/`name` enrichment** — the Flutter call passes the onboarding
  school/grade context; those come from the (not-yet-built) durable selection state. This
  ship posts `{ url }` with `customData: null` (the DTO requires `customData`; everything
  else is optional). Enrichment is layered in when the durable school/calendar state exists
  (recorded below).

## Decisions

### D1 — Server POST of the URL, not a client-side `.ics` parse (Flutter parity)

The import is a **`POST /calendars { url }` → `{ token }`** server round-trip, exactly as
Flutter's `loadIcalUrl` does. The server fetches and parses the `.ics`; the client only
submits the URL and receives a token. Alternatives weighed:

1. **Server POST via the generated mutation** *(chosen)* — matches Flutter, keeps `.ics`
   parsing server-side (one parser, server-owned, already battle-tested by the Flutter app),
   and reuses the **already-committed** generated client. The `data/` layer is the only
   generated-hook import site (B-1), like `school-selection/data/`. Minimal, faithful.
2. **Client-side `.ics` fetch + parse** *(rejected)* — would need an iCal parsing library
   (a new dep), duplicate the server's parser, handle redirects/auth/encoding edge cases on
   device, and **diverge from Flutter** for no benefit. The server already does this; the
   token is the durable artifact. Speculative complexity (R-2).

No OpenAPI regen is needed — `POST /calendars` is in the committed spec and generated client.
If a future server contract change adds fields, that is a separate generated-client regen
(out of scope; flagged: this ship designs against the **existing** committed contract).

### D2 — The create layer: `data/create.ts`, the feature's first generated-hook site (B-1)

`data/create.ts` wraps the generated `useCalendarSyncControllerCreateCalendar` — the **only**
place in `calendar-sources` that imports `@/api/generated/**` (B-1, the data/-only-seam rule;
mirrors `school-selection/data/queries.ts`). It exposes a thin `useCreateCalendar()` returning
a `createCalendar(url): Promise<{ token }>` (resolving `CreateCalendarRepDto.token`) plus the
TanStack mutation state flags (`isPending`, `isError`, `reset`) the screen renders. The DTO is
built here: `{ url: url.trim(), customData: null }` (`customData` is required-nullable in
`CreateCalendarDto`; `schoolId`/`schoolName`/`name` are optional and omitted — see Non-Goals).
Keeping the DTO assembly in `data/` keeps the screen free of generated types (B-1).

Why a mutation (not a query): create is a write with side effects; TanStack `useMutation` is
the right primitive (the generated client already provides it), and it gives the screen the
pending/error states `data.md` requires for accessible async status.

### D3 — A pure URL validator returning a localizable key (mirror personal-events/form)

`data/validate-url.ts` exports a pure `validateIcalUrl(raw: string): string | null` — `null`
when the URL is acceptable, else a **localizable error key** (e.g.
`"calendarSources.icalUrl.error.empty"` / `".error.invalid"`), never a sentence. The screen
maps the key through `t()`. This mirrors `personal-events/form/validate.ts` (pure, no `t()`,
returns keys). The validator:

- trims; empty/whitespace → `"…error.empty"`.
- accepts `http://` / `https://` URLs; normalizes `webcal://` → `https://` is **out of scope
  here** — the URL the user pastes is posted as-is after trim (Flutter posts `url.trim()`
  verbatim; the QR parser owns the `webcal` rewrite for scanned values). The validator only
  gates obviously-bad input (empty, non-URL) so the screen gives immediate feedback; the
  **server `POST /calendars` is the authoritative validator** (a syntactically-fine URL that
  isn't a real `.ics` fails server-side → the create-error path, D5).
- non-http(s) → `"…error.invalid"`.

90%-gated, fully unit-tested (valid http/https, empty, whitespace, non-URL, trimming).
**Deliberately lenient** — it is a UX pre-filter, not the real validator (the server is). This
is the faithful-Flutter posture: Flutter has *no* client validation at all (it posts whatever
is typed); we add a minimal pre-filter for accessible immediate feedback without diverging on
what's actually accepted.

### D4 — Reuse ship 3's `ScannedCalendarSource` + ephemeral holder for the success handoff

ADR 017 D3/D7 built `ScannedCalendarSource` (`{ url }`) and the ephemeral in-memory holder
(`data/scanned-source.ts`) explicitly as "the seam ship 5 swaps for the durable store," and
named the holder for the **concern** ("scanned source" is the ship-3 name for what is really
"a calendar source the user added"). iCal URL entry produces the same primitive (a calendar
URL → a token). **Decision: on a successful server create, stash the same
`ScannedCalendarSource { url }` into the same `setScannedSource` holder** (the trimmed URL),
so QR and URL converge on one ephemeral handoff ship 5 replaces wholesale. The **token** is
the new artifact this ship produces; for this ship it is confirmed to the user and (in the
ephemeral handoff) discarded after display — ship 5 is what makes the token durable, so
threading a token field through the ephemeral holder now would pre-empt ship 5's schema.

*Considered & rejected:* a separate `imported-source.ts` holder for URL entry — fragments one
concern into two ephemeral seams ship 5 would then have to merge; the holder is already named
generically and the source shape is identical (R-2). *Considered:* extending the holder to
carry `{ url, token }` now — deferred to ship 5 with the durable schema (D from Non-Goals), so
this ship doesn't guess the token's persisted shape. The holder keeps its ship-3 `{ url }`
contract; the create seam resolves the token (a ship-5 forward seam), but this ship neither
displays nor persists it — on success it stashes `{ url }` into the ephemeral holder and dismisses.

### D5 — Create-failure path → `@/firebase` `recordError`; observability ✅

iCal import is the **second** calendar-sources surface that can fail (after the QR scan throw).
Two failure classes, distinguished like ship 3's recoverable-vs-crash split:

- **Invalid URL (client pre-filter)** → the validator returns a key; the screen shows the
  **translated inline error** and does not submit. Recoverable, user-correctable — **NOT**
  `recordError`'d (noise avoidance, mirroring "non-calendar QR").
- **Server create failure** (`useMutation` rejects — network down, server error, the URL
  isn't a real `.ics`) → recorded through `@/firebase`
  `recordError(error, "calendar-sources/ical-import")` **and** surfaced as an accessible
  error state with a **Retry** control (re-runs the mutation; `data.md`'s accessible
  loading/error/retry, like school-selection's `isError`). This is a genuine failure the user
  can't fix by editing input (the URL is syntactically fine), so it's both recorded *and*
  retryable — Flutter logs it (`AppLogger.error`) and shows the error dialog; we do the
  modular equivalent. Observability is **✅ wired**, not N/A.

The screen never imports `@react-native-firebase/*` directly (the `@/firebase` seam; B-1/B-4).

### D6 — URL-entry screen UX (native-correct, accessible), reachable from onboarding

A presentational screen (`ui/ical-url-screen.tsx`, 70% floor): a `ThemedText` title + helper,
a **labeled `TextInput`** (RN-core, never `allowFontScaling={false}`; `accessibilityLabel` +
the URL keyboard type / `autoCapitalize="none"` / `autoCorrect={false}` / `keyboardType="url"`
— native-correct for URL entry), and a submit `Pressable` (role + translated label + ≥44pt/48dp
target via `hitSlop` + `minHeight`, reusing the accent-border CTA pattern). Async states:
`isPending` → an accessible "importing…" live region with the submit disabled; `isError` → an
accessible alert + a Retry control; success → confirm the imported URL and dismiss
(`router.back()`) after stashing into the ephemeral holder. All copy via `t()`.

Reachability: a thin `src/app/onboarding/ical-url.tsx` re-exports the screen through the `ui/`
sub-barrel (route-structure rule; no colocated test under `src/app/`); it is a `Stack` sibling
under the existing `src/app/onboarding/_layout.tsx`, reachable via
`router.push("/onboarding/ical-url")` from a new welcome-screen "add by URL" CTA placed beside
the existing "scan a QR code" CTA (same accent-border contrast posture — ADR 015 / tokens.ts
white-on-brand rule; no `primaryStrong` token added, R-2).

## Risks / Trade-offs

- **The create round-trip can't be reliably Maestro-driven** → a real `POST /calendars`
  needs a reachable, parseable `.ics` the dev harness doesn't seed; a live external `.ics`
  is flaky cross-platform. **No Maestro flow for the import round-trip** — the
  validate→create→handoff wiring is proven at the Jest/component level (mock the `customFetch`
  mutator, drive the real generated mutation + a real `QueryClient`; `testing.md`). A light
  Maestro step asserts the URL-entry screen **renders + reachable from onboarding + inline
  validation on empty submit** (deterministic, no network); the actual import + a11y +
  observability is an **inbox/DoD on-device pass**. Same posture as ship 3's camera.
- **No file-pick** → recorded debt (below); Flutter parity is URL-only, so this is faithful,
  not a gap. The day a file path is genuinely needed it earns `expo-document-picker` + an ADR.
- **Lenient client validation** → the validator is a UX pre-filter; the server is the real
  gate. A URL that passes the pre-filter but isn't a real `.ics` surfaces as the
  create-error+retry path (D5) — the intended, Flutter-faithful behavior (Flutter has no
  client validation at all). Recorded so a reviewer doesn't expect the validator to reject
  non-`.ics` URLs.
- **No school/grade enrichment on the DTO** → this ship posts `{ url, customData: null }`
  only; the Flutter call also passes `schoolId`/`schoolName`/`name` from onboarding state.
  Those need the durable selection/calendar state (ship 5 / later) — wiring them now would
  couple this input surface to state that doesn't exist yet (R-2). Recorded so the enrichment
  is added with the durable store, not retro-fitted into this screen.
- **Ephemeral handoff is throwaway** → the success stashes `{ url }` into ship 3's in-memory
  holder, replaced by ship 5's durable token store; intended (the ship boundary), labeled in
  code, a plain revert if ship 5 reshapes it. The create seam resolves the token (a ship-5 forward
  seam), but this ship neither displays nor persists it.

## Migration Plan

Additive, no schema/data/native changes (no new dep, no `app.config.ts`/babel touch — the
generated client and `customFetch` already exist). Deploy = land the change. Rollback = plain
revert (remove `data/{create,validate-url}.ts` + their tests + the screen + route + welcome
CTA + i18n keys + docs); nothing persisted, no schema, no fingerprint change (no native dep),
so this ship is OTA-safe. The create mutation rides the existing `QueryClient` /
`PersistQueryClientProvider`; `POST /calendars` is a write — it is **not** added to the
offline-persist `shouldDehydrateQuery` set (only the schools/groups reads are persisted, per
ADR 013).

## Open Questions

- **Should `webcal://` typed into the URL field be normalized like the QR parser does?** The
  QR parser (ship 3) rewrites `webcal://` → `https://`; the typed-URL path posts `url.trim()`
  verbatim (Flutter parity — Flutter posts whatever is typed). Resolved: **post verbatim**;
  if users paste `webcal://` and the server rejects it, fold the QR parser's rewrite into the
  validator/create layer behind the seam (a one-line change). Recorded so it isn't tightened
  prematurely.
- **File-pick (`expo-document-picker`)** — not in Flutter `import_ical`; deferred. **Trigger
  to revisit:** a product need for importing a local `.ics` file (not a URL) — that earns the
  native dep + an ADR (file → either client-parse or multipart upload, a real contract
  decision). Recorded as debt.
- **DTO enrichment (`schoolId`/`schoolName`/`name`)** — deferred until the durable selection/
  calendar state exists (ship 5 / later). This ship posts `{ url, customData: null }`.
