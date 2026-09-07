# Native server-driven export guides

**Date:** 2026-09-07

**Issue:** `TIM-435`

**Status:** Approved technical specification; product implementation is not part of this change

**Products:** React Native mobile app and server

## Summary

TimeCalendar will insert a mandatory, deterministic export tutorial between institution setup and
the existing manual QR/iCal selector. The tutorial explains how to copy an iCal URL. Its catalogue,
provider mapping, localized copy, and instructional images are server-owned, while every screen and
navigation transition is native React Native.

The first selectable providers are ADE, Hyperplanning (wire slug `hplanning`), Celcat, and Generic.
A listed institution resolves its configured content-only provider or Generic. An unlisted
institution lets the student choose one of those providers. A valid guide must be completed before
the existing manual selector, QR scanner, or iCal URL entry can be used in production.

This document specifies future delivery. It does not change the server, the committed OpenAPI
contract, generated clients, either mobile application, deployment configuration, or any runtime
environment.

## Evidence and current boundaries

- Flutter's `app/lib/modules/assistant/data/assistant_steps.dart` gates Programme and Connect from
  `SchoolAssistant`, then opens a WebView. Its synthetic unlisted school uses `generic`, requires a
  programme, and skips Connect. `fallbackAssistant` is a separate legacy retry branch; it is not
  provider-to-Generic resolution.
- The four reusable web tutorials live under `web/modules/assistant/data/assistants/`: ADE has four
  pages, `hplanning` has two, Celcat has three, and Generic has three. `select` renders a selector,
  not a tutorial. The remaining configured slugs have no content-only guide; Groups is interactive.
- `server/src/modules/school/models/school-assistant.model.ts` owns legacy slugs and two gates.
  `SchoolMapper` currently rejects an unknown primary slug before a client can recover. There is no
  guide-catalogue endpoint.
- `openapi/openapi.json` exposes legacy `assistant` and `fallbackAssistant` fields on
  `SchoolForList`. `mobile/src/features/school-selection/data/queries.ts` deliberately projects
  neither field, so React Native cannot currently apply those gates.
- React Native currently follows School (or institution name) -> Programme -> Connect -> manual
  import. `ImportDraftProvider` is Stack-scoped React state; it survives ordinary navigation and
  backgrounding while the process lives, then clears on Stack exit or process death (ADR 047).
- The existing mobile query persister establishes a 24-hour rebuildable-cache precedent through
  the `@/storage` seam. `expo-image`, FR/EN locale selection, theme tokens, the Firebase seams, and
  server feature flags already exist. No new native dependency is required.

Porting means preserving instructional content and the successful outcome. It does not preserve
the WebView, unrestricted navigation, JavaScript bridge, `localStorage`, calendar-created messages,
AI/assistant terminology, or dead fallback screens.

## Goals

- Explain, natively and accessibly, how a student obtains an iCal URL.
- Let the server update valid provider copy, page order, images, school mappings, and the selectable
  provider catalogue without a mobile release.
- Preserve listed-school Programme and Connect gates when applicable.
- Preserve the existing manual QR/iCal selector and creation paths after guide completion.
- Support new content-only providers without a mobile release when they satisfy schema v1.
- Fail closed: catalogue failure never becomes a shortcut to manual import.
- Keep older Flutter and web clients working during the migration.

## Non-goals

- AI, chat, prompts, models, tools, streaming, or runtime-generated instructions.
- A WebView, web session, native/web bridge, or calendar capability token.
- Executable HTML, JavaScript, Markdown, arbitrary links, or arbitrary image origins.
- Creating a calendar from a guide page.
- Interactive Groups/custom-assistant behavior, automatic group selection, or the legacy
  `fallbackAssistant` system.
- Porting the legacy `select` component as guide content.
- Changing Flutter or web behavior in this delivery.
- Persisting or restoring the institution/programme journey across process death.
- An API-wide NestJS versioning migration, database/CMS authoring UI, deployment, or rollout act.

## Terminology

