# Architecture Book changelog

## 2026-08-30

- Added the two-calendar real-server Activity fixture rule: establish a server read watermark, then add exactly 52 unread rows across the fixed 50-row page boundary. Recorded positive-first selectors and the no-KVM split between local integration/syntax evidence and post-merge native CI.
- Added the AA-verified `positive` and `informational` semantic status tokens, the thin root
  `/activity` route and grouped cached timeline, and the Settings Activity entry with a reactive
  unread badge. Ticket 5 owns user-driven refresh/pagination and cache-bounded read marking;
  screen-open, foreground, push, and post-sync triggers remain Ticket 6's boundary.
- Promoted three load-bearing calendar naming/import rules to indexed records: ADR 050 makes token
  possession the complete shared rename capability and accepts last-write-wins; ADR 051 preserves
  Flutter compatibility by keeping `/v1` controller-local rather than enabling global NestJS
  versioning; ADR 052 keeps eventual name convergence narrow and separate from event replacement so
  sync cannot overwrite the client-only `visible` flag. The binding rename and convergence rules in
  `features.md` now link to ADRs 050 and 052, and the path-level versioning rule in `data.md` links
  to ADR 051; the ephemeral import draft remains separately recorded in ADR 047.
- Wired every Activity trigger into the ADR 048 seam and recorded the wiring as **ADR 049**
  (TIM-399). The trigger table is now: pull-to-refresh and a relevant `calendar_changed` /
  `calendar_digest` push and a successful calendar sync **force** a refresh; opening the
  Activity screen and returning to the foreground refresh **passively**, which the seam
  answers for free inside the persisted five-minute window; cold launch gets **no code** —
  the startup sync's post-storage refresh is its trigger, so an offline cold launch issues
  nothing, by design rather than by omission. Foreground means `background → active` only:
  iOS raises `inactive → active` for a notification-shade pull or an incoming call, and
  neither is a return to the app (decisions/049, calendar.md, features.md).
- Recorded the rule that makes **a calendar-sync success stay a success**: silent host/runtime
  edges (sync, push and foreground) fire an unawaited `void refreshNewestPage(...)` with no
  `catch` and no outcome inspection. An Activity failure therefore cannot reach sync's
  `isError` — `refreshNewestPage` never rejects (ADR 048), and sync never reads its
  `{ status: "failed" }` outcome. The Activity screen is the deliberate exception: screen open
  and pull-to-refresh await and expose the shared outcome so failures can be shown over cached
  content. The distinction reads like an omission at the silent edges, which is why it is
  written down (decisions/049, calendar.md).
- Amended **ADR 028**: notification receipt now fans out to **two independent** cross-feature
  seams — the calendar sync and the Activity refresh — with the Activity call deliberately not
  chained onto the sync's promise, so the push guarantee survives a sync that fails. It is
  gated on the message **action**, not on `parseNotificationRoute(…) !== null`: a
  `calendar_changed` with an undecodable `payload` is still a real calendar change, so routing
  declines to navigate while Activity still refreshes. The routing decision itself is unchanged
  (decisions/028, firebase.md).
- Added lint boundary **B-6** (`timecalendar/calendar-sources-is-a-leaf`): calendar-sources may
  not import `@/features/activity`, because the Activity data layer imports calendar-sources and
  the reverse edge closes a module require cycle whose failure mode under Metro is an `undefined`
  binding at module init — invisible to `tsc` and to `boundaries`. The removal prune is inverted
  rather than banned outright: `useActivityOwnershipPrune` observes the held-calendar set from the
  Activity side. Carried with it, the caveat the config cannot state: **a flat-config block that
  ADDS a ban must re-call `restrictedImports([...])`**, because flat config replaces rule options
  rather than merging them — a block listing only its own pattern would silently switch every
  base seam ban off for that directory with lint still green, so a green lint run does not prove
  such a block works (lint-format.md).
- Corrected a false sentence in calendar.md rather than inheriting it: sync does **not** run at
  foreground/resume. `AppState` is wired in exactly two places in `mobile/src`, and neither
  triggers a calendar sync. TIM-399 added the second of them for Activity only (calendar.md).

