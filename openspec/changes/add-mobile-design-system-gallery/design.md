# Design

## Context

See proposal.md (Why). Current state that shapes the approach (paths under `mobile/`):

- `/settings-gallery` is `src/app/settings-gallery.tsx` re-exporting `SettingsGalleryScreen`
  (`src/features/settings/ui/settings-gallery-screen.tsx`, exported from the settings `ui/` barrel),
  registered as `<Stack.Screen name="settings-gallery" />` in `src/app/_layout.tsx`. One screen,
  local state, every `native-settings` primitive, `settingsGallery.*` strings (29 keys per locale),
  redirect to `/settings` in production. Its test drives the primitives on both platforms.
- `/developer` (`src/app/developer.tsx` → `DeveloperScreen`) has the same inline gate
  (`getBackendEnvironmentCapability() === "production"` → `<Redirect href="/settings" />`) and a
  Design row (`developer-gallery`, `href="/settings-gallery"`, `developer.gallery.*` strings).
- **Route shape precedent:** `src/app/user-calendars.tsx` and `src/app/user-calendars/[id].tsx`
  coexist with no `_layout.tsx` in the folder; both are root Stack siblings
  (`<Stack.Screen name="user-calendars/[id]" />`). `settings-route-structure.test.ts`
  `discoveredRoutes()` recurses into layout-less folders and expects every discovered route
  (`developer/gallery`, `developer/gallery/[story]`) to be registered on the root Stack.
- `tsconfig.json` maps `@/*` to `./src/*`, so `@/design` resolves with no path change. `src/design/`
  does not exist.
- Lint (`eslint.config.js`): every `no-restricted-imports` config is built by
  `restrictedImports(extraPatterns, flags)`; flat config replaces options, so a new ban is a flag
  and an opt-out block re-includes `routeEntrypointImportPattern`. `boundaries/elements` classifies
  feature sublayers, barrels, `generated-api`, `db-seam`, `route`, `component`, infra; the
  `boundaries/dependencies` rule is `default: "allow"` plus named disallows.
- i18n: keys are flat literal strings; `t()`'s key type is `keyof typeof en`; FR/EN parity is a
  `tsc` error both ways (`src/i18n/index.ts`). Tests resolve real strings via `jest/setup-i18n.ts`.
- Jest: `@expo/ui` and its `swift-ui` / `jetpack-compose` subpaths are mocked suite-wide
  (`jest/setup-expo-ui.ts`); the mocks project SwiftUI/Compose accessibility modifiers onto host
  props (`accessibilityRole`, `accessibilityLabel`, `testID`). `usePlatform` pins `Platform.OS` per
  `describe`. Coverage: 70% global; 90% lines+branches on `src/features/*/!(ui|renderer)/**`,
  `hooks`, `storage`, `db`, `i18n`, `firebase`, `theme`. `features/*/ui` is in the 70% tier only.
- `NativeSettingsRow` has no disabled state. `NativeTextEntryDialog` has `submitDisabled` and
  `pending`.

## Goals / Non-Goals

**Goals:**

- A gallery whose story is the screen: real header, real providers, real gate, deep-linkable.
- Every rule the gallery relies on (registry completeness, uniqueness, render matrix, accessible
  controls, translated copy, subtree gate, no Storybook, `@/design` boundary) is a test, type or
  lint error.
- Fixtures stay CSF3-shaped so Storybook can load them later as a configuration change.

**Non-Goals:**

- Controls, actions, backgrounds, docs pages, search, a story switcher, or any runtime knob
  (frozen by ADR 064).
- Fixtures for primitives other than the native-settings seam and the text-entry dialog
  (slice 2.3), the L10 "every `design/**` primitive has a fixture" contract (starts with 2.3), and
  moving existing primitives into `src/design/` (phase 2.3/3).
- A pixel-diff lane or Maestro flow over gallery deep links (owner decision 5).
- ADR A (the design-system layer as a whole). This change only creates the folder and barrel the
  gallery needs; ADR A is written when primitives move in.

## Decisions

### D1. Route shape: layout-less siblings on the root Stack