| Term                   | Meaning                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| Catalogue              | One immutable, localized set of provider definitions identified by `catalogueVersion`.                        |
| Provider               | A server-defined export system such as ADE; only `kind: "pages"` is renderable in v1.                         |
| Generic                | The required `generic` content-only provider used when a listed provider cannot render.                       |
| School guide reference | The additive, neutral provider-and-gates object on `SchoolForList`.                                           |
| Validated LKG          | A last-known-good catalogue that passed full envelope validation and contains a valid Generic provider.       |
| Journey snapshot       | The catalogue version, resolved provider, pages, draft, and progress pinned in memory for one active journey. |
| Manual selector        | The existing native screen that offers QR scanning or iCal URL entry.                                         |
| Safe intranet URL      | A non-empty absolute `http:` or `https:` URL accepted by the existing client validator.                       |

## Parity boundary

| Legacy surface                                         | v1 treatment                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| ADE, four content pages                                | Port the meaning into localized plain text plus validated images.               |
| Hyperplanning, two content pages                       | Port under the stable legacy slug `hplanning`; display label is Hyperplanning.  |
| Celcat, three content pages                            | Port the meaning into localized plain text plus validated images.               |
| Generic, three content pages                           | Port and make it mandatory for every valid catalogue.                           |
| `select`                                               | Replace with the native unlisted-provider selector; it is not a guide provider. |
| Groups and institution-specific interactive assistants | Deferred; never expose as `kind: "pages"` without real content pages.           |
| `fallbackAssistant`                                    | Deferred and ignored by the new resolver.                                       |
| WebView/bridge/local storage/calendar-created paths    | Rejected architecture; do not reproduce.                                        |

Editorial migration must correct legacy grammar and obsolete UI wording. Existing images are
evidence, not automatically publishable assets: every retained screenshot needs current copy,
meaningful alternative text, dimensions, and an immutable first-party URL.

## User journeys

### Listed institution

1. Selecting a school stores its domain projection plus `exportGuide` in the ephemeral import
   draft. The guide catalogue may prefetch, but prefetch never advances navigation.
2. If `requireProgramme` is true, open Programme. Otherwise store `calendarName: ""` and skip it.
3. If `requireConnect` is true and `intranetUrl` is safe, open Connect. Otherwise skip it. When the
   flag is true but the URL is missing or unsafe, emit the configuration diagnostic defined below;
   do not render a dead Connect page and do not block the student.
4. Resolve the school reference against its exact catalogue version. If the requested provider is
   missing, unknown, unsupported, invalid, or not `kind: "pages"`, resolve Generic.
5. Push page 0, then one native Stack entry for each subsequent page.
6. The final Next action marks this journey's guide complete and pushes the existing manual
   selector. QR or iCal URL then performs the existing calendar-create flow.

`requireProgramme: false` never invents a programme. A listed school sends an empty calendar name
through the existing draft/create seam. `requireConnect: false` skips Connect even when a URL is
present. An unsafe or absent URL is never opened.

### Unlisted institution

1. School not found -> required institution name.
2. Programme is always shown and remains skippable under its existing validation.
3. Load a valid active catalogue and show a native provider selector containing only
   `selectable: true`, compatible, valid `kind: "pages"` providers, in catalogue order.
4. v1 publication must make exactly `ade`, `hplanning`, `celcat`, and `generic` selectable. Generic
   is labelled as the other/unknown choice in localized server content.
5. Selecting a provider pins it and opens page 0. If the selected definition becomes unavailable
   before pinning, resolve Generic; if Generic is unusable, show the blocking catalogue error.
6. Complete the pages -> existing manual selector -> QR or iCal URL.

Unlisted institutions never show Connect because there is no trusted intranet URL. A later
catalogue may add another selectable content-only provider without an app release, but removing one
or changing selectability requires a new immutable catalogue version.

## Native journey and navigation

### State model

Extend the Stack-scoped import context; do not create a global store. The conceptual state is:

