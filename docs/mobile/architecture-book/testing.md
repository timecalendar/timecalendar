# Testing

The testing rules for `mobile/`. R-1 pointer convention: entries point at the live gate, file, or spec that enforces a rule rather than re-deriving it, and carry only the caveats tooling can't.

## Unit / component harness — `jest-expo`

- Shared root-page proofs cover compact/tablet measured lanes, caption-only intros, root-route
  classification, recursive nested-onboarding registration, `StatusView` screen and section composition, local light/dark artwork,
  semantic action colors and platform targets, and iOS/Android keyboard-avoidance structure.
  Consumer suites retain responsibility for every feature-owned title/action, content owner,
  loading/empty/error/populated rhythm, Activity pagination, Hidden-event filtering and write
  failures, normal localized Settings section casing, About's single-gutter prose geometry, Home's
  shared section-empty rhythm, and Feedback/Programme/personal-event keyboard-safe body/action
  ownership and behavior/selectors. Native keyboard and assistive-technology
  rendering stays device evidence under ADR [054](./decisions/054-shared-root-page-semantics.md).

- **`jest-expo` preset** owns the transform/ignore lists (the RN failure mode the preset exists to prevent — no hand-rolled transform config). `@testing-library/react-native`; tests colocated as `*.test.ts(x)` next to source. `npm test` = `jest --ci`, the same entrypoint locally and in CI (like lint).
- **Mock at the `customFetch` seam, not the network.** Data-layer tests `jest.mock` `src/api/mutator` and drive the _real_ generated Orval hook + a real `QueryClient` — the mutator is the designed seam (see Data layer), so mocking there exercises everything above it without a server. Test-owned clients come from `src/test-support/query-client.tsx`: its stable provider/client pair disables query and mutation retries, uses timer-free `gcTime: Infinity` defaults, and exposes targeted cache clearing for teardown. A focused cache-expiry proof may override those defaults explicitly, but must control its timers and clear its client before returning. `src/features/school-selection/data/queries.test.ts` is the reference. The posture is two-layered: the feature `data/` suite owns the mutator-mock proof, and the presentational `ui/` screen suite above it mocks the feature's own `data/` hook (keeping the pure helpers real via `requireActual`) — e.g. `school-picker-screen.test.tsx` mocks `useSchools`, not the mutator, because the hook→DTO mapping is already proven a layer down.
- The export-guide repository follows the same seam at its response-aware variant: repository tests
  mock `customFetchResponse` and drive the real generated plain operation. Only
  `src/api/mutator.test.ts` mocks `globalThis.fetch`; it owns status/header/body parsing, byte
  ceiling, timeout/cancellation, and payload-free transport diagnostics.
- Notification synchronization controller tests use controlled promises to hold generation A while
  generation B invalidates it, then settle success and failure in both current and stale runtime
  epochs. Fake timers prove the finite active retry sequence. Restart tests keep only a Map-backed
  storage disk across `jest.resetModules()` and recreate the preferences/runtime modules, proving
  dirty replay is rebuilt from canonical inputs rather than a persisted token or DTO. The generated
  plain PUT is exercised by mocking `customFetch`, never the network.
- Native notification-control proof layers pure preset/validation tables, SwiftUI/Compose numeric
  editor contracts, iOS child-route and Android dialog behavior, localized summaries, retained
  off-state values, setter cardinality, route inventory, and a repository ownership contract.
  Automation does not claim form-sheet geometry, keyboard reachability, Back/swipe feel, physical
  phone/tablet layout, themes, large text, or VoiceOver/TalkBack quality; those remain owner-led
  device acceptance under project decision D05.
- **Mock the `@/db` seam via the shared `src/test-support/fake-db.ts` (`createFakeDb`).** Repository + restart tests `jest.mock("@/db", () => mockFake.module)` against one stateful, spy-instrumented Map-backed fake instead of hand-rolling the query-builder per file — its `spies` serve the query-shape assertions, its per-table stores survive `jest.resetModules()` for the on-disk-survives-a-restart proof, and `seed()`/`reset()` drive read rows and `beforeEach`. Consumers MUST name the instance `mock`-prefixed (`const mockFake = …`) so `babel-plugin-jest-hoist` lets the hoisted factory close over it.
- **Checklist-progress tests prove both ownership and renderer identity.** The feature
  data suite asserts one projected UID-set live read, imported-row semantics, and
  mutation notifications. Home/Calendar suites mock the feature hook at the screen
  boundary; CalendarKit's focused rerender test asserts a progress-only change retains
  the projected vendor array and objects.