`src/app/developer.tsx` stays. Add `src/app/developer/gallery.tsx` (index) and
`src/app/developer/gallery/[story].tsx` (story), no `_layout.tsx` anywhere under `developer/`, and
register `<Stack.Screen name="developer/gallery" />` and
`<Stack.Screen name="developer/gallery/[story]" />` on the root Stack after `developer`. Expo
Router resolves `developer.tsx` → `/developer`, `developer/gallery.tsx` → `/developer/gallery` and
`developer/gallery/[story].tsx` → `/developer/gallery/:story`; a file and a same-named folder
coexist when the folder has no layout (the `user-calendars` precedent in this repo).

Alternatives:

- `developer/_layout.tsx` + `developer/index.tsx` (nested Stack). A nested Stack under the root
  Stack either doubles headers or needs `headerShown: false` on the parent registration and its
  own compact options; `settings-route-structure.test.ts` would classify the folder as one route
  and need a nested-classification test like onboarding's. It buys a single layout-level gate, which
  D2 gets more cheaply and with a stronger test. Rejected.
- `developer/gallery/index.tsx` instead of `developer/gallery.tsx`. Both resolve to the same URL;
  only one may exist. `gallery.tsx` mirrors `user-calendars.tsx` and keeps the registration name
  `developer/gallery`. Chosen; never add both.

### D2. One gate for the subtree, proven by a route contract test

`src/features/developer/ui/developer-access.ts` exports `isDeveloperSurfaceEnabled()`
(`getBackendEnvironmentCapability() !== "production"`). `DeveloperScreen`, `GalleryIndexScreen` and
`GalleryStoryScreen` each start with
`if (!isDeveloperSurfaceEnabled()) return <Redirect href="/settings" />`, before any hook that
reads the registry or params. `src/features/developer/ui/developer-routes.contract.test.tsx` lists
`src/app/developer.tsx` and every `.tsx` under `src/app/developer/`, asserts each is exactly one
`export { <Name> as default } from "@/features/developer/ui"` line, then renders each named screen
from the `ui` barrel with capability `production` and asserts the redirect to `/settings` and no
other content. A new route that skips the gate, or re-exports from elsewhere, fails the test.

Alternative: a lint rule requiring the call. Lint cannot see that the call precedes rendering;
rendering under production can. Rejected.

### D3. Fixture types: CSF3 shape, typed translated copy, explicit id

`src/design/gallery/types.ts` (no runtime code, no Storybook import):

```ts
export type GalleryKey = Extract<keyof typeof en, `gallery.${string}`>
export type GalleryPlatform = "ios" | "android"
export type GalleryMeta<P> = {
  id: string
  title: GalleryKey
  component: ComponentType<P>
  stories: readonly string[]
}
export type GalleryStory<P> = {
  name: GalleryKey
  args?: Partial<P>
  render?: (args: Partial<P>) => ReactElement
  platforms?: readonly GalleryPlatform[]
}
export type GalleryModule = { default: GalleryMeta<never> } & Record<string, unknown>
```

`en` is `import type en from "@/i18n/locales/en.json"`.

- `id` is CSF3's optional meta `id`, made required here: story ids and deep links must not change
  when copy is translated or reworded, and deriving an id from a translation key is fragile.
- `title` and `name` are `gallery.*` keys, so a mistyped or untranslated key is a `tsc` error and
  the FR/EN parity typing covers them. CSF3's `name` is optional; requiring it is a narrowing, so
  modules stay CSF3-loadable (Storybook would show the key as the name, an accepted cost if
  Storybook is ever adopted).
- `stories` lists the story export names in display order. ES module namespaces sort their keys
  and the Babel CJS transform reorders exports, so source order is not observable; alphabetical
  order would scatter related states. The registry test keeps `stories` equal to the module's
  story exports, each once.
- `platforms` names the only platforms a story can render on (absent: both). A primitive that
  renders nothing on one platform (the Android-only floating action and radio dialog) is not
  offered there.
- `render(args)` receives the story's `args`. A story without `render` must declare `args` and
  renders `<meta.component {...args} />`; the registry test enforces it because `Partial<P>` cannot.
- Stateful fixtures are named components in the fixture file (`function SwitchesFixture()`), and
  `render: () => <SwitchesFixture />`. Hooks never run inside a `render` arrow (rules-of-hooks).
- A fixture module is CSF3: `export default meta` plus one named export per story, so
  `import * as x` yields `{ default, ...stories }`.

### D4. Registry, helpers and the `@/design` barrel

- `src/design/gallery/registry.ts`: `export const galleryModules = [nativeSettings,
  nativeTextEntryDialog] as const` from `import * as … from "@/components/chrome/….gallery"`. Data
  only.