```ts
type ExportGuideJourney = {
  stage:
    | "institution"
    | "programme"
    | "connect"
    | "provider-selection"
    | "catalogue-error"
    | "guide"
    | "manual-import";
  catalogueVersion?: string;
  locale?: "fr" | "en";
  providerSlug?: string;
  pages?: readonly ExportGuidePage[];
  pageIndex?: number;
  guideCompleted: boolean;
};
```

The actual types should make invalid combinations unrepresentable (a discriminated union rather
than the optional conceptual fields above). The pinned pages are copied from a validated catalogue
and treated as immutable. Route parameters carry only a page index; they never carry provider
copy, image URLs, institution data, or completion state.

### Route shape and Back behavior

- Add one thin Expo Router route definition for a dynamic guide page and one for native provider
  selection. Every page navigation uses `router.push`, producing one native Stack entry per page.
- Native header Back, iOS swipe-back, Android system Back, and an optional visible Back control all
  pop exactly one Stack entry. Page 0 returns to provider selection for unlisted schools or the last
  applicable listed-school gate. Back from the blocking error returns normally and may leave
  onboarding. Back from manual import returns to the completed final page with the snapshot intact.
- Next is the only forward page transition. It is disabled while the route index and pinned state
  disagree. Invalid indices never clamp forward and never mark completion.
- Page progress is derived as `pageIndex + 1` of `pages.length`; it is not persisted separately.
- Leaving the onboarding Stack clears the draft, pinned catalogue, and completion proof. Re-entering
  begins at School. There is no forced redirect back into onboarding after the user leaves.

### Production route guards

The guide is mandatory for this journey. In preview/production-capable builds:

- A later guide page requires the same in-memory snapshot and every preceding page entry.
- Manual import requires `guideCompleted` for the current draft and pinned provider.
- QR and iCal URL require entry from that guarded manual selector.
- A direct/restored route without the required state is replaced with the earliest recoverable
  route: the resolver when a complete draft exists, otherwise School. A guard never replaces a
  route with itself, so recovery cannot loop.
- Changing institution, programme, provider, locale, or catalogue version invalidates completion.

Development/test tooling may exercise a seeded bypass only behind the existing runtime-verified
development variant. Compile-time `__DEV__`, a route parameter, or a persisted value is not an
acceptable gate. No production-capable build may enable it.

This intentionally supersedes ADR 047's production no-draft allowance once implementation lands.
The draft remains ephemeral; only the legality of protected direct routes changes.

### Lifecycle and catalogue changes

- Foreground/background transitions retain the in-memory draft and pinned snapshot while the JS
  process survives. Do not refresh or replace pages in an active guide.
- An active validated snapshot may finish even if it crosses the 24-hour cache boundary; freshness
  is evaluated when resolving a new journey, not in the middle of a page sequence.
- Process death clears all journey state. Restored protected routes restart at School (or the
  resolver only if a valid draft somehow still exists in the live process); no partial progress is
  reconstructed from route history.
- A newly published catalogue affects only a new resolution. Back/forward within an active journey
  continues on the pinned version.

## Server and OpenAPI contract

### Endpoint and ownership

Add a dedicated path-level endpoint; do not embed page arrays in school rows:

```http
GET /v1/export-guides?locale=fr&clientSchema=1&catalogueVersion=<optional opaque version>
If-None-Match: "<etag>"
```

- The route uses a controller-local `/v1` prefix. NestJS global versioning remains disabled so
  released Flutter clients retain their unversioned routes (ADR 051).
- The server owns versioned FR and EN manifest files. Instructional images live in first-party
  object storage behind the existing public asset boundary.
- Omitting `catalogueVersion` returns the active version. Supplying one returns that exact retained
  version or `404` if it is no longer retained. A listed school requests the version in its school
  reference; an unlisted journey requests the active version.
- `Content-Language` is `fr` or `en` and equals the response body's `locale`. A strong `ETag`
  identifies the exact locale/schema/version representation; matching `If-None-Match` returns
  `304` with no body.
- The endpoint is additive and needs no calendar token or user identity.

