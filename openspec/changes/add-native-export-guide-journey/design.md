## Context

T2 now exposes an immutable validated catalogue, a 24-hour LKG repository, ordered selectable
providers, a Generic-substituting resolver, and `ExportGuidePinnedSnapshot`. The current onboarding
context carries only institution and calendar name; Programme always pushes Connect, Connect always
pushes manual import, and QR/iCal routes intentionally tolerate a missing draft. T3 must replace
those route-legality rules while retaining the same Stack-scoped, process-lifetime-only ownership.

The guide is mandatory in production-capable builds. Server copy is untrusted display data even
after schema validation, and observability must never reveal institution/programme data, URLs,
content, transport details, raw errors, or route parameters. The implementation touches binding
Architecture Book guidance but no API, generated client, persistence, native configuration,
deployment, Flutter, web, or workflow surface.

## Goals / Non-Goals

**Goals:**

- Make invalid draft, catalogue, snapshot, page-progress, and completion combinations
  unrepresentable in the Stack-scoped context.
- Preserve listed Programme/Connect gates, implement unlisted provider choice, and require a pinned
  guide completion proof before manual/QR/iCal routes become legal.
- Give each page a native Stack entry with deterministic forward progress and ordinary Back.
- Provide accessible, localized, theme-aware loading, blocking recovery, image degradation, and
  privacy-bounded diagnostics.

**Non-Goals:**

- No catalogue publication or activation, feature-flag flip, runtime environment mutation, API or
  generated-client edit, storage of journey progress, WebView/AI/Markdown flow, calendar creation
  from a guide page, Groups/custom assistants, `fallbackAssistant`, dependency, or CMS work.
- No Flutter, web, server, native/store configuration, deployment, or workflow change.
- No integrated real-server/device proof owned by T4; T3 supplies deterministic Jest and existing
  CI-lane proof and records any applicable human-only device follow-up in the migration inbox.

## Decisions

### Decision 1 — One discriminated import-journey state owns legality

Replace the nullable draft plus independently optional guide fields with one reducer-managed union.
Its branches represent institution setup, programme, Connect, resolving, provider selection,
blocking error, active guide, and completed/manual import. Guide branches contain a normalized
draft identity, locale, catalogue version, provider snapshot, and `visitedThrough`; only the
completed branch contains completion proof. Provider pages are copied/frozen by the T2 resolver and
remain pinned until this journey is invalidated.

Every institution or programme mutation starts a new draft revision and drops resolution and
completion. Locale changes, provider changes, or a newly resolved catalogue version create a new
snapshot branch and likewise remove completion. The context stays mounted once around the
onboarding Stack, retains state while the process backgrounds, and resets structurally on Stack
unmount or process death.

Alternative rejected: independent nullable fields permit stale completion to survive a changed
draft. Route params or persistent storage would expose sensitive state, admit impossible
combinations, and violate the required lifetime.

### Decision 2 — A pure legal-route resolver drives every transition and guard

Centralize gate selection and recovery in pure functions consumed by screens and route guards.
Listed institutions honor `requireProgramme`; false writes an empty calendar name. They honor
`requireConnect` only when `safeIntranetUrl` succeeds; a required missing/unsafe URL records its
bounded reason and advances directly to exact-version guide resolution. Unlisted institutions
always visit the skippable Programme step, never Connect, and then resolve the active catalogue for
provider selection.

The dynamic guide route accepts only a parsed non-negative integer index. Page 0 may perform the
listed resolution; later indices require a pinned snapshot and `index <= visitedThrough`. Next
alone increments `visitedThrough` before `router.push`; final Next creates completion and pushes
manual import. Invalid/mismatched indices never clamp or complete. Manual requires the completion
branch; QR/iCal require a guarded manual handoff marker. Illegal direct/restored routes use
`router.replace` to a pure `earliestLegalRoute`: provider selection for a complete unlisted draft,
page 0 resolution for a complete listed draft, otherwise School. A target equal to the current
route renders recovery instead of replacing, preventing loops.

Only an explicit seed API gated by `isDevVariant()` may create a bypass state for tests. The
production reducer rejects the seed; no `__DEV__`, query parameter, or persisted value participates.

Alternative rejected: screen-local ad hoc redirects drift between manual, QR, and iCal routes and
make self-loops and deep-link bypasses difficult to prove.

### Decision 3 — Native routes are thin and pages are immutable Stack entries