- **Coverage** is collected via `npm test -- --coverage`. The `coverageThreshold` is **enforced** — 90% logic / 70% global; see [ADR 003](./decisions/003-coverage-threshold.md). Gated by the `test-mobile` job (R-1).
- **`src/design/button/button.tsx` and `src/design/button/button-row.tsx` have their own 90%
  lines/branches keys** in `coverageThreshold`: `Button` carries every button's states and
  platform branches, and `ButtonRow` its two layouts (ADR [067](./decisions/067-button-family.md)).
  `button-row.test.tsx` mocks `react-native/Libraries/Utilities/useWindowDimensions` for the font
  scale, as `src/theme/text-scale.test.ts` does. `button.test.tsx` reads the `Pressable`'s own props
  (style callback, `android_ripple`) through a module mock of
  `react-native/Libraries/Components/Pressable/Pressable`, since the host view only receives the
  resolved style. `MinTouchTarget` resolves at module load, so a test under `usePlatform` compares
  against the imported token; `src/theme/theme.test.tsx` pins its per-platform value.
- **The raw-button allowlist is a contract test.** `tools/eslint-rules/raw-button-allowlist.test.js`
  lints each allowlisted file with only `local/no-raw-button` and fails on a stale, missing or
  duplicate entry and on growth past `RAW_BUTTON_ALLOWLIST_CEILING`
  ([lint-format.md](./lint-format.md) → Buttons).
- **`src/design/status/status-view.tsx` has its own 90% lines/branches key** in
  `coverageThreshold` (ADR [069](./decisions/069-status-view.md)).
  The Jest window reports `fontScale` 2, at or above the accessibility text-size threshold, so
  `StatusView` artwork is not rendered by default; a test that expects artwork mocks
  `useWindowDimensions` or spies `Dimensions.get` with `fontScale: 1`. The RN mock's
  `AccessibilityInfo.announceForAccessibilityWithOptions` is one shared `jest.fn`, so an
  announcement-count assertion calls `mockClear()` after spying.
- **`src/design/field/text-field.tsx`, `src/design/field/date-time-field.tsx` and
  `src/design/field/field-error-hint.ts` have their own 90% lines/branches keys** in
  `coverageThreshold` (ADR [070](./decisions/070-text-field.md)). The field tests run both
  platforms with `usePlatform` and drive the font scale by mocking `useWindowDimensions`; the date
  field's fixtures are built in the display zone, so they pass in the time-zone matrix.
- **`src/design/list/list-row.tsx`, `list-section.tsx`, `separator.tsx`, `list-row-position.ts`,
  `separator-inset.ts` and the chrome modules `src/components/chrome/compose-semantics.ts`,
  `list-palette.ts` and `native-list-position.ts` have their own 90% lines/branches keys** in `coverageThreshold` (ADR [073](./decisions/073-list-row-family.md)).
  The list tests run both platforms with `usePlatform`; the iOS grouped radius reads
  `Platform.Version`, a getter, so tests mock it with `jest.spyOn(Platform, "Version", "get")`.
  The ad-hoc-separator allowlist is a contract test like the raw-text-input one below.
- **The raw-text-input allowlist is a contract test.**
  `tools/eslint-rules/raw-text-input-allowlist.test.js` lints each allowlisted file with only
  `local/no-raw-text-input` and fails on a stale, missing or duplicate entry and on growth past
  `RAW_TEXT_INPUT_ALLOWLIST_CEILING` ([lint-format.md](./lint-format.md) → Fields).
- **The ad-hoc-status allowlist is a contract test.**
  `tools/eslint-rules/ad-hoc-status-allowlist.test.js` lints each allowlisted file with only
  `local/no-ad-hoc-status` and fails on a stale, missing or duplicate entry and on growth past
  `AD_HOC_STATUS_ALLOWLIST_CEILING` ([lint-format.md](./lint-format.md) → Status).
- **Calendar T05 proof** combines total preference/reset tests, pure display-zone civil
  transition tables, one/five/seven-column renderer and stale-event tests, screen/menu/i18n
  integration, and `calendar-owned-shell.contract.test.ts`. Native partial-drag feel, restart,
  visible-hour continuity, platform menus, and assistive technology remain revision-bound owner
  checks; host tests do not claim them.