The committed `openapi/openapi.json` remains the contract source. Later server delivery regenerates
it from built NestJS output, then regenerates `mobile/src/api/generated/` with Orval. Generated
files are committed and never hand-edited.

### Neutral school reference

Add this required object to new `SchoolForList` responses while retaining every legacy assistant
field unchanged:

```ts
type SchoolExportGuideRefV1 = {
  providerSlug: string;
  requireProgramme: boolean;
  requireConnect: boolean;
  catalogueVersion: string;
};

type SchoolForList = ExistingSchoolForList & {
  exportGuide: SchoolExportGuideRefV1;
};
```

The server must preserve the raw configured `providerSlug`; an unknown value must reach the client
so it can substitute Generic instead of making `/schools` fail. `fallbackAssistant` and `isNative`
do not participate. Existing Flutter/web fields and serialization remain compatible.

### Catalogue schema v1

```ts
type ExportGuideCatalogueV1 = {
  schemaVersion: 1;
  catalogueVersion: string;
  locale: "fr" | "en";
  providers: ExportGuideProviderV1[]; // canonical selector order
};

type ExportGuideProviderV1 = {
  slug: string;
  label: string;
  kind: "pages";
  selectable: boolean;
  compatibility: {
    minClientSchema: 1;
    maxClientSchema: number;
  };
  thumbnail?: ExportGuideImageV1;
  pages: ExportGuidePageV1[];
};

type ExportGuidePageV1 = {
  title: string;
  description: string;
  image?: ExportGuideImageV1;
};

type ExportGuideImageV1 = {
  url: string;
  width: number;
  height: number;
  altText: string;
  caption?: string;
};
```

Unknown object fields are ignored for forward-compatible additive metadata. An unknown top-level
`schemaVersion`, unknown `kind`, or incompatible provider is never guessed. v1 does not support
links, actions, rich text, animation, video, or nested interactive blocks.

### Validation bounds

Server publication and mobile defensive parsing enforce the same bounds:

| Value                  | Rule                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| Encoded catalogue body | At most 512 KiB, excluding image bodies.                                                                       |
| `catalogueVersion`     | Opaque, non-empty ASCII, 1-128 characters; immutable once published.                                           |
| Providers              | 1-50; unique case-sensitive lowercase slugs; array order is canonical.                                         |
| `slug`                 | `^[a-z0-9][a-z0-9-]{0,63}$`; Generic is exactly `generic`; Hyperplanning remains `hplanning`.                  |
| Provider `label`       | Trimmed plain text, 1-80 characters.                                                                           |
| Pages                  | 1-20 per renderable provider.                                                                                  |
| Page `title`           | Trimmed plain text, 1-120 characters.                                                                          |
| Page `description`     | Trimmed plain text, 1-2,000 characters.                                                                        |
| Image URL              | Absolute HTTPS, at most 2,048 characters, approved first-party host, no credentials, query token, or fragment. |
| Image dimensions       | Integer width/height from 1 through 4,096 pixels.                                                              |
| `altText`              | Trimmed, meaningful plain text, 1-500 characters whenever an image exists.                                     |
| `caption`              | Optional trimmed plain text, 1-500 characters when present.                                                    |
| Compatibility          | Integer bounds with `1 <= minClientSchema <= maxClientSchema`; v1 renders only when `min <= 1 <= max`.         |

The catalogue envelope is invalid when JSON/schema parsing fails, versions/locales disagree with
the request, slugs duplicate, limits are exceeded, or Generic is absent/invalid/incompatible.
An otherwise isolatable non-Generic provider failure removes that provider from the renderable set;
a listed mapping to it substitutes Generic. Publication validation is stricter and rejects any
invalid provider before a manifest can become active.

Every valid FR and EN version has the same provider slugs, order, kinds, selectability,
compatibility, page count, and asset semantics. Copy and locale-specific assets may differ.

### Atomic publication and retention

1. Upload fingerprinted image objects first. They are immutable and return long-lived immutable
   cache headers. Never overwrite an existing URL.
2. Validate the complete FR/EN manifest pair, all referenced assets, Generic, initial selectable
   providers, every school reference, and compatibility bounds.
