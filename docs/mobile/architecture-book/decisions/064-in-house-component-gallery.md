# 064 — Review components in an in-house on-device gallery, not Storybook

## Status

Accepted.

## Context

Every design-system component state has to be reviewed on device, in both schemes, at the
largest text sizes and under VoiceOver and TalkBack (owner decision 8). Most of those states are
SwiftUI or Jetpack Compose controls, so only the native app renders them. The audit compared
on-device Storybook, Storybook for web and an in-house gallery in
`docs/mobile/design-system-audit/storybook-options.md`.

## Decision

- The gallery is in-house, under `/developer/gallery` (index) and `/developer/gallery/<story id>`
  (one story per screen, under the real compact native header, deep-linkable as
  `timecalendar-dev://developer/gallery/<id>`). Both routes sit behind the developer capability
  gate shared by the whole `/developer` subtree.
- Fixtures are CSF3-shaped `*.gallery.tsx` modules colocated with their component: a default meta
  (`id`, `title`, `component`) and one named export per story (`name`, `args`, `render`). Titles and
  story names are typed `gallery.*` translation keys. Story ids are
  `<meta id>--<kebab-case export name>`. Nothing imports Storybook.
- `src/design/gallery/registry.ts` lists fixture modules explicitly. `registry.test.ts` fails on an
  orphan or extra fixture, a duplicate id or title, a story without `render` or `args`, a render
  error in light or dark on either platform branch, or an interactive element without a role and
  a label. `no-storybook.contract.test.ts` fails if `storybook`, `@storybook/*` or
  `react-native-web` enters `package.json`, or a `.storybook` / `.rnstorybook` directory appears.
- Scope is frozen: an index and a story route. No controls, actions, backgrounds, docs pages,
  search or story switcher.
- Rejected: `@storybook/react-native` on device (no on-device accessibility addon, a story is a
  view inside one route instead of a screen under the real header, a second configuration and Jest
  ESM transform, a major-version migration soon after adoption); Storybook for web through
  `react-native-web` (it does not render SwiftUI or Compose and conflicts with ADR [007](./007-drop-web-target.md)); both
  together.

## Consequences

- The accessibility review tools are the platform's own; a gallery route is the screen a screen
  reader judges, with the real providers, translations and gate.
- Fixture states are a Jest matrix with no second configuration. The matrix reads the native
  mocks, so it proves declared roles and labels, not announcement quality; the device recipe in
  [accessibility.md](../accessibility.md) covers that.
- Live prop editing is given up. Named states (longest French copy, disabled, pending, largest
  text) are the review unit.
- Fixture code ships inert in store bundles behind the developer gate, the posture of
  `/dev-import`.
- Any gallery feature beyond the index and story route amends this ADR first.

## Revisit if

- A second contributor or a designer needs a self-serve component workshop.
- Live prop editing becomes a real review need.
- Chromatic for React Native leaves early access and visual review as a service is wanted.