- Recorded the calendar rename surface and, load-bearing, the rule that the sync path
  converges calendar names through the narrow `updateName(id, name)` write and must never
  `upsert` a `user_calendars` row or route through `fromCalendarForPublic`, which hard-codes
  the client-only `visible: true`. A full-row write there would silently unhide a hidden
  calendar on every sync; no lint rule or type can express "this write must stay narrow", so
  it is prose (R-1). Also recorded that rename persists the name the **server** returned
  rather than the typed input (that is what makes two devices agree), that the event replace
  and the name write-back are deliberately two failure domains, and that every calendar-name
  label goes through `effectiveCalendarName` with the "My timetable" / "Mon emploi du temps"
  fallback — a display substitution that never rewrites the stored value (features.md).
- Recorded the institution → programme → Connect → manual-import journey and its ephemeral,
  Stack-scoped import draft as **ADR 047**. The draft is held in React state behind a provider
  mounted once on `src/app/onboarding/_layout.tsx` — never MMKV, never SQLite, no new global
  store — so "leaving the journey clears it" and "a restart clears it" are properties of where
  the provider lives rather than code that can be forgotten. The read hook is total: outside the
  provider it returns "no draft", which _is_ the contract for the deep-linkable QR and iCal-URL
  routes (`name: ""`, `schoolName: ""`), not an error (navigation.md, features.md, decisions/047).
- Required calendar creation to send **exactly one** institution representation, by key absence:
  a listed draft sends `schoolId` with no `schoolName` key, an unlisted draft the inverse. The
  server validates the pair with mutually exclusive `@ValidateIf` conditions, so a body carrying
  both keys is rejected even when one is `undefined`. The derivation is one pure function and the
  create seam takes the fields as a parameter, so the wire shape is provable without React
  (features.md).
- Extended that same `effectiveCalendarName` rule to the event-details calendar label, the one
  name surface the rename work did not reach — the measured reason it is a rule rather than a
  preference is that 119 511 of 444 028 live calendars hold whitespace-only names and `" "` is
  truthy, so `name || fallback` rendered a blank value under the "Calendar" label (features.md).
- Extended the `/feedback` route's bounded optional parameters with `calendarName`, the normalized
  programme name from a failed import, omitted when empty. `gradeName` stays unsent: "formation" is
  a programme of study, not a grade (navigation.md, features.md).

- Added the Activity refresh coordinator — the single bounded fetch and pagination seam every
  Activity trigger shares — and recorded two decisions in **ADR 048**. First, **single-flight is a
  module-level promise, not TanStack Query**: the callers (calendar sync, the push handler, the
  app-lifecycle listener) are plain modules where a hook is uncallable, `fetchQuery` dedup would
  write to the query cache Activity must stay out of, and the five-minute freshness clock must
  survive process death, which an in-memory `dataUpdatedAt` does not. The newest and older pages
  hold independent slots, so a backfill can neither block nor be blocked by a forced refresh.
  Second, **no Activity request is issued with a token count outside 1–100, on either path**: the
  server short-circuits an empty token array before it distinguishes a first page from a following
  page, so a zero-token request is a deliberate `200` that clears the unread badge on the newest
  page and **permanently** sets `olderPageComplete` on the older page — neither recoverable by any
  later refresh. The guard belongs on the request precondition and nowhere else; suppressing
  `nextCursor: null` instead would restart pagination forever at the end of history (data.md,
  features.md, ADR 048).
- Added **B-5**, the Activity seam boundary: only `src/features/activity/data/**` may import
  `@/api/generated/calendar-logs/**` or the `activityLogs` / `activityState` bindings from `@/db`.
  B-1 does **not** already give this — B-1 is _sublayer_-scoped, so it permits any feature's
  `data/` to issue calendar-log requests; a single-feature restriction is not expressible in
  `eslint-plugin-boundaries` against a file inside one element. Implemented with the existing
  `no-restricted-imports` seam-ban idiom (`banActivitySeam`, mirroring `banCalendarKit`), the table
  half using `paths` + `importNames` because every feature legitimately imports `@/db` — just not
  those two bindings (lint-format.md, ADR 048).
