## ADDED Requirements

### Requirement: The import journey pins one valid guide snapshot in memory
The mobile app SHALL represent onboarding and export-guide progress as a Stack-scoped discriminated
state whose active and completed guide branches contain one immutable T2-validated snapshot,
locale, catalogue version, provider identity, draft revision, and contiguous visited-page bound.
Only the completed branch SHALL carry completion proof. Institution, programme, provider, locale,
or catalogue-version changes SHALL invalidate that proof. Backgrounding with a live process SHALL
retain it; Stack exit or process death SHALL clear it without persistence.

#### Scenario: Snapshot remains pinned during a live journey
- **WHEN** the catalogue changes or crosses its cache freshness boundary after page 0 is entered
- **THEN** Back and Next continue over the originally pinned provider, pages, locale, and version
- **AND** no active page refresh replaces the snapshot

#### Scenario: Identity changes invalidate completion
- **WHEN** institution, programme, provider, locale, or resolved catalogue version changes
- **THEN** the state no longer contains completion proof
- **AND** manual, QR, and iCal routes become protected again

#### Scenario: Lifecycle matches Stack ownership
- **WHEN** the app backgrounds and foregrounds without process death
- **THEN** the current draft, snapshot, page bound, and completion remain
- **AND WHEN** the onboarding Stack unmounts or the process restarts
- **THEN** none of that journey state is restored

### Requirement: Unlisted students choose from the compatible server catalogue
After the required unlisted institution name and skippable Programme step, the app SHALL show every
validated, compatible, selectable pages provider returned by T2 in canonical server order, without
a client slug allowlist. Unlisted institutions SHALL never see Connect. Selection SHALL pin the
chosen provider; if it disappears before pinning, the existing resolver SHALL substitute Generic,
and an unusable catalogue SHALL remain blocking.

#### Scenario: Future content-only provider needs no mobile release
- **WHEN** a compatible schema-v1 catalogue adds a valid selectable pages provider
- **THEN** the selector renders it in server order with its server-owned label
- **AND** no fixed four-provider client allowlist filters it out

#### Scenario: Unlisted route skips Connect
- **WHEN** an unlisted student continues or skips Programme
- **THEN** provider selection is the next route
- **AND** Connect is neither rendered nor opened

#### Scenario: Selection changes safely
- **WHEN** the student changes provider or a selected definition disappears before pinning
- **THEN** prior completion is invalidated and the current selection resolves anew
- **AND** the T2 Generic substitution or blocking-catalogue outcome is used

### Requirement: Each native guide page is one deterministic Stack entry
The guide SHALL use a thin dynamic Expo Router export whose only route value is a page index. Page
0 SHALL start a valid resolved snapshot; each Next SHALL advance exactly one contiguous page with
`router.push`; final Next SHALL mark that snapshot complete and push the existing manual selector.
No other action SHALL advance, clamp an invalid index, or mark completion. Native header Back, iOS
swipe, Android system Back, and visible Back SHALL pop exactly one entry, including manual selector
back to the completed final page.

#### Scenario: Next creates page history
- **WHEN** Next is activated on a non-final page whose route index matches the pinned state
- **THEN** the next index is marked visited and pushed as a new Stack entry
- **AND** Back returns to the immediately preceding page

#### Scenario: Invalid index fails closed
- **WHEN** an index is malformed, negative, outside the pinned page array, ahead of contiguous
  progress, or mismatched with current state
- **THEN** Next is unavailable and completion remains false
- **AND** the route recovers to the earliest legal destination without clamping forward

#### Scenario: Final completion hands off to manual import
- **WHEN** Next is activated on the valid final page
- **THEN** completion is bound to the current draft and snapshot before manual import is pushed
- **AND** Back from manual import returns to that completed final-page entry

### Requirement: Protected import routes cannot bypass the guide
In every production-capable build, manual import SHALL require current in-memory guide completion,
and QR/iCal SHALL additionally require entry through that guarded manual selector. An illegal
direct or restored route SHALL replace itself with provider selection for a complete unlisted
draft, page-0 resolution for a complete listed draft, or School otherwise. Recovery SHALL never
replace a route with itself. Only an explicit seed accepted by the runtime-verified development
variant SHALL bypass the guard; `__DEV__`, route parameters, and persisted values SHALL never do so.

#### Scenario: Production deep link is rejected
- **WHEN** a production-capable build opens manual, QR, or iCal without current completion and
  guarded handoff state