- **Calendar T06 zoom proof** adds 100%-targeted pure focal/clamp properties, total shared
  preference/reset coverage, real-screen center-command and limit-state tests, pinch lifecycle and
  settlement tests, and repository inventory assertions for one native vertical scroll owner, one
  windowed horizontal pager and no per-frame React-state or `runOnJS` path. Host tests do not claim native
  recognizer precedence, release feel, assistive announcements or low-end timing; those stay in
  the revision-bound device worksheet and final T28 matrix.
- **Calendar T07 resize proof** adds a pure atomic geometry model, clock-anchor/boundary tables,
  geometry-revision cancellation tests, one/five/seven-column component coverage, the singular
  owner repository contract, source-config tests, and disposable iOS/Android generated assertions.
  Host automation does not claim physical rotation, multitasking, gesture feel, or native chrome;
  those remain exact-build owner evidence and the final T28 matrix.
- **Calendar T08 current-time proof** combines deterministic helper tables, a fake-timer clock-hook
  suite, renderer/screen rollover and visibility cases, and
  `calendar-owned-shell.contract.test.ts`. The contract identifies the focus- and AppState-gated
  minute clock as the only calendar timer owner, checks teardown and minute alignment, keeps the
  renderer timer-free, and rejects repeating animation work. Host tests do not claim device
  appearance, assistive-technology quality, or physical background behavior.
- **Calendar T09 ordinary timed-event proof** combines 100% statement/branch coverage for the pure
  decoder, page index/window/chunk planners, support classifier, and immutable presentation builder; fake-database
  SQL-shape tests; malformed-sibling/privacy-safe diagnostic tests; and renderer/screen proofs for
  actual-time geometry, one committed-page label, checklist projection, and original-UID routing.
  The repository contract excludes generated API/fetch/sync dependencies from page navigation.
  Offline native paging, screen-reader quality, and synced read-only/personal editable details remain
  exact-build owner checks and are never inferred from Jest.
- **Calendar E06 accessible paging proof** checks the sole plain adjustable header control,
  scroll-view exposure, hidden neighbour pages, in-flight action guard, settled-context
  announcements, page-key focus memory and route-return restoration. The shared reduced-motion
  hook proves initial read, live changes and listener teardown; pager tests prove one-page
  animation, distant jump then animation, and direct reduced-motion placement. Host tests do
  not certify VoiceOver, TalkBack, large-text layout, or physical focus behavior. The native
  focus observer now emits a page key, so assistive-technology checks require a rebuilt binary
  at the exact tested revision.