- Noted in the ADR index that **`047` is claimed by an open PR** as well as the existing `045`
  reservation, so this ADR took `048`. An ADR-number collision is invisible to git; the next author
  must check open PRs (`gh pr diff <N> --name-only | grep decisions/`), not just the highest merged
  number (decisions/README.md).

## 2026-08-29

- Split the two meanings of "server E2E". `server/npm run test:e2e` is now a committed,
  dependency-free in-process Nest HTTP smoke with its own discovery root
  (`server/test/jest-e2e.json`, `test/**/*.e2e-spec.ts`) that cannot rediscover the
  `server/src` unit suite, enforced as a named `Run server E2E tests` step in
  `ci-build-deploy.yml`; `ci/e2e-server.sh` keeps sole ownership of the real-backend
  lifecycle behind Maestro and legacy Flutter device E2E. `--passWithNoTests` is banned
  so an empty E2E suite stays red. No ADR: this restores a documented gate and records
  existing ownership rather than making a costly-to-reverse choice (testing.md).
- Recorded that the committed spec now carries `PATCH /v1/calendars/{token}` (token-authorized
  calendar rename), served by a second controller with a path-level `/v1` prefix rather than by
  NestJS global versioning, which stays disabled so the existing unversioned calendar read, create
  and sync routes keep serving Flutter release builds. Generalized the `/v1` rule from "exactly one
  route" to "a path-level prefix per controller" now that `POST /v1/calendar-logs/search` is a
  second instance of the same pattern. The epic's architecture decisions record is owned by a later
  ticket; this entry states the contract fact only (data.md).
- Added the device-local Activity model: the `activity_logs` and `activity_state` tables, an
  additive migration, and the `activity` feature's data layer. Two decisions are recorded in
  ADR 046. First, the cache is **merged by server log id, never drop+replaced** — history is
  cursor-paginated, so a replacing newest-page refresh would delete every older page a student
  had backfilled and shrink the offline timeline to one page; upsert identity is also what makes
  a repeated page, an overlapping page and a restarted pagination chain idempotent. Second, the
  **read watermark is server-issued time**: a device-clock watermark on a phone whose clock is
  set forward hides every subsequent change permanently, and set backward re-marks read history
  as unread forever. The one-year prune cutoff derives from server time for the same reason, and
  `lastSuccessfulRefreshAt` stays device time by design — the two clocks in one row are the point
  of the record, not an inconsistency to unify (storage.md, features.md, ADR 046).
- Grew the single backend-bound reset list from four tables to six. `switch.ts` calls
  `resetBackendDatabase()`, so there remains exactly one list and the environment switch needs no
  separate change; a table missing from it would leave another environment's private schedule data
  on the device (storage.md).
- Required a migration's upgrade path to be proven against **real SQLite**, not only against the
  suite-wide expo-sqlite mock: the committed SQL is applied to an in-memory `node:sqlite` database
  on a fresh install _and_ on top of a database already holding rows in every earlier table. The
  mocked seam can only prove runner wiring, and a migration that fails on an installed database is
  a data incident. No ADR: this tightens the existing testing contract for a surface the Book
  already calls sensitive (storage.md, testing.md).
- Left ADR `045` free. The open source-recovery PR carries an ADR numbered `044` that collides
  with the merged `044` and renumbers to `045` on rebase; an ADR-number collision is invisible to
  git because two different filenames merge as two clean adds (decisions/README.md).

## 2026-08-28

- Isolated four mobile Jest suites from declaration order by awaiting RNTL 14 async helpers and
  adding targeted exception-safe teardown for one-shot mocks, spy implementations, and MMKV test
  preferences. Global mock restoration remains prohibited because it would remove harness-owned
  native spies. No ADR is needed: this applies the existing test-isolation contract without a
  costly-to-reverse architecture decision (testing.md).
- Required suite-owned spy history and queued one-shot implementations to be reset through
  exception-safe, targeted teardown before another test runs, while preserving persistent
  `jest/setup-*.ts` spy wrappers. The splash dismissal suite is the concrete pattern; this is an
  R-4 test-harness leaf fix and adds no ADR (testing.md).
