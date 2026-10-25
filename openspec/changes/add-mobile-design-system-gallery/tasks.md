# Tasks

All commands run in `mobile/` unless stated. Design decisions are D1–D11 in `design.md`. Await
every RNTL 14 helper (`render`, `fireEvent`); no fake timers; `usePlatform` for platform branches;
no `jest.restoreAllMocks()`. One commit (`feat(mobile): design-system gallery under /developer`)
unless a split helps review.

## 1. Strings

- [x] 1.1 In `src/i18n/locales/en.json` and `fr.json` (D6, D10): add `gallery.title`,
      `gallery.nativeSettings.title`, `gallery.nativeSettings.story.{rows,destructive,switches,choices,headerAndAlert,floatingAction,radioDialog,longStrings}`,
      every `gallery.nativeSettings.*` copy key carrying today's `settingsGallery.*` values
      verbatim (same suffixes, e.g. `settingsGallery.switch.on` → `gallery.nativeSettings.switch.on`),
      the `gallery.nativeSettings.long.*` stress keys (French label ≥ 70 characters, footer ≥ 200,
      one label containing a single word ≥ 25 characters, plus subtitle, value, hint and tagline;
      English carries the same meaning), and `gallery.textEntryDialog.{title,story.default,story.submitDisabled,story.pending,dialogTitle,fieldLabel,placeholder,validation,cancel,submit}`.
      Change `developer.gallery.label` / `.hint` to the D10 strings. Delete every `settingsGallery.*`
      key. Verify: `npx tsc --noEmit` passes once §3–§5 use the new keys;
      `grep -rn "settingsGallery" src` returns nothing.

## 2. `@/design` layer and gallery core

- [x] 2.1 Create `src/design/gallery/types.ts` per D3 (`GalleryKey`, `GalleryMeta<P>` with `id`,
      `title`, `component`; `GalleryStory<P>` with required `name`, optional `args`, `render`;
      `GalleryModule`), importing `en` with `import type` and nothing from Storybook. Verify:
      `npx tsc --noEmit`; a scratch `const s: GalleryStory<object> = { name: "developer.title" }`
      fails to compile (delete it).