- **THEN** calendar creation is unavailable and the earliest legal route replaces the target
- **AND** no query value or persisted value can make the route legal

#### Scenario: Recovery does not loop
- **WHEN** an illegal route's calculated recovery target is already the current route
- **THEN** it renders the appropriate loading or blocking recovery state without replacing itself
- **AND** ordinary Back remains available

#### Scenario: Development bypass uses the runtime variant
- **WHEN** deterministic test setup seeds a completed journey in the verified development variant
- **THEN** protected routes may be exercised
- **AND WHEN** the same seed is attempted in a production variant
- **THEN** it is rejected even if `__DEV__` or route parameters suggest development

### Requirement: Guide loading and failures remain recoverable but closed
The app SHALL render network, timeout, HTTP, stale/missing LKG, malformed, unsupported,
locale/version/header, storage, and invalid-Generic failures as localized blocking shell UI with
single-flight Retry and ordinary Back. Retry SHALL re-run request and validation without parallel
requests or manual-import bypass, and results SHALL become inert after unmount, journey
invalidation, or a newer attempt.

#### Scenario: Retry is single-flight
- **WHEN** Retry is activated repeatedly while a catalogue request is in flight
- **THEN** only one repository request runs
- **AND** the control and screen-reader status expose loading until one bounded result arrives

#### Scenario: Every blocking class stays closed
- **WHEN** any T2 `source: none` failure is returned without a fresh matching LKG
- **THEN** the guide-required error shell and Retry are shown without internal details
- **AND** manual, QR, and iCal remain unavailable

#### Scenario: Late completion is ignored
- **WHEN** a request completes after navigation away, unmount, draft/locale change, or a later retry
- **THEN** it does not pin a snapshot, navigate, announce success, or restore completion

### Requirement: Guide content is inert, accessible, localized, and theme-safe
Provider/page copy SHALL render as plain React Native text and validated images only, never parsed
markup, links, executable components, or browser content. A failed thumbnail/page image SHALL
degrade to a stable text-only placeholder while preserving completion. Client-owned shell text
SHALL have typed FR/EN parity. Screens SHALL use native Stack chrome, existing theme tokens,
readable safe layout, scalable text, reduced-motion behavior, 44pt iOS/48dp Android targets, and a
screen-reader order of header, focused heading and localized progress, description, one image or
placeholder meaning with caption, then Next.

#### Scenario: Markup-shaped server strings stay inert
- **WHEN** labels, titles, descriptions, alt text, or captions contain HTML/Markdown-shaped text
- **THEN** the literal text is rendered without a link, parser, WebView, or executable element

#### Scenario: Image failure keeps the guide usable
- **WHEN** a validated image fails native loading or decoding
- **THEN** a text-only placeholder exposes the same alternative meaning once and any caption stays
  visible without duplicate announcement
- **AND** Next remains available

#### Scenario: Accessibility shell remains operable
- **WHEN** a page opens in FR or EN, light or dark mode, largest supported text, or reduced motion
- **THEN** its heading receives focus with localized page progress and traversal follows the
  specified order
- **AND** content remains readable and every action meets its platform target minimum

### Requirement: Export-guide observability has exact privacy allowlists
The feature SHALL emit only the nine specified export-guide Analytics events through `@/firebase`,
with parameters restricted to validated slugs, versions, enum values, bounded counts/indices/age or
attempt buckets, locale/schema, and app/platform version. Expected transport/image failures SHALL
remain Analytics-only. Only malformed invariants, impossible transitions, and storage corruption
SHALL reach Crashlytics as static sanitized errors with enum attributes. No diagnostic SHALL record
school/programme data, URLs, iCal/token/search content, route parameters, copy/payloads, headers, or
raw errors.

#### Scenario: Analytics payloads match their closed event types
- **WHEN** catalogue load, provider resolution, start, page view, completion, retry, blocking,
  image failure, or required-Connect skip occurs
- **THEN** the corresponding event contains exactly its specified allowlisted fields
- **AND** validated provider slugs appear only after schema validation

#### Scenario: Forbidden values never cross the Firebase seam
- **WHEN** distinctive institution, programme, route, URL, token, copy, payload, header, search, and
  raw-error values are supplied around every success and failure path
- **THEN** none appears in Analytics or Crashlytics calls

#### Scenario: Expected failures avoid Crashlytics noise
- **WHEN** timeout, offline, HTTP, blocking catalogue, or image-download failure occurs
- **THEN** it emits only the bounded Analytics outcome
- **AND** Crashlytics is reserved for sanitized invariant/storage failures