- `src/design/gallery/stories.ts` (pure, 90% tier, D9): `toStoryId(metaId, exportName)`
  (`"LongStrings"` → `long-strings`, joined `native-settings--long-strings`, Storybook's id format),
  `buildGalleryEntries(modules)` → ordered `{ id, metaId, title, name, story, component }[]`
  (registry order, then each meta's `stories` order), `findGalleryEntry(entries, id)` and
  `isGalleryEntryAvailable(entry, platform)`.
- `src/design/gallery/story-content.tsx`: `GalleryStoryContent({ entry })` renders `render(args)`
  or `<component {...args} />` inside a `flex: 1` `View`.
- `src/design/index.ts` exports the types (`export type`), `galleryEntries`
  (`buildGalleryEntries(galleryModules)`), `availableGalleryEntries()` (filtered by `Platform.OS`
  at call time), `findGalleryEntry` bound to the available entries, and `GalleryStoryContent`.
  The index lists `availableGalleryEntries()`; the story route redirects to the index for an id
  that is unknown or not available on the running platform.
- Fixtures import only types from `@/design` (`import type`), erased at build time, so the
  registry → fixture → `@/design` edge is not a runtime cycle. The fixture imports the components it
  exercises from `@/components/chrome`.

Alternative: a second public entry `@/design/gallery`. Proposal §3 and owner decision 1 fix one
barrel; the cycle risk is handled by type-only imports. Rejected.

### D5. `@/design` boundary in lint

- New `designDeepImportPattern` (`regex: "^@/design/"`, message naming the barrel) behind a
  `banDesignDeepImports = true` flag in `restrictedImports`, and a `timecalendar/design-home` block
  for `files: ["src/design/**"]` with `restrictedImports([routeEntrypointImportPattern],
  { banDesignDeepImports: false })`. Inside `src/design/`, files use relative `./` imports within a
  folder and `@/design/<folder>/…` across folders.
- New `boundaries/elements` entry `{ type: "design", pattern: "src/design", mode: "folder" }` and a
  disallow rule **B-7**: `from: { type: "design" }` may not reach `feature-sublayer`,
  `feature-barrel`, `route`, `generated-api` or `db-seam`. Design consumes `@/theme`,
  `@/components/chrome`, `@/i18n` types and `@/hooks`; it never knows a product feature.
- Each block lands with inject-and-revert evidence.

### D6. Native settings fixture: named stories

`src/components/chrome/native-settings.gallery.tsx`, meta
`{ id: "native-settings", title: "gallery.nativeSettings.title", component: NativeSettingsRow }`.
Each story renders its own `NativeSettingsHost`. Stories, in `stories` order:

| Export | Content (from today's screen) |
| --- | --- |
| `Rows` | navigation (icon, value, badge, hint), plain, action, value, subtitle rows; titled section with footer |
| `Destructive` | untitled section, destructive action row counting presses |
| `Switches` | on and off switch rows, one with icon |
| `Choices` | two choice rows, single selection |
| `HeaderAndAlert` | `NativeSettingsAlert` with Retry, `NativeSettingsHeader` caption counting retries |
| `FloatingAction` | host with `reservesFloatingAction`, `NativeSettingsFloatingAction`; `platforms: ["android"]` (iOS renders no FAB) |
| `RadioDialog` | action row opening `NativeSettingsRadioDialog` over the choices; `platforms: ["android"]` (iOS renders no radio dialog) |
| `LongStrings` | stress: longest French copy in label, subtitle, value, hint, footer, header tagline; badge `99+` |

testIDs become `gallery-native-settings-<thing>` (the `settings-gallery-*` ids go away with the
screen). Every row `href` stays `/about`. Copy moves from `settingsGallery.*` to
`gallery.nativeSettings.*` with the same values; `LongStrings` adds
`gallery.nativeSettings.long.*` keys whose French value is the longest copy of its kind (label
≥ 70 characters, footer ≥ 200 characters, single unbreakable word ≥ 25 characters in one label to
exercise the iOS trailing-word clip), with English translations of the same meaning.

### D7. Text-entry dialog fixture carries the disabled state

The seam has no disabled row, and adding one would be a seam change outside this slice.
`src/components/chrome/native-text-entry-dialog.gallery.tsx`
(`id: "native-text-entry-dialog"`, `component: NativeTextEntryDialog`) has `Default`,
`SubmitDisabled` (empty value, `submitDisabled`) and `Pending` (`pending`, with a validation
message) stories with a static `ids` object (`gallery-text-entry-*`). Each mounts the dialog open
over a `NativeSettingsHost` holding one "Open the dialog" action row
(`gallery-text-entry-open`). Cancel, hardware Back, the iOS swipe-dismiss and Save close the
dialog; the row reopens it. `pending` locks Cancel and the iOS swipe-dismiss, so the `Pending`
story releases it after 3 s, and reopening starts pending again; without that, an iOS reviewer
would have no way out of the story. This pulls one slice-2.3 fixture forward because it is the
only disabled/pending state already in chrome, and it gives the registry two modules so the
uniqueness checks test real data.

### D8. Render and accessibility matrix

`src/design/gallery/registry.test.ts`:

1. Orphans: walk `src/` with `node:fs` (`jest.requireActual`) for `*.gallery.tsx`; read
   `registry.ts` source and the resolved `galleryModules`; assert the set of imported fixture paths
   equals the set on disk.
2. Uniqueness: meta ids, titles, story ids; every story has `render` or `args`.
3. Matrix: `describe.each(["ios","android"])` with `usePlatform`, `describe.each(["light","dark"])`
   with a mutable `@/hooks/use-color-scheme` mock, `it.each(galleryEntries)` rendering
   `<GalleryStoryContent entry />`. A `console.error` spy fails the test on any React error.
4. Accessibility: in the same render, collect every host element, nested ones included, that
   accepts activation or change
   (Pressable/Touchable hosts — `onClick` / `onResponderRelease` / `onPress` — and hosts with
   `onValueChange`, `onCheckedChange`, `onSelect` or `onChange`, excluding `TextInput`). Each must
   have `accessibilityRole` (or `role`) and a non-empty accessible name (`accessibilityLabel` /
   `aria-label`, else its text content). Each `TextInput` must have a non-empty
   `accessibilityLabel`. Failures name story, platform and the element's `testID`.

A nested control is not folded into its ancestor. Compose merging stops at a child with its own
click or toggle semantics, so TalkBack gives a nested control its own stop; the check catches it.
The mocks follow the real controls: a Compose `RadioButton` is a control only with `onClick`
(Expo UI passes `clickable: onClick != null`), and a Compose `Switch` is always one (Expo UI's
`SwitchView` always passes Compose a non-null `onCheckedChange`).

The check reads what the suite-wide mocks project. If a fixture fails because a mock drops a
modifier the real native control carries, fix the mock to project it. Inject-and-revert proof: add
an unlabeled `Pressable` to one story, confirm the test fails, revert.
Host tests do not claim VoiceOver/TalkBack quality (testing.md).

### D8a. Known violations are listed and only shrink

A violation the product really has and cannot fix in this change is listed in
`src/design/gallery/known-a11y-violations.ts`: a typed entry per story id, platform and element
(`testID`, else `<nearest ancestor testID> > <role>`), with the problem, a reason and an
`docs/react-native-migration/inbox/` link. Per story and platform the registry test compares the
found violations with the listed ones and fails on both differences: an unlisted violation, and a
stale entry that no longer reproduces. A separate case fails on an entry naming a story absent from
its platform, or a duplicate entry. The list can therefore only shrink, and a fix proves itself by
deleting its entry.

The list holds the Android switch row. `ComposeSettingsSwitchRow` is a `ListItem` with
`toggleable(value, toggle, { role: "switch" })` and a trailing Material `Switch`. Expo UI 56 has no
way to pass Compose a null `onCheckedChange` and no semantics-clearing modifier, so the `Switch` is
a second, unlabeled "Switch" stop (`native-settings--switches`, `native-settings--long-strings`).
The fix, a local Expo module registering a `clearAndSetSemantics` Compose modifier on the trailing
`Switch` with the row carrying `switchTestID ?? testID`, adds Kotlin every Android build links and
needs an Android build and a TalkBack check this change cannot run; the inbox note
`2026-10-25-mobile-design-system-gallery-device-pass.md` carries it, and deleting the entries is its
acceptance test.

Alternatives: dropping the nested-control check (hides the defect); a disabled `Switch` (still a
focusable node, announced as disabled); dropping row toggling and labeling the `Switch` (no
`contentDescription` modifier in Expo UI 56). Rejected.

### D9. Coverage tier for the gallery logic

Add `"src/design/gallery/*.ts": { lines: 90, branches: 90 }` to `coverageThreshold`. It covers
`stories.ts` and `registry.ts` (`types.ts` has no statements); the `.tsx` fixtures and
`story-content.tsx` stay in the 70% global tier with presentational code (ADR 003).
`stories.test.ts` covers every branch with synthetic modules (args-only story, `stories` order,
platform availability, not-found lookup, multi-word export names).

### D10. Strings

- Add `gallery.title` ("Component gallery" / "Galerie de composants"),
  `gallery.nativeSettings.title`, `gallery.nativeSettings.story.<name>` per story,
  `gallery.nativeSettings.*` copy, `gallery.textEntryDialog.*` (title, story names, dialog copy,
  the `open` row), and `gallery.openStory.hint` ("Opens this component state" / "Ouvre cet état
  du composant") on every index row.
- Remove every `settingsGallery.*` key.
- `developer.gallery.label` becomes "Component gallery" / "Galerie de composants";
  `developer.gallery.hint` becomes "Every component state, one screen each" /
  "Chaque état de composant, un écran chacun".

### D11. No-Storybook contract

`src/design/gallery/no-storybook.contract.test.ts` reads `mobile/package.json` and asserts no key
matching `^storybook$`, `^@storybook/` or `^react-native-web$` in `dependencies`,
`devDependencies`, `peerDependencies` or `optionalDependencies`, and that neither
`mobile/.storybook` nor `mobile/.rnstorybook` exists.

## Decision (ADR 064): in-house component gallery instead of Storybook

Lifted into `docs/mobile/architecture-book/decisions/064-in-house-component-gallery.md`.

- **Chosen:** an in-house gallery under `/developer/gallery` where each fixture is a real Expo
  Router screen, CSF3-shaped, behind the developer capability gate. Scope frozen to an index and a
  story route: no controls, actions, backgrounds or docs engine.
- **Rejected:** `@storybook/react-native` on device (no on-device accessibility addon, a story is a
  view inside one route rather than a screen under the real header, a second config and Jest ESM
  transform, and a 10.x → 11.x migration soon after adoption); Storybook for web via
  `react-native-web` (does not render SwiftUI/Compose, conflicts with ADR 007); the hybrid of both.
- **Why:** the accessibility review tools are the platform's either way; screen readers judge
  screens, and a gallery route is the screen; the real providers, translations and capability gate
  already exist; fixture states become a Jest matrix with no second config. Native-dependency and
  fingerprint costs are not part of the rationale: the app is not in production.
- **Given up:** live prop editing. Named states (longest French string, disabled, pending, largest
  text) are easier to review than knobs.
- **Revisit if:** a second contributor or a designer needs a self-serve workshop; live prop editing
  becomes a real need; Chromatic for React Native leaves early access and visual review as a service
  is wanted.

## Risks / Trade-offs

- [Hand-rebuilding Storybook] → ADR 064 freezes scope; a gallery feature beyond index + story route
  needs an ADR amendment.
- [Fixture code ships in store bundles] → inert behind the subtree gate, proven by the
  developer-routes contract test; same posture as `/dev-import`.
- [Preview testers see the gallery] → intended (owner decision 2): it is where SwiftUI/Compose
  rendering is checked on the store artifact.
- [Accessibility check reads mocks, not native views] → it proves every control is declared with a
  role and label; meaning, focus order and announcement quality remain the device recipe and the
  owner's screen-reader pass.
- [Fixture rot] → the render matrix catches crashes and missing labels, not semantic drift; slice
  2.3 and each phase-3 primitive add fixtures with their component.
- [Cold deep link back stack] → a cold link to a story puts `(tabs)` beneath it (root Stack
  `initialRouteName`), so Back returns to the tabs, not the index. Accepted for a developer tool.
- [`import type` discipline] → a value import from `@/design` in a fixture would create a runtime
  cycle; `@typescript-eslint/consistent-type-imports` is not relied on, so the registry render test
  is the backstop (a cycle yields `undefined` bindings and fails rendering).

## Migration Plan

Pre-release app: no data, no store users. One PR; `/settings-gallery` is deleted outright with no
redirect (no external link to it exists; Maestro does not use it). Rollback is a revert.
