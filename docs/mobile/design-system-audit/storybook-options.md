# Component workshop options: Storybook or an in-house gallery

Date: 2026-10-25. Scope: `mobile/` (Expo SDK 56, React Native 0.85.3, React 19.2.3, iOS and Android only).

This document compares four ways to give the mobile app a component workshop, meaning a place
to see each component in isolation, in every state, on a real device. It ends with one
recommendation and a wiring sketch. Nothing here changes app code.

## Sources

Project files (paths are relative to the repository root):

- `mobile/package.json`, `mobile/app.config.ts`, `mobile/eas.json`, `mobile/metro.config.js`,
  `mobile/babel.config.js`, `mobile/jest.config.js`, `mobile/calendar-owned-shell.contract.test.ts`
- `mobile/src/app/settings-gallery.tsx`, `mobile/src/features/settings/ui/settings-gallery-screen.tsx`,
  `mobile/src/config/variant.ts`, `mobile/src/config/backend-environment.ts`,
  `mobile/src/features/paging-spike/ui/paging-spike-screen.tsx`
- `docs/mobile/architecture-book/`: `architecture.md`, `eas.md`, `runtime.md`, `testing.md`,
  `navigation.md`, ADRs 007, 030, 037, 040, 057
- Installed tooling source: `mobile/node_modules/@expo/fingerprint` 0.19.4
  (`build/sourcer/Sourcer.js`, `Expo.js`, `Bare.js`, `Packages.js`) and
  `mobile/node_modules/expo-modules-autolinking` 56.0.15 (`build/dependencies/resolution.js`)

External sources:

