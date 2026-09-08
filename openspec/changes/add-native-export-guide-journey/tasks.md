## 1. Journey state and gate decisions

- [x] 1.1 Replace the nullable onboarding draft state with the discriminated Stack-scoped journey
  reducer, immutable snapshot/completion branches, draft revisions, and invalidation actions; verify
  reducer/type tests cover institution, programme, provider, locale, version, background retention,
  Stack reset, and process-restart defaults while `toCreateFields` remains compatible.
- [x] 1.2 Add pure listed/unlisted Programme and Connect gate resolution, including empty programme
  storage, unlisted Connect exclusion, and safe/missing/unsafe URL decisions; verify the complete gate
  matrix and sanitized Connect-skip diagnostic arguments in focused journey tests.
- [x] 1.3 Add the pure earliest-legal-route and guarded-handoff model for guide/manual/QR/iCal entry,
  including no-self-replace recovery and the `isDevVariant()`-only seed seam; verify production,
  development, direct-link, restored-link, and process-death cases without `__DEV__`, params, or
  persistence enabling bypass.

## 2. Catalogue coordination and provider selection

- [x] 2.1 Implement the export-guide journey coordinator over the T2 repository/resolver with
  exact-versus-active selection, captured draft/locale/attempt identity, single-flight retry, and
  inert stale completions; verify network/304/LKG success and every `source: none` blocking class.
- [x] 2.2 Build the native unlisted provider selector from every ordered T2 selectable provider,
  with server labels/thumbnails as inert content, Generic substitution on a concurrent miss, and
  completion invalidation on change; verify a future compatible provider appears without a client
  slug allowlist and unlisted journeys never render Connect.

## 3. Native guide pages and protected routes

- [x] 3.1 Build the guide-page screen using pinned plain-text content, localized progress, readable
  safe layout, native Stack chrome, theme tokens, scalable text, platform targets, reduced-motion
  behavior, and heading focus restoration; verify FR/EN, light/dark, largest layouts,
  screen-reader order/progress/focus, and inert markup-shaped strings in component tests.
- [x] 3.2 Add validated `expo-image` presentation with correct alt/caption semantics and a stable
  non-blocking text-only failure state; verify page and thumbnail failures announce meaning once,
  expose no URL, and leave Next operable.
- [x] 3.3 Add thin provider-selection and dynamic guide-page route exports and explicitly register
  them in the onboarding Stack; extend route-structure tests to prove thin exports and compact native
  chrome so the existing `test-mobile` CI job fails on missing or implicit routes.
- [x] 3.4 Wire Next-only contiguous `router.push` transitions, final completion/manual handoff, and
  Back popping for header, iOS gesture, Android system, visible control, and manual-to-final-page;
  verify one Stack entry per page, invalid-index fail-closed behavior, every Back path, and no clamp
  or accidental completion in navigation tests.
- [x] 3.5 Apply the shared guard to manual import, QR scan, and iCal URL before any create action;
  verify legal completed flows preserve existing payload/success/failure behavior while every
  production deep link or restore recovers without loops.

## 4. Recovery, localization, and privacy

- [x] 4.1 Add typed FR/EN shell keys for selector, route titles, progress, loading, every blocking
  failure presentation, Retry, Back/Next, placeholder, and accessibility announcements; verify
  locale key parity and unsupported device-language fallback to English before catalogue loading.
- [x] 4.2 Build the blocking loading/error surface with ordinary Back, screen-reader live status,
  and single-flight Retry that stays available across failures; verify repeated taps, navigation
  away, unmount, late completion, and successful retry behavior for every failure enum.
- [x] 4.3 Add closed typed builders for all nine export-guide Analytics events and sanitized
  invariant/storage Crashlytics calls through `@/firebase`; verify exact event/parameter allowlists,
  bounded values, and absence of school/programme data, routes, URLs, tokens, search text, copy,
  payloads, headers, and raw errors using distinctive forbidden fixtures.

## 5. Architecture and completion proof

- [x] 5.1 Update ADR 047 to make completed-guide route legality current, update `navigation.md` and
  feature guidance for the selector/dynamic routes and ephemeral state, and add the Architecture
  Book `CHANGELOG.md` entry; verify no obsolete production no-draft or Connect-to-manual statement
  remains and add a new ADR only if implementation introduces another costly-to-reverse rule.
- [ ] 5.2 Run formatting plus focused journey, navigation, route-structure, component, localization,
  image, and observability suites; then run `npx tsc --noEmit`, `npm run lint`, and
  `npm test -- --coverage` from `mobile/`, preserving 90% logic and 70% global thresholds.
- [ ] 5.3 Run `openspec validate add-native-export-guide-journey --strict`, inspect the final diff
  for scope and disclosure safety, and confirm the branch changes none of the OpenAPI/generated API,
  server, storage schema, native/store configuration, workflow, Flutter, web, deployment,
  catalogue-activation, or production-flag surfaces.