3. Publish the immutable manifests under a new `catalogueVersion` without activating them.
4. In one server-owned publication operation, make school references and the active catalogue
   pointer refer to that version. A reference must never become visible before its manifest.
5. Retain old manifests and assets for at least the 24-hour mobile LKG window plus the maximum
   server/CDN cache age. Deletion waits until neither school responses nor supported clients can
   legally request the version.

If the manifest and school mapping cannot share a database transaction, the server must use the
upload-before-pointer protocol above and immutable version lookup. Updating mutable objects in
place is prohibited.

## Cache and failure behavior

### Validated last-known-good rules

- Persist only fully validated, schema-compatible catalogues containing valid Generic, keyed by
  locale, client schema, and catalogue version, through the owned `@/storage`/query-persistence
  seam. Do not persist journey state or page progress.
- A new journey attempts a time-bounded network revalidation. A successful valid `200` replaces
  the LKG atomically. A valid `304` refreshes `validatedAt` for the matching stored representation.
- On timeout, offline/network error, HTTP failure, malformed/empty/unsupported response, or invalid
  Generic, the client may use a matching LKG only when `now - validatedAt <= 24 hours`.
- The 24-hour boundary is inclusive. Device-clock rollback cannot extend freshness: store a wall
  timestamp plus a monotonic age for the live process; any impossible/negative persisted age is
  stale and blocks.
- A stale or incompatible cache is removed or ignored and never shown silently. A cache for another
  locale, schema, or requested school catalogue version is not a match.
- Once accepted, the journey pins a snapshot; it does not observe cache replacement.

### Failure matrix

| Situation                                                                                | Result                                                                                     |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| First run offline / no matching LKG                                                      | Blocking native error; Retry and normal Back.                                              |
| Network timeout, offline, or HTTP failure + LKG <= 24h                                   | Validate cache again, use it, record `source: lkg`; no import bypass.                      |
| Network timeout, offline, or HTTP failure + stale LKG                                    | Blocking error; stale content is not rendered.                                             |
| Malformed JSON/envelope, unsupported schema, locale/version mismatch, or empty catalogue | Fresh matching LKG if available; otherwise blocking error.                                 |
| Generic missing, malformed, incompatible, or has no pages                                | Entire response unusable; fresh LKG if available; otherwise blocking error.                |
| Listed provider missing/unknown/unsupported/invalid after a valid catalogue              | Resolve valid Generic and record the substitution reason.                                  |
| Unlisted selectable provider becomes invalid before pinning                              | Remove it from selection; if selected concurrently, resolve Generic.                       |
| One page/thumbnail image fails                                                           | Continue with text, a stable placeholder, visible caption when present, and telemetry.     |
| Catalogue changes during active guide                                                    | Continue on pinned pages; new version applies to the next journey.                         |
| Process dies during selection/guide                                                      | Clear draft/progress; protected restored route restarts at School.                         |
| Retry after connectivity returns                                                         | Re-run request/validation; valid response starts or resumes resolution, never skips guide. |

### Blocking error UX

Client-owned shell copy is bundled and translated:

- FR title: **Impossible de charger le guide d'exportation**
- EN title: **We couldn't load the export guide**
- Body: explain that the guide is required, ask the student to check their connection, and invite
  them to try again. Do not expose schema, HTTP, cache, or provider internals.
- Primary action: **Réessayer / Retry**. It remains available after repeated failures and announces
  loading and the next result to screen readers.
- Back is the ordinary native/header or visible Back path. It may return to a prior step or leave
  onboarding. Mandatory means no manual-import bypass, not trapping the student.

Loading and retry use one single-flight request. Repeated taps do not create parallel requests.
Leaving the screen cancels or makes completion inert.

## Content, image, and application security

- Render titles, descriptions, labels, alt text, and captions as plain text. Never parse markup,
  interpolate executable components, or pass server text into a browser.
