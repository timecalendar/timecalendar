# Design-system gallery (`/developer/gallery`)

## Why

The design-system work (phase 3 primitives, phase 5 screen migrations) needs one place where every
component state is reviewed on device, in both schemes, at the largest text sizes and under
VoiceOver/TalkBack (owner decision 8). Today the only catalog is `/settings-gallery`: one hand-built
screen for one seam, with no registry, no per-state deep link and strings in a
`settingsGallery.*` namespace that does not scale. The audit chose an in-house, on-device gallery
over Storybook (`docs/mobile/design-system-audit/storybook-options.md` §Recommendation). This is
roadmap slice 2.2 and lands ADR C.

## What Changes

- **New `src/design/` layer** behind one `@/design` barrel (proposal §3). It starts with
  `src/design/gallery/`: local CSF3-shaped types (`GalleryMeta` with `id`, `title`, `component`;
  `GalleryStory` with `name`, `args?`, `render?`), an explicit registry of
  `import * as x from "…gallery"` modules (no `require.context`), and pure helpers that derive
  stable story ids (`native-settings--switches`) and look stories up. No Storybook import anywhere.
- **Two new routes** on the root Stack, beside `/developer`, with no layout restructure
  (the `user-calendars.tsx` + `user-calendars/[id].tsx` precedent):
  - `/developer/gallery`: the index, one native settings section per fixture module, one
    navigation row per story.
  - `/developer/gallery/[story]`: one story rendered as the screen under the real compact native
    header titled with the story's translated name. Deep-linkable as
    `timecalendar-dev://developer/gallery/<id>`; an unknown id redirects to the index.
- **One gate for the whole `/developer` subtree**: the backend capability `!== "production"`
  check moves into one developer-feature helper used by all three screens; production redirects
  to `/settings`. A contract test fails if any `src/app/developer*` route bypasses it.
- **Fixtures**: today's `SettingsGalleryScreen` content moves into
  `src/components/chrome/native-settings.gallery.tsx`, split into named stories, plus a
  long-French-strings stress story. `src/components/chrome/native-text-entry-dialog.gallery.tsx`
  adds the disabled (`submitDisabled`) and pending states, because the native-settings seam has no
  disabled state of its own.
- **Removed**: `/settings-gallery`, `SettingsGalleryScreen` and its test, the `settings-gallery`
  root Stack registration, and every `settingsGallery.*` key. The developer page's Design row opens
  `/developer/gallery` and is relabeled "Component gallery".
- **Strings**: every gallery and fixture string lives under `gallery.*` in FR and EN, typed and
  parity-checked; fixture titles and story names are typed to that namespace. No lint exemption.
- **Gates (Principle 1)**:
  - `src/design/gallery/registry.test.ts`: every `src/**/*.gallery.tsx` is registered; meta ids,
    titles and story ids are unique; every story renders in light and dark on iOS and Android;
    every interactive host element in every story carries an accessibility role and label.
  - Developer-routes contract test: every `/developer` subtree route is a thin re-export whose
    screen redirects in production.
  - No-Storybook contract test: no `storybook`, `@storybook/*` or `react-native-web` dependency
    and no `.storybook` / `.rnstorybook` directory.
  - Lint: `@/design/*` deep imports banned outside `src/design/**`; a `boundaries` rule forbids
    `src/design/**` from importing features, routes, `@/api/generated` or `@/db`.
  - Coverage: `src/design/gallery/*.ts` joins the 90% lines + branches tier.
- **ADR 064** (roadmap ADR C): in-house CSF3-shaped gallery instead of Storybook, frozen scope,
  revisit triggers.
- **Architecture Book**: `accessibility.md` device recipe (deep link, text size and dark mode on
  both simulators, screenshot + accessibility tree, screen-reader pass), `navigation.md`,
  `features.md`, `testing.md`, `lint-format.md`, `theming.md`, `architecture.md`, dated
  `CHANGELOG.md` entry.

## Capabilities

### New Capabilities

- `mobile-design-system-gallery`: the CSF3-shaped fixture format, the explicit registry and its
  orphan/uniqueness gate, stable story ids and deep links, the index and story routes, the
  light/dark × iOS/Android render and accessibility matrix, translated gallery strings, and the
  no-Storybook contract.

### Modified Capabilities

- `mobile-developer-page`: the Design row opens the component gallery instead of the settings
  gallery, and the production gate covers the whole `/developer` subtree, not one screen.

## Impact

- Code (`mobile/`): new `src/design/{index.ts,gallery/types.ts,gallery/registry.ts,
  gallery/stories.ts,gallery/stories.test.ts,gallery/registry.test.ts,gallery/no-storybook.contract.test.ts}`;
  new `src/components/chrome/{native-settings,native-text-entry-dialog}.gallery.tsx`; new
  `src/features/developer/ui/{developer-access.ts,gallery-index-screen.tsx,gallery-story-screen.tsx}`
  + tests and `developer-routes.contract.test.tsx`; new `src/app/developer/gallery.tsx` and
  `src/app/developer/gallery/[story].tsx`; changed `developer-screen.tsx` + test,
  `src/app/_layout.tsx`, `settings-route-structure.test.ts`, `src/i18n/locales/{en,fr}.json`,
  `eslint.config.js`, `jest.config.js`; deleted `src/app/settings-gallery.tsx`,
  `src/features/settings/ui/settings-gallery-screen{,.test}.tsx` and its barrel export.
- No new dependency, no `package.json` script, no `metro.config.js` / `babel.config.js` /
  `app.config.ts` / `eas.json` change, no native asset. Fixture code ships inert in store bundles
  behind the tested gate, the same posture as `/dev-import`.
- Maestro: no flow references `settings-gallery`; `e2e/maestro-selectors.test.ts` keeps passing.