- Removed the persistent non-production environment marker. The Settings environment entry is now
  the single non-production indicator and must expose the effective environment in its accessible
  name on both platforms; no environment surface may consume layout insets or otherwise change
  screen composition relative to a production build, so headers can be integration-tested and
  screenshotted at their shipped position. Supersedes the marker consequence of ADR 043
  (043-backend-environment-reset.md, features.md).
- Set an explicit per-test time budget for the Jest harness (`testTimeout: 30000`) with a
  config-drift guard at a 20 000 ms floor, resolving the baseline gate's named intermittent —
  a per-test timeout misread as a `getByText` miss. ADR 044 records the measurements and the
  binding rule: the budget is a harness capacity setting and may never be cited for a longer
  query wait, a retry, or a weakened matcher. Also added `usePlatform`
  (`src/test-support/platform.ts`) so a `Platform.OS` override always restores, a separate
  latent order dependence (testing.md, ADR 044).
- Added fetch-time ADE iCal normalization to a rolling UTC window from 12 calendar months
  before through 12 months after each fetch. Rewrites remain ephemeral so source URLs are not
  persisted with expiring dates, while existing sync cadence and school-specific exceptions
  remain unchanged (calendar.md).
- Added the nullable school dark-logo API contract and mobile theme selection with required light
  fallback. ADR 041 records the relative-key server mapping, generated-client obligation, and
  additive Flutter/web compatibility (data.md, theming.md, features.md).

## 2026-08-27

- Added the independent backend capability, fixed endpoint allowlist, visible preview/development
  selector, persistent non-production marker and journaled destructive cross-store reset. ADR 043
  records fail-closed production behavior, state classification and the future-auth participant
  invariant; all four release fingerprints changed and require fresh native builds.
- Bound the iOS `preview` submit profile to public App Store Connect app `1479613630` while keeping
  production and Apple account/team credentials environment-backed. Focused Jest and direct `jq`
  checks guard the destination; no build, signing, upload, or submission occurred (eas.md,
  `mobile/EAS.md`).
- Restored the iPhone+iPad App Store continuity contract while retaining portrait-only,
  full-screen behavior and intentionally disabling iPad multitasking. Source-config tests and a
  disposable generated-native assertion enforce device families `1,2`, full-screen presentation,
  and portrait-only iPad orientations. Refreshed iOS fingerprint evidence records the required
  fresh signed preview binary and OTA incompatibility; no build or submission occurred (ADR 042,
  runtime.md, eas.md, `mobile/EAS.md`).
- Established the worktree-scoped local Compose entrypoint and the reusable
  Postgres/Redis-only prerequisite for OpenAPI generation and server tests, while
  preserving `ci/e2e-server.sh` as the E2E lifecycle owner (testing.md).

## 2026-08-26

- Made contact-service 503 failures explicitly retryable in Feedback while retaining
  form values, added equivalent accessible FR/EN guidance, and redacted `/contact`
  request/response bodies from development API diagnostics (data.md, features.md).
- Made iOS submit profiles target the existing App Store Connect record with the committed public
  `ascAppId`; EAS-managed API-key authentication remains off-repo. Removed literal `$EXPO_*`
  strings because `eas.json` does not shell-expand field values (eas.md, `mobile/EAS.md`,
  `mobile/eas.json`).
- Confirmed from the signed local iOS preview artifact that `eas build --local` stamps the selected
  profile's `expo-channel-name` into `Expo.plist`; removed the incorrect deferred
  `updates.requestHeaders` work (eas.md, `mobile/EAS.md`).
- Wired preview and production native builds to signed xprem delivery: one validated
  `OTA_CHANNEL` source, exact endpoint/app/branch headers, embedded public certificate metadata,
  development OTA disablement, and retained independent EAS linkage. SDK 56 fingerprint evidence
  records conservative per-channel iOS/Android runtimes plus a native-change control; no
  `.fingerprintignore` weakens native config protection (ADR 037, eas.md, `mobile/EAS.md`).