Add a thin provider-selection route and a thin dynamic `[pageIndex]` export under the onboarding
route tree, both backed by `mobile/src/features/export-guides/ui/`. Register their native compact
Stack chrome explicitly. Provider selection renders every T2 `getSelectableExportGuideProviders`
result in server order and has no slug allowlist. A selection resolves and pins immediately; a
concurrent miss substitutes Generic through the existing resolver or enters blocking recovery if
the catalogue is unusable.

Guide pages render title, description, caption, and alternative text as React Native text/image
props only. They never parse markup or create links. `expo-image` failure changes only the image
region to a stable text-only placeholder with non-duplicated semantics; it cannot prevent Next.
Native header/iOS gesture/Android Back and any visible Back all pop exactly one entry. Completion
survives the manual-to-final-page pop within the same snapshot.

Alternative rejected: replacing a single route's index would erase page history; a WebView or rich
text renderer would add navigation and execution capabilities the schema deliberately excludes.

### Decision 4 — One coordinator owns single-flight loading and stale-result rejection

A feature hook/coordinator calls the T2 repository with one in-flight promise per requested
locale/selector. Retry returns that promise while active. Each request captures the current draft
revision and an attempt generation; completion is ignored after unmount, navigation away, draft or
locale change, or a newer attempt. All `source: "none"` outcomes map to a client-owned blocking
shell with Retry and ordinary Back; no error class unlocks manual import. Fresh network, matching
304, or LKG outcomes continue through the same resolver.

Alternative rejected: per-button calls can race and allow a stale exact catalogue to overwrite a
new institution or locale.

### Decision 5 — Accessibility and localization are shell contracts, not server conventions

Typed FR/EN resources own route titles, selector guidance, progress, loading, error/retry,
Back/Next, placeholder, and accessibility announcements. Server labels/copy/alt/captions remain
inert plain text. Pages use the readable lane, existing theme tokens, native Stack motion, live
reduced-motion behavior for any optional decorative motion, scalable text, and platform-minimum
targets. On a page push, a heading ref receives accessibility focus and announces localized
`pageIndex + 1` of total; traversal order is header, heading/progress, description, image or
placeholder/caption, then Next.

Alternative rejected: server-owned shell text would make route recovery unavailable when the
catalogue cannot load and could mix locales on failures.

### Decision 6 — Typed observability adapters enforce exact allowlists

Feature-owned event builders expose a closed union for the specification's nine Analytics events
and their exact enum/bounded-number/version/validated-slug parameters before calling `@/firebase`.
They accept no draft, route-param, URL, page-copy, payload, header, token, search, or raw-error
field. Expected network/HTTP/timeout/image failures stay Analytics-only. Only malformed invariants,
impossible transitions, or storage corruption create static sanitized `Error` values for
Crashlytics with enum-only context.

Alternative rejected: calling the generic Firebase seam throughout screens makes forbidden fields
easy to add and exact allowlists hard to test.

## Risks / Trade-offs

- [A broad context rewrite can regress existing create-field behavior] → Keep `toCreateFields`
  pure and compatible, cover each union branch, and change transitions through reducer actions.
- [Route history cannot itself prove how a page was reached] → Make `visitedThrough` advance only
  in the Next action and reject all other later-index entries.
- [A late repository result can revive an invalid journey] → Bind every completion to draft
  revision, locale, selector, and attempt generation.
- [Native accessibility focus differs by platform] → Isolate focus restoration behind a small
  adapter and test its calls, ordering, labels, and fallback announcements.
- [Physical device evidence is not runnable on this host] → Keep required component/navigation
  automation in T3 and record applicable named-device work as a human inbox item for T4 rather than
  weakening or blocking repository merge.

## Migration Plan

1. Introduce the reducer/state union and pure gate/route legality helpers while retaining create
   payload compatibility.
2. Add the coordinator, selector, guide page, telemetry adapters, translations, and thin routes;
   then guard manual/QR/iCal entry points.
3. Add journey, navigation, component, accessibility, localization, and privacy tests plus the
   route-structure proof exercised by the existing mobile CI lane.
4. Update ADR 047, navigation and feature guidance, and the Architecture Book changelog; run local
   TypeScript, lint, focused/full coverage, format, and strict OpenSpec validation.

Rollback is a normal revert before separate activation. The PR does not publish/activate a
catalogue or flip the production flag, so it performs no rollout act and has no data migration.

## Open Questions

None.