- context7 `/storybookjs/react-native` (v10 docs, `MIGRATION.md`, `PORTABLE_STORIES.md`)
- context7 `/storybookjs/storybook/v10.2.9` (`docs/get-started/frameworks/react-native-web-vite.mdx`)
- GitHub `storybookjs/react-native` at tag `v10.7.0`:
  [`docs/docs/intro/getting-started/index.md`](https://github.com/storybookjs/react-native/blob/v10.7.0/docs/docs/intro/getting-started/index.md),
  [`expo-router.md`](https://github.com/storybookjs/react-native/blob/v10.7.0/docs/docs/intro/getting-started/expo-router.md),
  [`metro-configuration.md`](https://github.com/storybookjs/react-native/blob/v10.7.0/docs/docs/intro/configuration/metro-configuration.md),
  [`environment-variables.md`](https://github.com/storybookjs/react-native/blob/v10.7.0/docs/docs/intro/configuration/environment-variables.md),
  [`examples/expo-example`](https://github.com/storybookjs/react-native/tree/v10.7.0/examples/expo-example)
  (its `jest.config.js`, `.rnstorybook/index.tsx` and `.maestro/storybook-screenshots.yaml`),
  [`examples/expo-router-example`](https://github.com/storybookjs/react-native/tree/v10.7.0/examples/expo-router-example)
- npm registry (`https://registry.npmjs.org/<pkg>/latest`, read 2026-10-25) for versions, peer
  dependencies and `peerDependenciesMeta`
- `gh release list -R storybookjs/react-native` (release dates)
- Expo blog, [Building beautiful components faster with Storybook 9 and Expo](https://expo.dev/blog/storybook-and-expo)
  (no dedicated Storybook guide was found on docs.expo.dev)
- Chromatic, [React Native docs](https://www.chromatic.com/docs/react-native)
- Maestro, [`assertScreenshot`](https://docs.maestro.dev/api-reference/commands/assertscreenshot);
  Maestro CLI 2.8.0 notes via [Tech Dev Notes](https://techdevnotes.com/releases/maestro-cli/2.8.0) (third party)
- GitHub API for `oblador/loki` and `FormidableLabs/react-native-owl` (last push dates)

### Version facts (registry, 2026-10-25)

| Package | Latest | Date | Notes |
| --- | --- | --- | --- |
| `@storybook/react-native` | 10.7.0 | 2026-10-13 | `next` is 11.0.0-next.1 (2026-10-21). Peers: `storybook ^10.5.4`, `react-native >=0.72.0`, `react *`, `react-native-safe-area-context *`; `@gorhom/bottom-sheet`, `react-native-reanimated`, `react-native-gesture-handler` are optional peers. Hard dependency on `@storybook/react-native-ui` and `@storybook/react`. |
| `@storybook/react-native-ui` | 10.7.0 | 2026-10-13 | **Non-optional peers** `react-native-svg >=14`, `@gorhom/bottom-sheet >=4`, `react-native-reanimated >=3`, `react-native-gesture-handler >=2`. |
| `@storybook/react-native-ui-lite` | 10.7.0 | 2026-10-13 | Peers only `react`, `react-native`, `react-native-safe-area-context`, `storybook`. |
| `@storybook/addon-ondevice-controls` | 10.7.0 | 2026-10-13 | Non-optional peers `@react-native-community/slider` and `@react-native-community/datetimepicker` (both native). |
| `@storybook/addon-ondevice-notes` | 10.7.0 | 2026-10-13 | Optional peer `react-native-enriched-markdown` (a codegen native module). |
| `@storybook/addon-ondevice-actions`, `-backgrounds` | 10.7.0 | 2026-10-13 | JS only. |
| `@storybook/react` / `storybook` | 10.6.3 | n/a | `@storybook/react` has a non-optional `react-dom` peer. |
| `@storybook/react-native-web-vite` | 10.6.3 | n/a | Peers `react-native >=0.74.5`, `react-native-web ^0.19.12 \|\| ^0.20 \|\| ^0.21`, `vite ^5–^8`. |
| `@storybook/test-runner` | 0.26.0 | n/a | Playwright, web only. |
| `chromatic` | 18.13.3 | 2026-10-22 | RN support is early access (see below). |
| `@argos-ci/cli` | 6.11.0 | 2026-10-21 | Image upload and diff service, platform agnostic. |
| `loki` | 0.35.1 | 2024-08-27 | Peer `@storybook/react ^5–^8` only. Repo last pushed 2024-10-12. |
| `react-native-owl` | 1.5.0 | 2025-01-14 | Peer `react ^17 \|\| ^18`. Repo last pushed 2025-01-15. |
| `react-native-view-shot` | 6.2.1 | n/a | Native module, peer `react-native >=0.80.0`. |

**Compatibility with this stack.** The peer ranges of `@storybook/react-native` 10.7.0 accept
RN 0.85.3 and React 19.2.3. The project publishes no RN/Expo support matrix. The official
examples at tag `v10.7.0` run Expo SDK **57**, RN **0.86.3**, React 19.2.3 and Reanimated 4.5.1,
which is one SDK ahead of this app. New Architecture support is implied by those examples (SDK 57
is New Architecture only) but is not stated as a support policy. **Expo SDK 56 / RN 0.85 is
therefore compatible by peer range but not demonstrated by an official example (unverified).**

Storybook 10 packages are ESM only. The official example's `jest.config.js` adds a sucrase
transform for `node_modules/(storybook|@storybook/react)` and adds `storybook|@storybook/react` to
`transformIgnorePatterns`. Expect the same changes here.

## Project constraints that decide this

1. **No web target, by decision.** ADR 007 (`docs/mobile/architecture-book/decisions/007-drop-web-target.md:31-37`)
   removed the web block, the `web` script and the `react-dom` / `react-native-web` deps. `runtime.md:10`
   restates it as a rule. Its "Revisit if" clause (`007:53-57`) requires a real browser deliverable.
   Note: `react-dom@19.2.3` is still present **transitively** (via `@expo/ui` → `vaul`, and
   `expo-router` → `@expo/metro-runtime`, from `npm ls react-dom`). `react-native-web` is absent.
2. **Fingerprint runtime policy.** `mobile/app.config.ts:84` sets `runtimeVersion: { policy: "fingerprint" }`.
   `eas.md:39-43` makes this load-bearing (ADR 006). Every fingerprint move forces fresh store builds
   on every lane, and those builds are local and deliberate (`eas.md:45-63`, ADR 040). **The React
   Native app is not in production** (it replaces the live Flutter app at the v4 cutover), so no
   installed binary depends on today's fingerprint. A fingerprint move or a new native dependency
   costs nothing before the first public release and is not weighed in this decision.
3. **What the fingerprint actually hashes.** This was read from `@expo/fingerprint` 0.19.4
   (`build/sourcer/Sourcer.js:17-50`). It hashes Expo and RN-core autolinking results for both
   platforms, the resolved Expo config plus loaded config-plugin files, `eas.json` and `.easignore`,
   CNG patches, the project `.gitignore`, **`package.json` `scripts`**, bare native dirs,
   `patch-package` patches and `react-native/package.json`. It does **not** hash `metro.config.js`,
   `babel.config.js` or the `dependencies` / `devDependencies` lists. A JS-only dev dependency only
   moves the fingerprint if it brings in an autolinked native module.
4. **Autolinking follows devDependencies and non-optional peers.** `expo-modules-autolinking`
   56.0.15 `build/dependencies/resolution.js:35-58` adds top-level `devDependencies` and recurses
   into every **non-optional** peer dependency, because npm auto-installs those. Putting a native
   package in `devDependencies` does not keep it out of store binaries.
5. **Dev-only routes ship in the production bundle.** Expo Router bundles every `src/app/*.tsx`
   (`app.config.ts:227-234`; ADR 030). Gates are runtime gates:
   - `isDevVariant()` reads `extra.appVariant` (`mobile/src/config/variant.ts:14-16`). It is used by
     `dev-import` (`dev-import-screen.tsx:40`) and `dev-paging-spike` (`paging-spike-screen.tsx:53-58`).
   - The backend capability gate is used by `/settings-gallery`, which redirects when the capability
     is `production` (`settings-gallery-screen.tsx:32-34`), and by its Settings hub entry
     (`settings-screen.tsx:100-101,179-183`). `navigation.md:47-50` documents this.
   - `__DEV__` is explicitly the wrong gate, because E2E builds are release-config dev variants
     (`variant.ts:8-13`).
6. **Store profiles.** `mobile/eas.json:21-42`: `preview` and `production` are `distribution: "store"`,
   carry no `APP_VARIANT`, and set `OTA_CHANNEL` and `BACKEND_ENVIRONMENT_CAPABILITY`. Only
   `development` sets `APP_VARIANT=development` (`eas.json:7-20`). `app.config.test.ts` pins every
   profile's exact env (`eas.md:25`).
7. **Metro and Babel are near-default.** `mobile/metro.config.js:5-12` only adds the `sql` source
   extension. `mobile/babel.config.js:6-12` adds `inline-import` for `.sql`. The entry point is
   `expo-router/entry` (`mobile/package.json:3`). React Compiler and typed routes are on
   (`app.config.ts:219-222`). New Architecture and Hermes are the only supported mode (`runtime.md:7`).
8. **Native controls are the valuable surface.** `src/components/chrome/` is the single import
   site for alpha native APIs: `@expo/ui` SwiftUI and Jetpack Compose (`native-settings.tsx`,
   `native-settings-header.tsx`, `native-error-notice.tsx`, `native-text-entry-dialog-*.tsx`,
   `native-settings-numeric-editor.tsx`, `expo-ui.tsx`), `expo-router/unstable-native-tabs`
   (`native-tabs.tsx`) and `expo-glass-effect` (`glass-surface.tsx`). A lint boundary enforces this
   (`chrome/index.ts:1-6`). Principle 2 (`architecture.md`) says to follow each platform's
   conventions, so the components most worth a workshop are SwiftUI and Compose controls.
9. **Calendar.** `@howljs/calendar-kit` is **no longer vendored or patched**.
   `mobile/calendar-owned-shell.contract.test.ts:136-150` asserts that the package, `patch-package`,
   `patches/` and its Jest setup are absent. The calendar is the owned renderer in
   `src/features/calendar/renderer/` (Reanimated 4 + Worklets 0.8 + Gesture Handler 2.31).
10. **Test harness.** jest-expo preset with suite-wide native mocks for Firebase, `@/db`, MMKV/Nitro,
    `@expo/ui`, `expo-camera`, pager-view and Reanimated (`mobile/jest.config.js:29-57`). Coverage is
    collected from `src/**/*.{ts,tsx}` minus `src/app/**` (`jest.config.js:72-102`), and CI enforces
    the threshold (`testing.md:41`).
11. **E2E budget.** Maestro is pinned to 2.8.0 in CI (`.github/workflows/ci-mobile-e2e.yml:244,449`).
    ADR 057 caps the suite at **three durable journeys, and only three** (`testing.md:98`). E2E
    builds are release-config with `APP_VARIANT=development` and no Metro (`testing.md:106`).
12. **Principle 1** (`architecture.md`): encode constraints in types, lint, tests or CI before
    documenting them. Any option has to come with a mechanical proof that the workshop never ships
    in a store binary or OTA.

### Which UI files depend on native-only modules

These were counted from `mobile/src`, excluding tests:

| Native dependency | Production importers | Web behaviour |
| --- | --- | --- |
| `@expo/ui` SwiftUI / Compose | 7 files in `src/components/chrome/`; re-exported to 19 feature UI files (about, calendar-sources dialogs and screens, calendar view menu, home header, 5 notifications screens, personal-event date-time field, 6 settings screens, plus `root-page.tsx` and `app-tabs.tsx`) | `expo-modules-core` `requireNativeViewManager` throws `UnavailabilityError` on web (`NativeViewManagerAdapter.tsx`). `@expo/ui` ships one `.web` file, the community datetime picker. |
| `expo-router/unstable-native-tabs` | `chrome/native-tabs.tsx` → `components/app-tabs.tsx`, `app/(tabs)/calendar/_layout.tsx` | Has a web view (`NativeTabsView.web.js`), but it is not the native tab bar. |
| `expo-glass-effect` | `chrome/glass-surface.tsx` | No web implementation in the package. |
| `expo-symbols` | 12 files (error surfaces, settings icons, calendar actions, changelog, checklist indicator, home header, onboarding x3, school-selection x2) | No web implementation in the package. |
| `react-native-mmkv` v4 (Nitro) | `src/storage/index.ts` → 26 files through `@/storage` | MMKV has web files, but they are not the native store. |
| `expo-sqlite` + Drizzle | `src/db/*` → 28 files through `@/db` | expo-sqlite web is wasm-based and has its own setup (unverified for this schema). |
| Reanimated 4 + Worklets | 13 files (calendar renderer x7, onboarding x2, paging spike x4) | Reanimated has web support; worklet-thread semantics differ. |
| `react-native-pager-view` | onboarding pager x2 | No web implementation. |
| `expo-camera` | QR scanner x3 | Web exists, with different behaviour. |
| `@react-native-firebase/*` | `src/firebase/index.ts` (reached from `_layout.tsx`) | No web implementation. |

A rough filter of the 91 non-test `.tsx` files under `src/features/*/ui/`, removing any file that
imports chrome, symbols, Reanimated, pager-view, camera, storage, db, a data/store/prefs sublayer or
`expo-router`, leaves **15 files** that look web-renderable without mocks.

## Option 1: `@storybook/react-native` on device

### How it works (v10)

- Config lives in `.rnstorybook/` (`main.ts`, `preview.tsx`, generated `storybook.requires.ts`).
  `main.ts` has `stories` globs and `deviceAddons`.
- There are two Metro wrappers (`metro-configuration.md`):
  - **Bundler-agnostic** `@storybook/react-native/withStorybook`, which is recommended. It swaps the
    whole app entry for Storybook when `STORYBOOK_ENABLED=true` and is "a strict no-op otherwise:
    zero Storybook code in the bundle".
  - **Metro-specific** `@storybook/react-native/metro/withStorybook` with `enabled`. When it is
    `false`, "all `@storybook/*` and `storybook/*` imports are replaced with empty modules, and your
    Storybook config directory imports are stubbed out". Use it when Storybook renders inside the app,
    for example as an Expo Router route.
- Expo Router guidance (`expo-router.md`) is an `app/storybook.tsx` route that calls
  `view.getStorybookUI({ storage })`, with the Metro-specific wrapper and a `Stack.Protected` guard.
  The docs call this "fully supported but not the preferred setup, because it embeds Storybook into
  your app's bundle and navigation". The Expo blog post uses the same route approach.
- `getStorybookUI` options: `onDeviceUI`, `shouldPersistSelection` (needs a `storage` with
  `getItem`/`setItem`, which MMKV can provide, so no AsyncStorage is needed), `initialSelection`,
  `enableWebsockets`, `host`, `port`, `CustomUIComponent`, `theme`.
- Remote control: `websockets: 'auto' | { host, port }` (port 7007). The channel server exposes
  `POST /select-story-sync/<storyId>`, which the official Maestro screenshot flow uses.
  `experimental_mcp` adds an MCP endpoint from v10.3.
- `liteMode: true` with `@storybook/react-native-ui-lite` mocks out the default UI's Reanimated,
  bottom-sheet and SVG dependencies.
- Addons: controls (needs native slider and datetimepicker), actions, backgrounds, notes (optional
  native markdown).

### Fit with this project

**Entry swapping versus a route.** With entry swapping, `expo-router/entry` is replaced, so there is
no root `_layout.tsx`. That means no theme, i18n, QueryClient, `EnvironmentRuntimeGate`, safe area
or Router context. Components that take `href` (for example `NativeSettingsRow kind="navigation"`)
or call `Stack.Screen` would need a router decorator, and Storybook has none for Expo Router. The
route approach keeps the app's real providers and Router context, so it fits this app better, even
though upstream does not prefer it.

**Store-bundle stripping.** It is achievable, with a caveat. With the Metro-specific wrapper,
`enabled` has to be computed inside `metro.config.js` from env that is present when Xcode or Gradle
bundles JS during `eas build --local`, and when xprem OTA publishing runs `expo export`. A safe
expression is `process.env.STORYBOOK_ENABLED === "true" && process.env.APP_VARIANT === "development"`.
Even then, the route file `src/app/storybook.tsx` still ships (constraint 5) and renders blank with
a warning. It also needs the same runtime `isDevVariant()` gate as `dev-paging-spike`.

**Native code in store binaries.** Before the first public release this is tidiness, not a cost. `@storybook/react-native`
hard-depends on `@storybook/react-native-ui`, whose `react-native-svg` peer is **non-optional**.
npm auto-installs it, and Expo autolinking follows non-optional peers (constraint 4). The result
is that `react-native-svg` native code gets linked into **every** binary, store builds included,
whether or not `liteMode` is used. The controls addon adds `@react-native-community/slider` and
`@react-native-community/datetimepicker` the same way. Stripping JS with `enabled: false` does
nothing about linked native code. The workaround is to exclude those packages from autolinking.
For RN-core-autolinked libraries that means a `react-native.config.js` `dependencies` entry with
`platforms: { ios: null, android: null }`. That removes them from dev builds too, which leaves only
`ui-lite` without controls. Whether that exclusion fully restores the store fingerprint is
**unverified** and needs a spike with `runtimeversion:resolve` before and after.

**Fingerprint impact** (predicted from constraint 3; relevant only after the first public release):

| Change | Moves release fingerprints? |
| --- | --- |
| Add JS-only devDeps (`storybook`, `@storybook/react-native`, `@storybook/react-native-ui-lite`, actions, backgrounds) | Not by themselves. Yes in practice, through the auto-installed `react-native-svg` peer (above). |
| Add controls addon | Yes (slider and datetimepicker autolink). |
| Wrap `metro.config.js` with `withStorybook` | No (not hashed). |
| Add a `storybook` script to `package.json` | **Yes, all four lanes** (`packageJson:scripts` is hashed). Avoid it by running the command through a non-`package.json` entry such as `mobile/scripts/storybook.sh`, or accept one recorded move. |
| Add `.rnstorybook/storybook.requires.ts` to `.gitignore` | **Yes** (`.gitignore` is hashed). Commit the generated file instead, which upstream examples do. |
| Add a dev-only `extra.storybook` field in `app.config.ts` | No for preview/production, if the field only appears when `isDev`. |
| Add an `eas.json` profile | Yes (`eas.json` is hashed). Not needed. |

**jest-expo reuse.** `composeStories` comes from `@storybook/react` (`PORTABLE_STORIES.md`). It
renders with RNTL under jest-expo, and the official expo-example does exactly that. Costs here:
- the sucrase transform and `transformIgnorePatterns` additions for ESM-only Storybook 10;
- `setProjectAnnotations` from `.rnstorybook/preview`;
- `*.stories.tsx` must be excluded from `collectCoverageFrom` or covered;
- the i18next literal-string rule (`eslint.config.js:250`) will flag story fixtures.
The `react-dom` peer adds no new package, because it is already present transitively.

**Version risk.** `@storybook/react-native` 10.7.0 is `latest`; 11.0.0-next.1 is in `next`
(2026-10-21). Moving from 10.x to 11.x changes the `storybook` peer from ^10.5.4 to ^11.0.0-alpha.6,
introduces CSF Factories, and moves on-device addons from `addons` to `deviceAddons` (upstream
PR #932). Upstream's `expo-router-example` runs SDK 57 / RN 0.86.3 with New Architecture and React
Compiler on both tags and uses entry swapping, not a route; SDK 56 is unverified. Mounting as an
Expo Router route is "fully supported but not the preferred setup" (upstream `expo-router.md:12`).

**Accessibility.** On-device addons are actions, controls, backgrounds and notes. There is no
on-device accessibility addon: `@storybook/addon-a11y` 10.6.3 runs axe-core against a web DOM, so it
only applies to Option 2, where it audits web approximations rather than the SwiftUI/Compose
controls. On device, the accessibility tools are the platform's (VoiceOver, TalkBack, Xcode
Accessibility Inspector, Accessibility Scanner, OS text-size settings), identical for Options 1 and 4.

**Verdict.** Feasible as a route, on a setup upstream does not prefer and has not shown on SDK 56.
Its real benefit is the on-device Controls panel. Its real costs are a second test config (ESM
transform, annotations), a 10.x to 11.x migration soon after adoption, and a story being a view
inside one route rather than a screen, which hides header actions, sheets and `Stack.Screen`
options from screen-reader review.

## Option 2: Storybook for web via `@storybook/react-native-web-vite`

- It re-adds `react-native-web` (a peer, `^0.19.12–^0.21`) plus Vite, which directly reverses
  ADR 007. ADR 007's revisit condition, a real web deliverable, is not met: a component catalogue
  is not a product web target.
- Most of the components worth showing fail on web. Every `@expo/ui` SwiftUI or Compose view goes
  through `requireNativeViewManager`, which throws `UnavailabilityError` on web. That covers all of
  `native-settings*`, `native-error-notice` and the text-entry dialogs, and so the 19 feature UI
  files that consume them. `expo-glass-effect`, `expo-symbols` (12 files), `react-native-pager-view`
  and Firebase have no web implementation. MMKV and expo-sqlite have web builds that are different
  stores. Native tabs on web render a web tab view, not a UITabBar or Material bar. Only about 15 of
  91 feature UI files look renderable without mocks, and those are the least interesting ones.
- Making them render would mean `.web.tsx` shims or Vite aliases for every chrome primitive. That
  re-creates the `.web.tsx` confusion ADR 007 deleted, and shows a web approximation that Principle 2
  says is not the reference.
- The benefit is the web ecosystem: `@storybook/test-runner` 0.26 (Playwright), Chromatic web,
  Argos, docs pages and static hosting.

**Verdict.** Reject. It contradicts ADR 007 and Principle 2, and it cannot render the native controls.

## Option 3: Hybrid (the same CSF stories on device and on web)

The upstream expo-example does exactly this: `.rnstorybook` for device and `.storybook` with
`@storybook/react-native-web-vite` for web, sharing `*.stories.tsx`. Here it carries **all** of
Option 1's costs and **all** of Option 2's. Each story would also need a per-platform skip list,
because about 80% of feature UI cannot render on web. That is two Storybooks, two configs and two
Jest/ESM transform sets for one maintainer, which runs against the "bounded maintenance" posture of
the migration.

**Verdict.** Reject.

## Option 4: Extend `/settings-gallery` into an in-house gallery

**Today.** `src/app/settings-gallery.tsx` is a one-line re-export (`src/app/settings-gallery.tsx:1`),
registered at `src/app/_layout.tsx:153`. `SettingsGalleryScreen` (175 lines) renders every
`native-settings` primitive with local state, using real SwiftUI/Compose controls in both color
schemes. It redirects when the backend capability is `production` (`settings-gallery-screen.tsx:32-34`)
and is reached from the Settings hub environment section. It has a Jest suite
(`settings-gallery-screen.test.tsx`) and a route-structure assertion
(`components/settings-route-structure.test.ts:79-84`).

**Pros**
- Zero new dependencies, zero autolinking change, zero fingerprint movement, no Metro or Babel change.
- It already sits behind a tested gate and is already in the route inventory.
- It renders the real native controls inside the real provider tree (theme, i18n, Router, safe area),
  which is the Principle 2 surface.
- Fixtures are plain React components, so jest-expo renders them with the existing suite-wide mocks.
  No ESM transform work is needed.
- Because the gate is the backend capability rather than the variant, it also appears on **preview
  store builds**. The owner can check SwiftUI/Compose rendering on the exact TestFlight or Play
  internal artifact, which no Storybook dev build can do.

**Cons**
- No controls, actions or backgrounds panels. Each state is a hand-written fixture.
- Manual registry and no glob discovery. This can be fixed with a test-enforced registry (below).
- Fixture code ships, inert, in production bundles (constraint 5). The bundle size cost is small.
- Fixture strings hit the i18next literal-string lint. Today they go through `settingsGallery.*` keys,
  which does not scale to dozens of fixtures.
- No ecosystem tooling (Chromatic, docs pages).

## Comparison

| Criterion | 1. On-device Storybook | 2. Web Storybook | 3. Hybrid | 4. In-house gallery |
| --- | --- | --- | --- | --- |
| Setup cost | Medium: about 6 devDeps, `.rnstorybook/`, metro wrapper, route, Jest ESM transform, autolinking exclusions | Medium-high: RNW, Vite, `.storybook/`, per-component web shims | High (1 + 2) | Low: registry, fixtures, one test |
| Store-bundle and binary leak risk | JS stripped by `enabled`; **native `react-native-svg` (+ slider, datetimepicker) autolinked into store binaries** unless excluded | None on device (separate toolchain), but RNW enters the lockfile | Same as 1 | Inert JS only, behind an existing tested gate |
| Fingerprint (ADR 006) | Moves at least once; no cost before the first public release | `package.json` scripts would move it | Moves | No change |
| Accessibility review | Platform tools only; no on-device a11y addon; story is a view, not a screen | `addon-a11y` (axe) on web approximations only | Mixed | Platform tools; each fixture is a real screen with the real header |
| Metro config impact | Wrapped by `withStorybook` (resolver, generated requires) | None (Vite) | Wrapped | None |
| jest-expo reuse | `composeStories` works, needs sucrase/ESM transform + annotations | Same stories, web-only tests | Both | Native: fixtures are components |
| Visual regression path | Maestro `assertScreenshot` via `/select-story-sync`; Chromatic RN (early access) | Chromatic web / Argos / test-runner, but of web approximations | Both | Maestro `assertScreenshot` over gallery deep links |
| Renders real SwiftUI/Compose | Yes | **No** | Device only | Yes |
| Maintenance | Tracks Storybook majors (v11 imminent), ESM churn | RNW + shims drift | Highest | Fixtures only |
| Principle 1 fit | Needs new CI proofs for bundle and binary absence | Conflicts with ADR 007 | Conflicts | Extends existing gates and tests |
| Principle 2 fit | Good | Poor | Mixed | Good |
| ADR conflicts | None directly; route approach "not preferred" upstream | ADR 007 | ADR 007 | None |

## Visual regression

| Tool | Status for this app |
| --- | --- |
| **Maestro `assertScreenshot`** | Compares the current screen, or a `cropOn` element, against a reference PNG; default `thresholdPercentage` 95. Present in CLI 2.8.0, which CI pins (threshold-variable note in 2.8.0). The version that introduced it was not found (unverified). Local host has 2.6.1 (availability unverified). Upstream Storybook uses it in `examples/expo-example/.maestro/storybook-screenshots.yaml`, selecting stories via `http://localhost:7007/select-story-sync/<id>`. Works the same against gallery deep links, without Storybook. |
| **Chromatic React Native** | Early access, enabled per project by contacting Chromatic. Needs Storybook RN 9.0+, builds its own Storybook `.apk`/`.app` (Expo/EAS supported), runs on hosted iOS Simulator and Android Emulator (FAQ: iOS 26.1, Android 36; page is inconsistent). No dark-mode, locale or viewport modes yet. No TurboSnap. Building artifacts in Chromatic's cloud sits awkwardly with "builds are deliberate and local" (`eas.md:45-63`). Pricing not stated. |
| **Loki** | Last release 0.35.1 (2024-08-27), peer `@storybook/react ^5–^8`. No Storybook 10 support. Not viable. |
| **react-native-owl** | 1.5.0 (2025-01-14), peer `react ^17 \|\| ^18`. Does not declare React 19 (unverified whether it runs). Effectively dormant. Not viable. |
| **`@storybook/test-runner`** | Web (Playwright) only. Applies only to Option 2. |
| **Argos** | `@argos-ci/cli` 6.11.0 uploads any PNG set and reviews diffs. Could take Maestro screenshots as input. A hosted service needs an account decision. |
| **`react-native-view-shot`** | 6.2.1, a native module. In-app capture would add native code and move the fingerprint. Not needed if Maestro captures. |
| **Jest snapshots** | jest-expo renders mocked host trees. `@expo/ui` is mocked suite-wide (`jest/setup-expo-ui.ts`), so a snapshot records the mock's props, not pixels. Useful only as a structural contract, which existing tests already cover more precisely. `testing.md:84-94` states host tests do not claim rendering. |

**Constraints on any pixel lane.** Simulator and emulator images, fonts and OS minor versions
change baselines. A pixel lane must be manual-dispatch or daily, never a PR gate. It would also be
outside ADR 057's three-journey budget, so it needs either an ADR 057 amendment or an explicit
"non-journey visual lane" ADR.

## Recommendation

**Adopt Option 4: an in-house on-device gallery where each fixture is a real Expo Router route
(`/developer/gallery/[story]`). Fixtures are written in CSF3 shape, with no Storybook dependency.**
This holds with native-dependency and fingerprint costs weighted at zero (independent advisor
review, 2026-10-25).

Decisive reasons:
- **No accessibility advantage for Storybook on React Native.** There is no on-device a11y addon;
  the review tools are the platform's and work the same either way.
- **Screen readers judge screens, not views.** A gallery route renders the fixture as the screen,
  under the real native header, so focus order, the back button and the "name exposed once" rule
  (`accessibility.md:27-29`) are what ships. A Storybook story is a view inside one route, and
  VoiceOver would likely also traverse Storybook's own UI (unverified).
- **Real providers and gate for free.** The in-app theme override reaches SwiftUI/Compose
  (`use-color-scheme.ts:15-21`, `testing.md:91`); FR/EN, Router context and the capability gate
  (`settings-gallery-screen.tsx:32-34`) already exist; preview builds are where release-config
  accessibility checks happen (`accessibility.md:43-45`).
- **Principle 1.** Named fixture states become a Jest matrix (story × light/dark × iOS/Android)
  under the existing mocks, extending `settings-gallery-screen.test.tsx:34-37`, with no second
  config. A deep link per story serves Maestro and agents.
- **Churn.** Adopting `@storybook/react-native` 10.x now means migrating to 11.x shortly after.

Given up: the on-device Controls panel. Explicit named states (longest FR string, disabled, busy,
error, largest text size) are easier to review for accessibility than live knobs.

**Accessibility workflow.** Open a story by deep link (`timecalendar-dev://developer/gallery/<id>`
on development builds, `timecalendar://…` on preview, `app.config.ts:74-78`). Set conditions with
`xcrun simctl ui booted content_size accessibility-extra-extra-extra-large` /
`xcrun simctl ui booted appearance dark` on iOS, or `adb shell settings put system font_scale 2.0` /
`adb shell cmd uimode night yes` on Android. Screenshot, read the accessibility tree, then a
VoiceOver/TalkBack pass on a simulator or a TestFlight / Play internal device.

**Main risk: hand-rebuilding Storybook.** ADR C freezes scope (index page, story route, no controls,
no docs engine). Fixtures stay CSF3-shaped so `@storybook/react-native` can load them later as a
config change.

**Revisit Option 1 if** a second contributor or designer needs a self-serve workshop, live prop
editing becomes a real need, or Chromatic RN leaves early access and visual review is wanted as a
service.

### Wiring sketch

Files to add or change (all under `mobile/`):

1. `src/design/gallery/types.ts`, a local CSF3-compatible type with no Storybook import:
   ```ts
   export type GalleryMeta<P> = { title: string; component: React.ComponentType<P> }
   export type GalleryStory<P> = { name?: string; args?: Partial<P>; render?: (args: P) => React.ReactElement }
   ```
2. Fixtures colocated as `*.gallery.tsx` next to each primitive, for example
   `src/components/chrome/native-settings.gallery.tsx`, `src/design/status-view/empty-state.gallery.tsx`,
   `src/design/status-view/error-surfaces.gallery.tsx`. Move today's `SettingsGalleryScreen` content into
   the first one.
3. `src/design/gallery/registry.ts`, an explicit array of `import * as x from "…gallery"` modules.
   Constraint 5 means everything here ships, so keep it explicit and reviewable rather than using
   `require.context`.
4. A developer page, `src/features/developer/ui/developer-screen.tsx` behind a thin
   `src/app/developer.tsx`, hosting the gallery entry and the existing dev tools (environment
   switch, dev import). The gallery itself is `src/features/developer/ui/gallery-screen.tsx`
   (index list, then story detail) at `src/app/developer/gallery.tsx`, plus
   `developer/gallery/[story].tsx` for deep links such as
   `timecalendar-dev://developer/gallery/native-settings--switches` that Maestro can open.
   `src/app/settings-gallery.tsx` is removed with its `settings-route-structure.test.ts`
   assertion updated; Settings keeps one row that opens `/developer`.
5. Gating: the backend-capability gate (`!== "production"` redirects) covers the whole
   `/developer` subtree, so development and preview builds show it and production hides it
   (`mobile/eas.json:10-12`, `:25-26`, `:36-37`).
6. No change to `metro.config.js`, `babel.config.js`, `app.config.ts`, `eas.json`, `.gitignore`
   or `package.json` `scripts`.

CI checks (proof the gallery is inert and does not move native config):

- **Jest** `src/design/gallery/registry.test.ts`:
  - globs `src/**/*.gallery.tsx` with `fs` and asserts each is in the registry (no orphan fixtures);
  - asserts unique `title`s;
  - renders every story in light and dark under the existing mocks (a smoke test that also covers
    fixture code for the 70% floor).
- **Jest** gate test: with capability `production`, `/developer`, `/developer/gallery` and
  `/developer/gallery/[story]` redirect.
  Mirrors the existing `settings-gallery-screen.test.tsx`.
- **Contract test** (in the style of `calendar-owned-shell.contract.test.ts`): `package.json` has no
  `storybook` / `@storybook/*` / `react-native-web` dependency, and no `.rnstorybook` or `.storybook`
  directory exists. This keeps an accidental Option 1 or 2 from landing without an ADR.
- **Fingerprint evidence**: in the PR, record unchanged
  `runtimeversion:resolve` outputs for the four lanes (`eas.md:123-157` procedure).
- **i18n**: gallery and fixture strings are translated under a `gallery.*` namespace (FR/EN
  parity test applies); no lint exemption.

If Option 1 is later adopted, the same pieces carry over. Keep the fixtures and add
`@storybook/react-native` + `@storybook/react-native-ui-lite` + actions/backgrounds (no controls).
Use the Metro-specific `withStorybook(config, { enabled: process.env.STORYBOOK_ENABLED === "true" && process.env.APP_VARIANT === "development", liteMode: true, configPath: "./.rnstorybook" })`
and have `metro.config.js` **throw** if `STORYBOOK_ENABLED=true` without the dev variant. Mount a
`src/app/storybook.tsx` route gated on `isDevVariant()`, with MMKV as `storage`. Add a
`react-native.config.js` exclusion for `react-native-svg`. Add a CI step:
`OTA_CHANNEL=production BACKEND_ENVIRONMENT_CAPABILITY=production npx expo export --platform ios --no-bytecode --output-dir /tmp/x`,
then grep for `@storybook` and story titles and fail on any hit. Record the fingerprint move.

## Risks

- **Gallery code ships in production bundles.** It is inert behind a tested redirect, the same
  posture as `dev-import` (ADR 030). A gate regression would expose fixtures to store users. The
  gate test mitigates this.
- **Preview testers see the gallery.** This is intended today. If unwanted, switch to
  `isDevVariant()` and lose the store-artifact device check.
- **Fixture rot.** Fixtures drift from real usage. The registry render test catches crashes, not
  semantic drift.
- **Visual baselines are brittle** across simulator images and OS updates, and they consume a
  scarce E2E budget (ADR 057).
- **Option 1 later.** Autolinking exclusion effectiveness, ESM transform upkeep and the v10 to v11
  migration are the main costs (unverified details listed above).

## Decided (owner, 2026-10-25)

- Gallery strings are translated (`gallery.*` namespace, FR/EN parity); no lint exemption.
- Gate: backend capability `!== "production"`, so development and preview builds show the
  `/developer` page and gallery; production hides them.
- No pixel-diff lane for now.

## Open questions

1. If Option 1 is revisited: does a `react-native.config.js` exclusion of `react-native-svg`
   restore the pre-Storybook fingerprint for all four lanes? Measure it, don't assume it.
2. Chromatic RN pricing and whether its cloud-built artifacts are acceptable under ADR 040's
   local-build rule.