- Recorded the live xprem endpoint and TimeCalendar app UUID plus xprem's database-managed
  per-app signing mode, single public certificate path/fingerprint, and private-key custody
  boundary. Client endpoint/header/channel/certificate wiring remains downstream (eas.md).
- Removed `docs/mobile/build-infrastructure/` and its `mobile-build-infrastructure-guidance`
  spec: the pack recommended EAS Build for signed binaries and a separate `internal-store`
  profile, both rejected by ADR 040, and had no surviving content that `eas.md`,
  `docs/mobile/releases/` or the ADRs did not already carry. Corrected the release guide's
  remaining "EAS build ID" wording to the local artifact record.
- Made `preview` a store-distributed profile (`app-bundle` + store `.ipa`, `autoIncrement`, own
  `submit.preview`), moved store binary production to `eas build --local` on the macOS host with
  EAS retained as credential authority and upload transport, established annotated tags on `main`
  as the release selector, and prohibited promoting a build across channel lanes. ADR 040 records
  it and supersedes decision 2 of ADR 006; decision 1 (the `fingerprint` policy) is unchanged
  (eas.md, `mobile/EAS.md`, `mobile/eas.json`).
- Marked `docs/mobile/ota/` and `docs/mobile/build-infrastructure/` as exploration rather than
  rules, and indexed `docs/mobile/releases/` from the Architecture Book and the rules pointer, so
  the binding release contract has one home.

- Isolated each top-level Maestro flow in its own CLI/XCTest lifecycle while retaining one
  shared backend lifecycle, and bounded iOS retries to positively classified startup-only
  transport failures so assertion and application failures remain terminal (ADR 038,
  testing.md).

## 2026-08-25

- Ratified signed, self-hosted xprem OTA delivery with Cloudflare R2 assets, the existing
  production Postgres control plane without ClickHouse, fingerprint runtime compatibility,
  deliberately imperative channel/rollout controls, non-blocking launch, silent one-attempt
  foreground-boundary application, and five bundle-identity Crashlytics keys (ADR 037,
  eas.md, firebase.md).
- Reconciled `architecture.md` so this file is the canonical Architecture Book rule-change log,
  while Git retains implementation history and detailed diffs.
- Added the bundled Changelog history and tabs-only once-per-version sheet contract. ADR 039
  records the integer MMKV gate, fresh-install suppression, OTA semantics, and Phase 09 import
  ordering.
- Replaced the interim onboarding welcome with a neutral, localized three-page carousel and adopted the feature-local `react-native-pager-view` native bridge. ADR 036 records its native paging/event contract, suite-wide Jest seam, autolink/no-permission posture, and fresh-binary fingerprint consequence.
- Added the layered Feedback root route, validated last-e-mail persistence, existing
  generated contact-client seam, Settings support entry, and DTO-bounded report action
  for recorded iCal import failures. Contact failure telemetry remains body-free.

## 2026-08-08

- Added the curated display-timezone preference (`settings.timezonePreference`,
  `"system"` + 10 French zones) resolved at one settings-prefs seam
  (`resolveTimezone`/`useDisplayZone`); every rendered event time and day
  boundary is zone-threaded explicitly (formatters, day keys, bucketing,
  now-indicator, calendar-kit `timeZone`), all-day events stay floating, the
  greeting stays device-local, and the notification subscription follows the
  same zone with a resolved-zone re-registration trigger (ADR 035, calendar.md,
  features.md).
- Aligned the notifications feature to the server's v2 wire contract: lowercase
  `new | edit | cancel` payload canon plus the `calendar_digest` action (routes to
  Calendar, re-syncs on foreground), and the subscription DTO now carries `locale`/
  `timezone` read through effective accessors, with language- and timezone-change
  re-registration triggers (ADRs 027/028, firebase.md).

## 2026-08-07

- Established Home · Calendar · Settings as the mobile tab hierarchy, with a nested
  Settings Stack, feature-owned grouped destination hub, derived held-calendar
  summary, and temporary `/profile` compatibility redirect (ADR 034).