- [x] 2.2 Create `src/design/gallery/stories.ts` per D4: `toStoryId(metaId, exportName)`
      (camelCase/PascalCase export → kebab, `"<metaId>--<kebab>"`), `buildGalleryEntries(modules)`
      (registry order then each meta's `stories` order), `findGalleryEntry(entries, id)`
      (returns `undefined` when absent) and `isGalleryEntryAvailable(entry, platform)`. Verify: §2.3 passes.
- [x] 2.3 Create `src/design/gallery/stories.test.ts` with synthetic modules covering every
      branch: single-word and multi-word export names, an args-only story, `stories` ordering,
      platform availability, found and not-found lookup. Verify:
      `npx jest src/design/gallery/stories.test.ts --coverage --collectCoverageFrom='src/design/gallery/*.ts'`
      reports 100% branches on `stories.ts`.
- [x] 2.4 Create `src/design/gallery/story-content.tsx`: `GalleryStoryContent({ entry })` renders
      `entry.story.render(args)` when present, else `<entry.component {...entry.story.args} />`,
      inside a `View` with `StyleSheet` `flex: 1`. No literals, no `allowFontScaling`. Verify:
      `npx tsc --noEmit`.
- [x] 2.5 Create `src/design/gallery/registry.ts` (`galleryModules` array of
      `import * as nativeSettings from "@/components/chrome/native-settings.gallery"` and
      `import * as nativeTextEntryDialog from "@/components/chrome/native-text-entry-dialog.gallery"`;
      no `require.context`) and `src/design/index.ts` exporting the types (`export type`),
      `galleryEntries`, `findGalleryEntry(id)` bound to them, and `GalleryStoryContent`. Verify:
      `npx tsc --noEmit` (after §3).
- [x] 2.6 In `jest.config.js` add `"src/design/gallery/*.ts": { lines: 90, branches: 90 }` to
      `coverageThreshold` (D9). Verify: `npx jest jest.config.test.ts` passes and §8.3 enforces it.

## 3. Fixtures

- [x] 3.1 Create `src/components/chrome/native-settings.gallery.tsx` per D6: default meta
      `{ id: "native-settings", title: "gallery.nativeSettings.title", component: NativeSettingsRow }`
      and the eight named stories (`Rows`, `Destructive`, `Switches`, `Choices`, `HeaderAndAlert`,
      `FloatingAction`, `RadioDialog`, `LongStrings`), each with a `gallery.nativeSettings.story.*`
      `name` and `render: () => <XFixture />`, where each `XFixture` is a named component holding
      its own state and its own `NativeSettingsHost`. Port the behavior of
      `settings-gallery-screen.tsx` exactly (retry counter in the header caption, destructive and FAB
      counters, switch toggles, choice selection, Android radio dialog select/cancel). testIDs
      `gallery-native-settings-*`. Import components from `@/components/chrome` and types with
      `import type { … } from "@/design"`. Do NOT export the fixture from the chrome barrel. Verify:
      `npx tsc --noEmit`; `npx eslint src/components/chrome/native-settings.gallery.tsx` clean.
- [x] 3.2 Create `src/components/chrome/native-text-entry-dialog.gallery.tsx` per D7: meta
      `{ id: "native-text-entry-dialog", title: "gallery.textEntryDialog.title", component: NativeTextEntryDialog }`,
      stories `Default`, `SubmitDisabled`, `Pending`, each a named fixture component rendering a
      `NativeSettingsHost` with the reopen row and the dialog (open on mount, closed by Cancel/Save,
      `Pending` released after 3 s) with a static `ids` object
      (`gallery-text-entry-*` testIDs), `gallery.textEntryDialog.*` copy, `inputKind="text"`.
      Verify: `npx tsc --noEmit`; eslint clean on the file.
- [x] 3.3 Create `src/components/chrome/native-settings.gallery.test.tsx` porting the behavioral
      assertions of `settings-gallery-screen.test.tsx` to the stories (render each story's
      `render()` on both platforms: retry → caption `Version 1.0 · 1`; switch toggles flip
      `accessibilityState.checked`; choice selects; destructive and FAB counters; Android radio
      dialog select and cancel; iOS has no FAB and no dialog; heading role on the header app name),
      and `native-text-entry-dialog.gallery.test.tsx` asserting the disabled and pending states on
      both platforms. Verify: `npx jest src/components/chrome/*.gallery.test.tsx` passes.

## 4. Gallery screens and routes

- [x] 4.1 Create `src/features/developer/ui/developer-access.ts` (`isDeveloperSurfaceEnabled()`,
      D2) and make `DeveloperScreen` use it instead of its inline capability check. Change its
      Design row `href` to `"/developer/gallery"`. Verify: `npx tsc --noEmit`.
- [x] 4.2 Create `src/features/developer/ui/gallery-index-screen.tsx` (`GalleryIndexScreen`):
      gate first (redirect `/settings`); `<Stack.Screen options={{ title: t("gallery.title") }} />`;
      `NativeSettingsHost` with one `NativeSettingsSection` per fixture (title `t(meta.title)`,
      testID `gallery-section-<metaId>`) and one `kind="navigation"` row per story (label
      `t(entry.name)`, `href={{ pathname: "/developer/gallery/[story]", params: { story: entry.id } }}`,
      hint `t("gallery.openStory.hint")`, testID `gallery-story-<id>`). Group from
      `availableGalleryEntries()` in order. Verify: `npx tsc --noEmit`.
- [x] 4.3 Create `src/features/developer/ui/gallery-story-screen.tsx` (`GalleryStoryScreen`): gate
      first; read `story` with `useLocalSearchParams<{ story: string }>()`; unknown id →
      `<Redirect href="/developer/gallery" />`; else
      `<Stack.Screen options={{ title: t(entry.name) }} />` and `<GalleryStoryContent entry />`. No
      other chrome (spec: a story renders as a real screen). Verify: `npx tsc --noEmit`.
- [x] 4.4 Export both screens from `src/features/developer/ui/index.ts`. Create
      `src/app/developer/gallery.tsx` =
      `export { GalleryIndexScreen as default } from "@/features/developer/ui"` and
      `src/app/developer/gallery/[story].tsx` =
      `export { GalleryStoryScreen as default } from "@/features/developer/ui"`. Do not create
      `developer/_layout.tsx` or `developer/gallery/index.tsx` (D1). In `src/app/_layout.tsx` register
      `<Stack.Screen name="developer/gallery" />` and `<Stack.Screen name="developer/gallery/[story]" />`
      directly after `developer`. Verify: §6.3 passes.
- [x] 4.5 Delete `src/app/settings-gallery.tsx`, `src/features/settings/ui/settings-gallery-screen.tsx`,
      `settings-gallery-screen.test.tsx`, the `SettingsGalleryScreen` export from
      `src/features/settings/ui/index.ts`, and `<Stack.Screen name="settings-gallery" />`. Verify:
      `grep -rn "settings-gallery\|SettingsGallery" src` returns only the absence assertion in
      `settings-screen.test.tsx` (which stays) and `npx tsc --noEmit` passes.

## 5. Lint gate for `@/design` (D5)

- [x] 5.1 In `eslint.config.js`: add `designDeepImportPattern` (`regex: "^@/design/"`, message
      "Import the design system through the @/design barrel (design-system-proposal §3,
      lint-format.md → Design layer).") behind `banDesignDeepImports = true` in `restrictedImports`;
      add block `timecalendar/design-home` (`files: ["src/design/**"]`,
      `restrictedImports([routeEntrypointImportPattern], { banDesignDeepImports: false })`) after
      `timecalendar/developer-tools-home` with a one-line comment on re-including the route
      pattern; add `{ type: "design", pattern: "src/design", mode: "folder" }` to
      `boundaries/elements` and a B-7 disallow `from: { type: "design" }` →
      `["feature-sublayer", "feature-barrel", "route", "generated-api", "db-seam"]` with a B-7
      message. Verify: `npm run lint` clean with zero warnings.
- [x] 5.2 Inject-and-revert, recording commands and trimmed outputs in
      `openspec/changes/add-mobile-design-system-gallery/evidence.md`: (a)
      `import { galleryModules } from "@/design/gallery/registry"` in `gallery-index-screen.tsx` →
      `no-restricted-imports` with the D5 message; (b) the same import inside
      `src/design/index.ts` lints clean; (c) `import "@/features/settings"` in
      `src/design/gallery/stories.ts` → `boundaries/dependencies` B-7; (d) `import "@/app/about"` in
      `src/design/gallery/stories.ts` still reports the route-entrypoint ban. Revert all injections.

## 6. Tests

- [x] 6.1 Create `src/design/gallery/registry.test.ts` per D8: orphan check (fs walk of `src/**`
      for `*.gallery.tsx` vs the registry's imports, both directions), unique meta ids, titles and
      story ids, every story has `render` or `args`; render matrix
      `describe.each(["ios","android"])` × `describe.each(["light","dark"])` (mutable
      `@/hooks/use-color-scheme` mock) × `it.each(galleryEntries)` rendering
      `<GalleryStoryContent entry />` with a `console.error` spy that fails the test; and in the
      same render the interactive-element accessibility assertion (role + non-empty accessible
      name; `TextInput` label), failures naming story/platform/testID. If a mock drops a real
      modifier, fix `jest/setup-expo-ui.ts`, never exempt the story. Verify:
      `npx jest src/design/gallery/registry.test.ts` passes. Inject-and-revert (record in
      evidence.md): (a) an unregistered `src/components/chrome/scratch.gallery.tsx` → orphan
      failure; (b) duplicate a story id → uniqueness failure; (c) an unlabeled `Pressable` in one
      fixture → accessibility failure. Revert all.
- [x] 6.2 Create `src/design/gallery/no-storybook.contract.test.ts` per D11. Verify: it passes;
      temporarily add `"@storybook/react-native": "10.0.0"` to `package.json` `devDependencies`
      (no install) → it fails naming the package; revert and record in evidence.md.
- [x] 6.3 In `src/components/settings-route-structure.test.ts`: delete the settings-gallery test;
      extend the developer test to assert `developer/gallery.tsx` and `developer/gallery/[story].tsx`
      are the thin re-exports of §4.4, both are registered on the root Stack, the index screen
      contains `title: t("gallery.title")` and the story screen `title: t(entry.name)`, and
      `developer/_layout.tsx` and `developer/gallery/index.tsx` do not exist. Verify:
      `npx jest src/components/settings-route-structure.test.ts` passes, including
      "classifies every root route".
- [x] 6.4 Create `src/features/developer/ui/developer-routes.contract.test.tsx` per D2: discover
      `src/app/developer.tsx` and every `.tsx` under `src/app/developer/`, assert each is one
      `export { X as default } from "@/features/developer/ui"` line, render each `X` from the `ui`
      barrel with capability `production` (mutable `@/features/environment` mock, `expo-router`
      mock with `Redirect` → `Text` href, `useLocalSearchParams` → `{ story: "native-settings--rows" }`)
      and assert the redirect `/settings` and no `gallery-*` / `developer-*` testID. Verify: passes;
      inject-and-revert: remove the gate from `GalleryStoryScreen` → fails naming the route; record
      in evidence.md.
- [x] 6.5 Create `src/features/developer/ui/gallery-index-screen.test.tsx` and
      `gallery-story-screen.test.tsx` (both platforms): index renders one section per fixture in
      registry order and one row per story; pressing `gallery-story-native-settings--switches`
      pushes `{ pathname: "/developer/gallery/[story]", params: { story: "native-settings--switches" } }`
      (or the equivalent `router.push` the row issues); story screen renders the requested story's
      content testID and sets the title; unknown id redirects to `/developer/gallery`; preview
      capability renders both. Verify: `npx jest src/features/developer` passes.
- [x] 6.6 In `developer-screen.test.tsx`: the gallery row pushes `/developer/gallery`; keep the
      production and preview cases. Verify: `npx jest src/features/developer/ui/developer-screen.test.tsx`.
- [x] 6.7 Confirm Maestro is unaffected: `grep -rn "settings-gallery" .maestro e2e` returns nothing
      and `npx jest e2e/maestro-selectors.test.ts` passes.

## 7. Architecture Book and ADR

- [x] 7.1 Write `docs/mobile/architecture-book/decisions/064-in-house-component-gallery.md` from
      `TEMPLATE.md` with the design.md "Decision (ADR 064)" content: Context (component review
      needs per owner decision 8; audit in `docs/mobile/design-system-audit/storybook-options.md`),
      Decision (in-house CSF3-shaped gallery, frozen scope: index + story route, no controls, no
      docs engine; gate; translated strings; the registry and no-Storybook gates), Consequences,
      Revisit if (second contributor/designer, live prop editing, Chromatic RN GA). Do not cite
      native-dependency or fingerprint cost. Re-check `gh pr list` for an open PR adding `064` first.
      Add the index row in `decisions/README.md` ("Review components in an in-house on-device
      gallery, not Storybook"). Verify: the link resolves.
- [x] 7.2 `accessibility.md`: add "## Device accessibility recipe" (before "Proof in CI"): open a
      story by deep link (`xcrun simctl openurl <udid> timecalendar-dev://developer/gallery/<id>`;
      `adb shell am start -a android.intent.action.VIEW -d timecalendar-dev://developer/gallery/<id>`;
      `timecalendar://…` on preview builds); set conditions with
      `xcrun simctl ui <udid> content_size accessibility-extra-extra-extra-large` and
      `xcrun simctl ui <udid> appearance dark` on iOS, `adb shell settings put system font_scale 2.0`
      and `adb shell cmd uimode night yes` on Android; take a screenshot and read the accessibility
      tree; VoiceOver / TalkBack swipe-through; reset after (`content_size large`, `appearance light`,
      `font_scale 1.0`, `cmd uimode night no`). Android runs on the Windows host. Add to "Proof in
      CI" the registry test's role + label matrix (pointer to `src/design/gallery/registry.test.ts`,
      noting it reads the native mocks).
- [x] 7.3 `navigation.md`: Developer page paragraph — Design opens `/developer/gallery`; replace the
      `/settings-gallery` paragraph with the gallery routes (layout-less siblings, D1), deep link
      format, unknown id → index, and the one subtree gate proven by
      `developer-routes.contract.test.tsx`.
- [x] 7.4 `features.md`: `developer` row hosts the component gallery (`/developer/gallery`,
      `/developer/gallery/[story]`), links `/dev-import` and the gallery; add a "Design system
      gallery" entry pointing at `src/design/gallery/` and ADR 064.
- [x] 7.5 `testing.md`: add a "Gallery fixtures" bullet (registry orphan/uniqueness, light/dark ×
      iOS/Android render matrix, accessible-control check, no-Storybook contract, the
      `src/design/gallery/*.ts` 90% tier) next to the native settings chrome bullet.
- [x] 7.6 `lint-format.md`: add the `@/design` barrel ban (`banDesignDeepImports`,
      `timecalendar/design-home`) to the restricted-imports inventory and B-7 to the boundaries list.
      `theming.md`: the native-settings geometry device evidence is checked through
      `/developer/gallery`. `architecture.md` Structure: add "Design-system primitives, fixtures and
      the gallery registry live in `src/design/` behind the `@/design` barrel."
- [x] 7.7 `CHANGELOG.md`: top entry `## 2026-10-25 — Design-system gallery` listing the routes and
      deep links, the gate, CSF3 fixtures + explicit registry, removed `/settings-gallery`,
      `gallery.*` strings, the new tests, lint and coverage tier, ADR 064 and the accessibility
      recipe. Current state only, no history wording, in every touched doc. Verify:
      `npx prettier --check` on every touched Markdown file.
- [x] 7.9 `accessibility.md`: nested controls are checked on their own; known violations live in
      `known-a11y-violations.ts` with an inbox link and the list only shrinks. `theming.md`: the
      Android switch row's trailing `Switch` is a known violation. `testing.md` and `CHANGELOG.md`
      name the known-violation list.
- [ ] 7.8 Update the Purpose of `openspec/specs/mobile-developer-page/spec.md` at archive time to
      name the component gallery instead of the settings gallery entry.

## 7a. Review fixes

- [x] 7a.1 Dialog stories are escapable (D7): `open` state, Cancel/Save close, the
      `gallery-text-entry-open` row reopens, `Pending` releases after 3 s.
      `native-text-entry-dialog.gallery.test.tsx` proves cancel → closed, reopen, save → closed and
      the pending release on both platforms.
- [x] 7a.2 Nested controls (D8, D8a): drop the interactive-ancestor skip from
      `registry.test.ts`; the Compose `RadioButton` mock is a control only with `onClick`, the
      `Switch` mock always. Add `src/design/gallery/known-a11y-violations.ts` with the Android
      switch-row entries for `native-settings--switches` and `native-settings--long-strings`; the
      registry test fails on an unlisted violation, a stale entry and an entry for a story absent
      from its platform. Inject-and-revert: deleting an entry fails with `unlisted`, a bogus entry
      fails with `stale`. The switch-row fix is in
      inbox/2026-10-25-mobile-design-system-gallery-device-pass.md.
- [x] 7a.3 Explicit story order (D3): `GalleryMeta.stories`, `buildGalleryEntries` follows it, the
      registry test keeps it equal to the story exports.
- [x] 7a.4 `platforms` on stories; `FloatingAction` and `RadioDialog` are Android-only; the index
      hides and the story route redirects off-platform stories.
- [x] 7a.5 `gallery.openStory.hint` on index rows; the Settings Developer row reads
      `isDeveloperSurfaceEnabled()`; B-7 lint message and `architecture.md` Structure wording.

## 8. Local verification

- [x] 8.1 `npx tsc --noEmit` passes.
- [x] 8.2 `npm run lint` passes with zero warnings.
- [x] 8.3 `npm test -- --coverage` passes, including the 90% tier on `src/design/gallery/*.ts`, the
      70% global floor, and the per-file branch gate for every touched file.
- [x] 8.4 iOS simulator smoke (Mac): on a development build, open
      `timecalendar-dev://developer/gallery/native-settings--long-strings` and
      `…/native-text-entry-dialog--submit-disabled` at `accessibility-extra-extra-extra-large` in
      dark mode, take screenshots and the accessibility tree, reset the simulator, and attach them
      to evidence.md.
- [ ] 8.5 Android device pass at `font_scale 2.0` / night mode and the VoiceOver + TalkBack
      swipe-through of the listed stories (HUMAN: see inbox/2026-10-25-mobile-design-system-gallery-device-pass.md)