- **An explicit per-test time budget — `testTimeout: 30000` ([ADR 044](./decisions/044-jest-per-test-time-budget.md)).** RN/Expo host components register lazily on first render, so the one-time cost lands on whichever test mounts them first; ADR 044 is the canonical record of the load-regime measurements and sizing rationale. `mobile/jest.config.test.ts` guards the key against drift (floor 20 000 ms), the way `app.config.test.ts` guards config shape in the same job. **The budget bounds how long a test may take to execute; it is never a reason to lengthen a `waitFor`/`findBy`, add a retry, or weaken a matcher** — settling a red test that way converts an intermittent into an invisible one.
- **Reset suite-owned spy state through exception-safe teardown before another test runs.** Clear owned call history and reset queued one-shot implementations to their harness defaults from an `afterEach` `finally` path, while preserving persistent spies installed by `jest/setup-*.ts`; do not substitute blanket global resets or restores. `src/features/splash/ui/splash-screen.test.tsx` is the concrete pattern: its dismissal block clears `Animated.timing`, resets the reduced-motion queue to resolved `false`, and restores real timers without removing the `jest/setup-splash.ts` spy wrappers.
- **Restore every `Platform.OS` override before the next test, including when the overriding test throws.** `usePlatform` from `src/test-support/platform.ts` is the mechanism for a `describe`-scoped override; a `try`/`finally` that restores the captured original is equally conforming. Tests must not call `jest.replaceProperty(Platform, "OS", …)` inline in an `it`, and must not rely on `jest.restoreAllMocks()` for the restore — the latter would also discard the suite-wide `AccessibilityInfo` spies from `jest/setup-splash.ts`.
- **Await React Native Testing Library 14 helpers and tear down suite-owned state in `afterEach`.** `render`, `renderHook`, `fireEvent`, and RNTL's exported `act` are asynchronous; every call must settle inside the test that starts it, and `fireEvent` must not be wrapped in a redundant outer `act`. One-shot mock queues, per-case spy implementations, and test-written storage keys belong to the suite that mutates them: reset or remove them with targeted `afterEach` cleanup, then reinstall deterministic defaults in `beforeEach`. Never use `jest.restoreAllMocks()` for this cleanup because it also removes harness-installed native spies such as `AccessibilityInfo` from `jest/setup-splash.ts`. The randomized-order regression proof is specified by `openspec/specs/mobile-test-harness/spec.md`.
- **Use the supported Reanimated/Worklets Jest implementations for feature-owned animation.** `jest/setup-reanimated.ts` installs Worklets' package mock and Reanimated's package mock through the ordinary Jest entrypoint, then calls `setUpTests()`. Component suites assert rendered end states and user behavior; focused lifecycle tests may inspect the wrapped `withTiming` and `cancelAnimation` calls. Do not handwrite a worklet runtime, loosen timers, or substitute React Native `Animated` call-shape assertions.
- **Native composed chrome is mocked at each platform package subpath.** The suite-wide Expo UI mock
  preserves native observable-buffer reads, field changes, disabled/busy state, dialog properties,
  dismissal callbacks, modifier selectors, and children. Chrome tests prove SwiftUI versus Material
  3 primitive selection, current-buffer submission, retained draft, outside/Back policy, and
  keyboard/focus layout ownership. They do not claim rendered keyboard, rotation, Dynamic Type, or
  screen-reader behavior; those remain the linked device-evidence pass under ADR 056.
- **SwiftUI container mocks throw on an identifier.** In `jest/setup-expo-ui.ts`, `Form`,
  `Section`, `Group`, the stacks and `BottomSheet` throw when given a `testID` or an
  `accessibilityIdentifier` modifier, and `Host` throws for the modifier, because SwiftUI cascades a
  container identifier onto every child. This catches what lint L12 cannot follow (spread props,
  modifier arrays from another module). The SwiftUI mock includes `DatePicker`, which keeps its
  `title`, `range`, `displayedComponents` and `modifiers` on the element for assertions. `Group` renders with the fixed `testID` `swiftui-group` so
  tests can read the sheet's modifiers ([theming.md](./theming.md) → Identifiers).
- **The Expo UI mock derives a Compose role only from real semantics.** `selectableProps` in
  `jest/setup-expo-ui.ts` gives a node a role from `selectable` (radio), `toggleable` (switch) or
  the `timecalendarSemantics` modifier's `role`, and projects that modifier's
  `contentDescription` to `accessibilityLabel`. A bare `clickable` projects as an unlabeled node
  without a role, which is what TalkBack meets, so the registry a11y check reports it.
- **Native settings chrome has a focused contract suite.** It proves SwiftUI versus Material host
  selection, resolved-scheme propagation, one Form/LazyColumn scroll owner, closed row semantics,
  switch single activation, checkmarked/radio selection, and dialog cancellation. Settings, About,
  Environment, language, and locale-synchronizer suites own feature behavior. Geometry, ripple,
  large text, and screen-reader traversal remain the owner device checklist under ADR 060.
- **Gallery fixtures are a test matrix.** `src/design/gallery/registry.test.ts` fails on an
  unregistered or extra `*.gallery.tsx` file, a duplicate meta id, title or story id, a story export
  missing from (or listed twice in) its meta's `stories` order, a story with neither `render` nor
  `args`, a React error in any story in light or dark on each platform branch the story declares,
  and an interactive element without a role and label, nested controls included, unless that exact
  violation is listed in `known-a11y-violations.ts`; a listed entry that no longer reproduces fails
  too ([accessibility.md](./accessibility.md) → Proof in CI).
  `src/design/gallery/no-storybook.contract.test.ts` fails on a Storybook or `react-native-web`
  dependency or configuration directory (ADR 064). `src/design/gallery/*.ts` is in the 90% lines and
  branches tier (`index.ts`, the `@/design/gallery` entry, included); fixtures under `src/design/`
  and `src/components/chrome/`, and `story-content.tsx`, sit in the 70% global floor, and
  `src/theme/tokens.gallery.tsx` in the `src/theme/**` 90% tier.