- Guide payloads contain no calendar URL, token, school/programme name, or student identifier.
- Only immutable HTTPS image URLs on a compiled first-party host allowlist are accepted. Reject URL
  credentials, fragments, signed/user-specific query values, unsupported ports, and any redirect
  contract. The asset service must serve the final object directly with the declared media type.
- Accept only the documented raster formats supported by `expo-image`; reject SVG or active
  document formats. Server validation checks content type, dimensions, size budget, and that the
  decoded file matches metadata before publication.
- Descriptions can name UI controls but cannot create tappable arbitrary links. The only external
  action remains the separately validated listed-school intranet button on Connect.
- Catalogue and image failures never expose raw response bodies or URLs in logs, analytics,
  Crashlytics, support metadata, or user copy.

## Accessibility, theme, and localization

- Use existing theme tokens and native Stack chrome in light and dark mode. Page content uses a
  measured readable lane, safe areas, and platform touch-target minimums.
- Text must scale with Dynamic Type/font scaling; do not disable scaling. The layout must remain
  operable at the largest accessibility size without clipped Next/Back actions or hidden content.
- Reading/focus order is native header, page heading, localized progress, description, image or
  placeholder/caption, then Next. On page push, focus/announce the new heading and progress.
- Progress exposes a localized accessible value such as “Page 2 of 4”; color, dots, or an image are
  never the sole signal.
- A loaded instructional image announces its `altText`. On failure, the placeholder exposes the
  same meaning once; do not announce both image and caption redundantly. Descriptions must remain
  sufficient to continue without the image.
- Use native Stack motion only. Any added decorative motion observes the existing reduced-motion
  hook and has a no-motion state.
- The server owns provider labels, guide page copy, alt text, and captions in complete FR and EN
  manifests. The client owns route titles, selector instructions, progress, loading/error/retry,
  Back/Next, and accessibility shell copy in typed bundled FR/EN resources.
- The client requests its resolved app language. If the server returns EN fallback, it must declare
  `Content-Language: en`; the client renders that internally consistent response and records only a
  locale-fallback enum. Mixed-language catalogues are invalid.

## Observability and support

### Analytics events

Use the existing `@/firebase` seam. Event parameters are enums, bounded numbers, versions, or
validated provider slugs only.

| Event                            | Required parameters                                                                                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `export_guide_catalogue_load`    | `outcome`, `source` (`network`, `not_modified`, `lkg`, `none`), `locale`, `schema_version`, `catalogue_version` when valid, `cache_age_bucket`, app/platform version. |
| `export_guide_provider_resolved` | requested provider slug/class, resolved slug, resolution reason (`exact`, `missing`, `unknown_kind`, `incompatible`, `invalid`, `generic`), catalogue version.        |
| `export_guide_started`           | provider slug, page count, locale, catalogue version.                                                                                                                 |
| `export_guide_page_viewed`       | provider slug, zero-based page index, page count, catalogue version.                                                                                                  |
| `export_guide_completed`         | provider slug, page count, catalogue version.                                                                                                                         |
| `export_guide_retry`             | prior failure enum, attempt bucket, LKG availability enum.                                                                                                            |
| `export_guide_blocked`           | failure enum, cache-age bucket, locale, schema version when readable.                                                                                                 |
| `export_guide_image_failed`      | provider slug, image role (`thumbnail`, `page`), page index when applicable, failure enum.                                                                            |
| `export_guide_connect_skipped`   | reason (`missing_url`, `unsafe_url`) and provider slug; this is the school-configuration diagnostic.                                                                  |

Never record institution/programme names or IDs, intranet/calendar/image URLs, iCal content,
catalogue/page copy, tokens, search text, raw payloads, exception messages containing response
data, or route parameters. Provider slugs are permitted only after schema validation.

Expected timeouts, offline failures, HTTP failures, and image download failures are analytics-only.
Malformed envelopes, invariant violations, impossible state transitions, and storage corruption may
reach Crashlytics as sanitized errors with enum attributes; raw payloads and URLs never do.

### Support and alerting