- **Three contract tests hold the design layer's shape** (ADR
  [068](./decisions/068-design-layer-barrel-and-gallery-entry.md)):
  `src/design/import-graph.contract.test.ts` parses every non-test `src/**/*.ts(x)` with the
  TypeScript compiler, builds the value-import graph (type-only imports skipped, `@/` and `./`
  resolved, platform files followed, an unresolved specifier fails) and asserts that the `@/design`
  barrel reaches no gallery module, that only the developer UI, developer routes, fixtures and
  `src/design/gallery/` reach one (Settings included in the check), and that no require cycle
  passes through `src/design/`; each failure prints a witness import path. It is the bundle sanity
  check: Metro ships every route, so what matters is which modules evaluate gallery code.
  `src/components/shell.contract.test.ts` fails on any top-level entry of `src/components/` other
  than the app shell and `chrome/`. `tools/eslint-rules/design-import-policy.test.js` computes the
  effective `no-restricted-imports` options per file class in a child Node process (ESLint cannot
  load its config under Jest's module resolution) and pins the design, route-entrypoint, storage,
  chrome-seam and `SymbolView` bans.
- **Every design primitive ships with a fixture and a test (L10).**
  `src/design/gallery/fixture-coverage.contract.test.ts` fails, naming the module, when a `.tsx`
  under `src/design/` (other than tests, fixtures and the `galleryInfrastructure` list) has no
  sibling `*.gallery.tsx` or `*.test.tsx`, and fails when a `galleryInfrastructure` entry no longer
  exists.
- **A stateful fixture has a `*.gallery.test.tsx`** next to it that drives its stories (presses,
  dialog close and reopen, menu selection, a date pick), using the suite-wide native mocks. The
  `@expo/ui/community/menu` mock wraps the trigger as each platform does: a button on iOS (the
  SwiftUI `Menu` label); on Android a `Pressable` with `accessible={false}` whose press opens the
  menu, while the children carry their own role (`MenuView.android.tsx`). The `@expo/ui/community/datetime-picker` mock forwards its props and maps `disabled`; its Android date mode (`mode` `date` or `datetime`) confirms the UTC-midnight day 5 January, as Compose does, with the event `buildChangeEvent` builds from that Date. No fixture opens on 5 January, so a gallery test proves a pick reaches the row.

## Time zones

- **The unit suite passes in any process zone.** Fixtures are built in the zone under display
  (`new Date(y, m, d, h)` when the preference is "system", `fromZonedTime` for a named zone), and
  expectations come from the same zone-aware helpers the code uses. A test never hard-codes a
  calendar day derived from a `Z` instant.
- **CI runs the full suite under three zones.** `test-mobile-timezones` in `ci-mobile.yml` runs
  `npm test` once per leg under `Pacific/Kiritimati` (+14), `Pacific/Pago_Pago` (−11) and
  `America/St_Johns` (−03:30/−02:30, DST), with `fail-fast: false`, beside the `TZ: UTC` coverage
  run in `test-mobile` (ADR [066](./decisions/066-device-local-date-picker-seam-and-timezone-ci.md)).
- **`npm run test:timezones`** reproduces the matrix locally (`scripts/test-timezones.sh`), one
  zone after the other, stopping at the first failing zone. Extra arguments go to Jest.
- **`mobile/ci-timezones.contract.test.ts`** pins the job, the three zones, the `TZ` envs, the
  local script, and checks that the process zone reached the Jest worker.
- **Device-local field math on an event instant is caught by this matrix, not by lint**
  (ADR [035](./decisions/035-display-timezone-preference.md)). The `toZonedTime` proxy pattern
  relies on device-local getters, so a syntactic ban would be noise. The one named trap,
  `date-fns-tz` `getTimezoneOffset`, is lint L11 ([lint-format.md](./lint-format.md)).
  `mobile/eslint-l11.contract.test.ts` lints every static and dynamic import form through the real
  ESLint config.

## E2E — Maestro, real round-trip

- **Three durable journeys, and only three (ADR [057](./decisions/057-three-journey-native-smoke-budget.md)).** The top-level lexical inventory is fresh-user listed-school/programme URL import with a real server round trip and synced details; Calendar-surface personal-event create/edit/restart/delete; and subscribed-calendar hide/restart/restore/restart with rendered schedule proof. Reusable YAML lives only under `mobile/.maestro/helpers/`. A fourth top-level YAML fails baseline CI. Prefer replacing a lower-value journey or adding a deterministic lower-level test; increasing beyond five requires a new board decision.
- **One Android-only accessibility assertion.** Flow 03 asserts the user-calendar row's content
  description (the hint "Opens this calendar's settings") on Android inside a
  `runFlow when platform: Android` block, the device proof of the `timecalendarSemantics`
  modifier (ADR [073](./decisions/073-list-row-family.md)). It adds no selector `id`.
- **Real data and persistence.** The import journey submits the test-only, Swagger-excluded backend fixture at `http://127.0.0.1:3005/__e2e/ical/import.ics`; its next-UTC-day title is date-neutral and the real calendar-create/fetch/parse/persist path owns it. The visibility journey uses the nested seeded-token helper and leaves visibility restored. The personal-event journey writes the real device SQLite database and never drives native date/time pickers.
- **Process isolation and recovery stay structural (ADR [038](./decisions/038-isolate-maestro-flow-lifecycles.md)).** `run_e2e.sh` boots the shared server lifecycle once, runs each top-level flow in its own Maestro process, stops on the first terminal failure, and tears down once; `--keep-up` remains the debugging escape hatch. iOS may spend up to four whole-flow attempts only on structurally classified startup failures. The classifier and mutation fixtures remain device-free and unchanged in meaning.
- **Baseline gates own inventory and selector integrity.** `mobile/e2e/maestro-selectors.test.ts` recursively scans journeys and helpers, resolves anchored `id:` regexes against literal/object/template-family `testID`s, rejects bare `back` and `hideKeyboard`, enforces cross-platform `"<title>(,.*)?"` selectors, and pins positive anchors before negative outcomes. `mobile/e2e/test_run_e2e.sh` independently proves the exact three-file inventory, lexical process isolation, nested-helper exclusion, teardown, terminal stop, `--keep-up`, and classifier mutations.
- **Daily smoke is not release-candidate acceptance.** ADR [055](./decisions/055-native-e2e-daily-health-signal.md) still owns daily/manual cadence and immutable both-platform targets. Broader Phase 10 parity—including notifications, assistant, migration, settings, detailed ordering, and UI-polish variants—is human-directed exploratory acceptance for a release candidate, not extra daily device flows. The removed-flow coverage map is maintained in `mobile/e2e/README.md`; add lower-level coverage only for a demonstrated valuable gap.
- **Shared server lifecycle.** The server half is owned by `ci/e2e-server.sh` (compose-first, `--native` for Docker-less macOS) — the same lifecycle the Flutter harness uses. See the `e2e-server-lifecycle` spec; do not re-hand-roll server boot/seed/teardown in a harness.
- **"E2E" means two different things — keep them apart.** `server/npm run test:e2e` (config `server/test/jest-e2e.json`, specs `server/test/*.e2e-spec.ts`) is a small **in-process Nest HTTP smoke**: it boots a Nest testing module and asserts a real route over Supertest, with **no** Firebase key, Postgres, Redis, or queue worker. It has its own discovery root (`test/`, `*.e2e-spec.ts`) so `npm test` — rooted at `server/src`, with the worker-isolated database setup — never rediscovers it, and vice versa. It runs as its own **`Run server E2E tests`** step in `ci-build-deploy.yml`'s `test` job, so a missing config, zero discovered specs, or a broken assertion fails CI by name. It is a harness/contract-regression proof, **not** broad endpoint coverage, and it does **not** replace `ci/e2e-server.sh`, which keeps sole ownership of the real-backend boot/seed/logs/teardown behind the Maestro and legacy Flutter device E2E. A spec that needs a backing service belongs in the `server/src` suite (which owns database provisioning) or behind `ci/e2e-server.sh` — never bolted onto this smoke. `--passWithNoTests` is banned here: an empty E2E suite must stay red.
- **Local server dependencies.** OpenAPI generation and server tests that need backing services use `bin/server-compose.sh up -d postgres redis` from the repository root. This is the reusable nginx-free prerequisite; alternate `TIMECALENDAR_POSTGRES_PORT` / `TIMECALENDAR_REDIS_PORT` values require matching test-profile `DATABASE_URL` / `REDIS_URL` values on the server command. This local entrypoint does not replace `ci/e2e-server.sh`, which retains ownership of E2E boot, seed, logs, and teardown.
- **E2E builds are release-config, no Metro, with an explicit local-backend contract.** CI builds on GitHub runners via `expo prebuild` + native tooling (Android: Gradle `assembleRelease` → `adb install`; iOS: `xcodebuild -configuration Release -sdk iphonesimulator` → `simctl install`) — never EAS, never debug+Metro. Every prebuild and release-compilation step explicitly sets `APP_VARIANT=development`, `BACKEND_ENVIRONMENT_CAPABILITY=development`, and the platform-local `EXPO_PUBLIC_API_URL`: `http://10.0.2.2:3005` (Android emulator → host) / `http://localhost:3005` (iOS simulator). `mobile/e2e/test_ci_mobile_e2e.sh` enforces the complete step-scoped contract.

## Dev-variant network exceptions

- **Local-server access rides the `development` variant only**, in `app.config.ts`: Android `usesCleartextTraffic: true` (via `expo-build-properties` — release builds block cleartext HTTP by default, which would silently break the `10.0.2.2` call) and iOS `NSAppTransportSecurity.NSAllowsLocalNetworking` (belt-and-braces over ATS's loopback exemption). **Production identity is untouched — the store app can never talk cleartext.** Verified by `expo config --json` diff between variants; can't be a lint rule (config-shape, not source), hence this prose (R-1).

## CI topology

The time-zone catalog generator has a deterministic `--check` mode. Focused mobile proofs cover
exact aliases, localized/accent-normalized search, runtime availability, fractional current
offsets, preference memory, the Router native boundary, one lazy-list owner, and unchanged event
and notification resolver seams. The unchanged server validator has a representative compatibility
table. Native sheet/search placement remains project-owner device evidence under D05.

- `test-mobile` fetches full Git history, runs the deterministic E2E harness regression, installs
  the mobile lockfile, blocks new React Doctor warnings/errors relative to `origin/main`, then runs
  gen-drift, tsc, lint, and Jest under `TZ: UTC` with coverage. `test-mobile-timezones` runs Jest
  without coverage under the three matrix zones (Time zones). The full React Doctor inventory remains the advisory command and
  normalized report defined by ADR [053](./decisions/053-react-doctor-changed-code-gate.md).
  `e2e-mobile-android` (ubuntu, KVM emulator, reuses the `build-server` image artifact via
  `E2E_SERVER_IMAGE`) and `e2e-mobile-ios` (macOS runner, Postgres/Redis provisioned natively
  because GitHub macOS runners have no Docker — the `--native` seam). Both upload Maestro debug
  output + server logs on failure (R-1).
- The Jest run includes the native-contract mocks: the SwiftUI container mocks throw on an
  identifier (L12), the suite-wide Android date mock confirms 5 January with a Compose-shaped
  event, the RuleTester suites under `tools/eslint-rules/`, and `eslint-l11.contract.test.ts`.
- This development host has no KVM or iOS simulator, so local work proves server/Jest integration, TypeScript, lint, coverage, wrapper behavior, Maestro syntax, and workflow structure but never claims native execution. The next daily run or a deliberate manual ref/SHA dispatch supplies informational Android/iOS health evidence; physical-device checks remain separate non-blocking evidence.

### Workflow split + daily/manual E2E

Workflows are split by concern; native E2E is **not** run on every push (cold native build + device boot is ~20–30 min/platform — toolchain cost, not app size).

- **`ci-build-deploy.yml`** — server/web images, server tests, deploy (every push; deploy self-gates to main/production).
- **`ci-mobile.yml`** — `test-mobile` (gen-drift, tsc, lint, Jest under `TZ: UTC` with coverage) and `test-mobile-timezones` (Jest in three zones, see Time zones); path-filtered to `mobile/**` + `openapi/**` + **`.github/workflows/ci-mobile-e2e.yml`**. It also runs `test_run_e2e.sh` and mutation-backed `test_ci_mobile_e2e.sh` — pure bash + node, no device. These are ordinary pull-request gates even though the native workflow itself has no pull-request trigger.
- **`ci-mobile-e2e.yml`** — one daily schedule on `main` plus required-ref manual dispatch. Every scheduled and manual run resolves one immutable target, builds the server image and runs Android and iOS against it. No job or step is skipped, so a run's conclusion is the lane's state: `test_ci_mobile_e2e.sh` rejects job conditions, step conditions other than `if: failure()`, `continue-on-error` and change-detection outputs, each with a mutation. Daily and manual invocations serialize without cancellation, and platform failures retain Maestro debug output plus server logs (ADR [071](./decisions/071-native-e2e-runs-every-scheduled-day.md), [055](./decisions/055-native-e2e-daily-health-signal.md)).
- **`ci-flutter.yml`** — legacy `test-app` + Flutter `test-e2e`, demoted to main/production pushes touching `app/**` (R-5 bounded maintenance).
- **Branch-protection caveat:** path-filtered jobs that are skipped don't report a status — if any of these become _required_ checks, a skip can block a PR. None are required today.

## Recorded debt — CI E2E caching speedups (not yet done)

Native E2E runs cold every time in CI (local builds are fast only because Gradle/DerivedData/Pods caches persist on disk). Deferred speedups: ① **AVD snapshot caching** for the Android emulator (skip cold boot); ② **iOS DerivedData cache** keyed on the lockfile (point `xcodebuild -derivedDataPath` outside the `prebuild --clean` tree so it survives); ③ confirm the **Gradle build cache** (not just deps) is active. Realistic gain ~Android 28→18 min, iOS 18→10 min on warm caches. Orthogonal to the on-demand split above. **Trigger:** when E2E run time becomes a friction point. Roadmap mirror: `docs/react-native-migration/01-roadmap/01-foundation.md` step 5.

Same class, the unit gate: **CI restores no Jest transform cache** — `ci-mobile.yml` caches npm only, so every `test-mobile` run pays the full cold transform, which is what put the harness's first-render cost against the per-test budget in the first place ([ADR 044](./decisions/044-jest-per-test-time-budget.md)). Caching Jest's `cacheDirectory` keyed on the lockfile would cut both the run time and the headroom problem at its source. Out of scope where it was found (TIM-273 excludes `.github/workflows/**`). **Trigger:** the next time the gate's wall clock or its timeout headroom becomes a problem.

## Tiny and malformed Calendar event proof

T10's fabricated fixtures cover a noon point, a two-minute class, absent and long text, arbitrary and
invalid colors, mixed malformed optional arrays, missing/invalid/reversed required dates, and a valid
Maths sibling. Pure decoder, range, support, title, color, presentation and geometry suites prove boundary
membership, total normalization, deterministic contrast and exact/clamped geometry. Renderer, screen,
details, Agenda, Home and real-catalog tests prove one semantic target, complete labels, original-UID
activation and localized fallback. The Calendar-owned-shell contract keeps one vertical/horizontal scroll and pinch tree and
bans vendor, compatibility, network and sensitive-surface dependencies.

These host checks are structural evidence only. They do not certify physical 44pt/48dp target feel,
movement cancellation feel, increased-contrast rendering, large text, VoiceOver or TalkBack; T28 owns
that device matrix.

## Simultaneous Calendar event proof

T11 adds 100%-covered pure overlap and target-conflict planners. Seeded permutations prove ordinal
source/UID ordering, half-open adjacency, lowest-column reuse, minimum concurrency, equal fractional
bounds, and non-covering time-overlap pairs. Presentation tests prove complete off-screen/transitive day
clusters are prepared before viewport projection and remain stable across input order, viewport, and zoom.

The fixed UTC fabricated week identifies 16 events: adjacent blocks, two-, three-, and five-way clusters,
identical bounds, a point, and a tiny interval. Renderer and Calendar-screen tests prove 16 mounted visuals,
one direct semantic target per distinct rectangle or one chooser trigger per conflict, complete modal labels,
Cancel/Back/replacement dismissal, movement cancellation, and exact original-UID routing for synced and
personal events. Gesture frames project prepared minute/fraction geometry; the repository contract rejects
renderer packing/sorting, database work, hidden density caps, compatibility renderers, and extra motion
owners. These are first populated-surface fabricated measurements, not supported-density or p50/p95 claims.
Host automation does not certify physical target feel or VoiceOver/TalkBack modal quality; T28 retains that
device evidence.