The blocking screen may expose a localized, copyable diagnostic code derived only from failure
enum, app version, platform, locale, client schema, catalogue version when valid, provider slug when
valid, and cache-age bucket. It must not encode school/draft data or a URL.

Server dashboards split by environment, app version, platform, and catalogue version:

- any attempted activation rejected by manifest validation is a release-blocking alert;
- any active-catalogue invalid-Generic event alerts immediately;
- `export_guide_blocked` over 5% with at least 20 journeys in 15 minutes alerts;
- network/HTTP/timeout failures over 10% with at least 50 loads in 15 minutes alert;
- image failures over 5% with at least 20 image requests in 15 minutes alert;
- unknown/invalid listed-provider substitution over 1% with at least 10 resolutions in 30 minutes
  alerts the catalogue owner; and
- missing/unsafe required Connect URLs are tracked as configuration defects by provider/version.

## Rollout and rollback

- Gate entry with the existing fail-closed server feature-flag service. Missing, malformed, or
  unreachable evaluation is disabled. A disabled/failed gate in a build that requires guides must
  block new import entry with recovery; it must not expose the old Connect -> manual shortcut.
- Publish the catalogue before enabling the flag for compatible app versions. Increase rollout by
  app version/environment only after server contract, LKG, and native evidence is green.
- Preferred rollback is repointing the active manifest to a previously validated immutable version
  while retaining its assets and mappings. This needs no mobile release.
- Emergency flag disable stops new journeys and leaves entered students on a blocking/back-capable
  recovery surface. An active pinned valid journey may finish.
- Older Flutter/web clients ignore additive school fields and the new endpoint. Their assistant,
  fallback, and unversioned API contracts remain unchanged.
- A repository merge is not a rollout act. No environment mutation, catalogue activation, or flag
  change belongs to an implementation PR.

## Verification requirements

Missing evidence on any applicable axis is implementation rework. It is not deferred into a
separate board or human approval gate.

### Server and contract automation

- Manifest validator unit tests cover every bound, duplicate slug, required Generic, FR/EN parity,
  compatibility, image origin/type/dimensions, selectable set, and publication ordering.
- Controller tests cover locale/client-schema negotiation, exact retained version, `200`, `304`,
  `404`, ETag stability, headers, body-size limit, feature flag, and dependency-free failures.
- Real Postgres/object-storage integration covers upload-before-pointer activation, atomic school
  reference visibility, rollback, version retention, and an unknown school provider reaching the
  wire unchanged.
- Existing Flutter-shaped `/schools` consumers remain accepted. Legacy assistant fields are byte-
  compatible in focused serialization tests.
- Regenerate `openapi/openapi.json` and `mobile/src/api/generated/`; both drift gates are clean.

### React Native automation

- Pure parser/resolver tests cover every validation bound, provider-to-Generic reason, invalid
  Generic, locale/schema compatibility, and initial selectable ordering.
- Cache tests use controlled clocks at 24h minus one millisecond, exactly 24h, and 24h plus one;
  cover `200`, matching/mismatched `304`, atomic replacement, clock rollback, corrupt storage,
  first-run offline, stale/foreign LKG, and pinned-snapshot isolation.
- Journey tests cover listed gate combinations, required Connect with safe/missing/unsafe URL,
  unlisted selection, programme skip, provider change, final completion, and draft invalidation.
- Navigation tests prove one Stack entry per page; header/iOS gesture/Android Back-equivalent pops;
  all protected deep links/restores; no guard loops; manual -> guide Back; background retention; and
  process-death restart.
- Component tests cover loading, every blocking error class, single-flight Retry, text-only image
  failure, theme, large text layout, screen-reader semantics/order/progress, focus restoration, and
  inert rendering of markup-shaped strings.
- Analytics/privacy tests assert the full event allowlist and prove forbidden fields never reach
  Analytics or Crashlytics.
- Logic remains above the 90% lines/branches threshold and the project above 70% global.

### Real-server and release-build evidence

- Add a deterministic fixture catalogue with both locales, all four initial providers, a listed
  exact mapping, unknown-provider mapping, invalid/missing required Connect URL fixture, and a
  controlled broken image.
- Shared Maestro flows use the real NestJS/Postgres/object-storage boundary and a release-config
  development-variant binary on both Android emulator and iOS simulator. Cover listed exact,
  listed Generic substitution, unlisted provider selection, blocking/retry, Back, and final
  transition to the existing manual selector.
- Run focused release builds with production-capable configuration to prove direct manual/QR/iCal
  deep links cannot bypass the guide and the development bypass is absent.
- Record the exact commit, build variant, backend fixture/catalogue version, simulator/emulator
  model, OS/runtime, and result. Syntax-only Maestro validation is not execution evidence.

### Named physical-device evidence

Run a release-config build on, and record the actual model and OS version for:

1. one supported physical iPhone with VoiceOver;
2. one supported physical iPad in portrait at the compact and readable-width boundaries; and
3. one supported representative low-end physical Android phone with TalkBack.

Across that named matrix, record light/dark mode, largest Dynamic Type/font scale, touch targets,
focus/progress announcements, native Back/swipe/system Back, offline first run, <=24h and stale LKG,
Retry after restoration, safe/missing Connect URL, a broken image, background/foreground, process
death, and the final guarded transition to QR/iCal. Evidence includes device model, OS, build SHA,
catalogue version, date, and pass/fail per axis.

## Future delivery-ticket graph

These are scoped candidates only. This specification does not create or dispatch them.

```text
T1 server catalogue/publication contract ──┬──> T2 mobile data, LKG and resolver
                                           │             |
                                           │             v
                                           └──────> T3 native journey and UI
                                                         |
                                                         v
                                              T4 integrated proof and rollout readiness
```

### T1 — Server catalogue, publication, and school reference

**Ownership:** `server/src/modules/`, server-owned manifest/assets, generated
`openapi/openapi.json`, and compatibility tests.

**Acceptance gate:** schema validator, atomic publication/version retention, ETag/locale/exact-
version endpoint, neutral school reference, fail-closed flag, legacy serialization, real-service
integration, and committed-contract drift are green.

**Sensitive surfaces:** OpenAPI and generated-client contract; object storage/deploy configuration
only if a separately scoped design proves existing configuration insufficient. No migration is
expected for a versioned manifest implementation.

### T2 — Mobile catalogue data, validation, cache, and resolver

**Dependency:** T1's committed contract.

**Ownership:** `mobile/src/features/export-guides/data/`, owned storage/query persistence,
school-selection projection, generated client consumption, and pure resolver tests.

**Acceptance gate:** all parser/resolution reasons, exact-version mapping, 24-hour LKG boundary,
atomic persistence, locale/schema isolation, invalid Generic, and privacy-safe diagnostics pass
with 90% logic coverage.

### T3 — Native provider selector, guide Stack, guards, and UI

**Dependency:** T2; route shells can be prepared after its domain types stabilize.

**Ownership:** `mobile/src/features/export-guides/ui/`, onboarding draft/journey state, thin
`mobile/src/app/onboarding/` routes, bundled shell translations, theme/accessibility behavior, and
navigation/component tests.

**Acceptance gate:** listed/unlisted gates, every Back path, protected-route enforcement without
loops, lifecycle behavior, image degradation, FR/EN shell, analytics allowlist, and manual-selector
handoff are automated. ADR 047, navigation guidance, Architecture Book changelog, and current-state
feature documentation are updated in the implementation PR.

### T4 — Integrated contract, release-build, and device proof

**Dependencies:** T1-T3.

**Ownership:** deterministic server fixtures, shared Maestro flows, CI labels/jobs when separately
approved, and recorded physical-device verification.

**Acceptance gate:** real-server Android/iOS release-config flows, production deep-link proof, and
the full named physical-device matrix above are attached to the same implementation head. Any
missing device axis returns to T3/T4 as rework; it is not a new approval gate.

Deferred interactive Groups/custom-provider logic and legacy fallback behavior require a separate
future specification. Rollout/activation remains a separate operational scope after all four
delivery outcomes are reviewed and merged.
