# Spec Delta

## Purpose

An in-house, on-device component gallery under `/developer/gallery` where every design-system and
native-chrome component state is a named, deep-linkable fixture rendered as a real screen, so it
can be reviewed in both schemes, at large text sizes and with VoiceOver/TalkBack on development
and preview builds.

## ADDED Requirements

### Requirement: Fixtures are CSF3-shaped modules with no Storybook dependency

Each fixture module SHALL be a `*.gallery.tsx` file colocated with the component it exercises. Its
default export SHALL be a meta object with a stable kebab-case `id`, a `title` and the `component`;
each named export SHALL be a story with a `name` and an optional `args` and/or `render`, so the
module stays loadable by Component Story Format 3 tooling as a configuration change. A fixture's
`title` and every story `name` SHALL be translation keys in the `gallery.*` namespace, checked at
compile time. A story without `render` SHALL declare `args`, and SHALL render the meta component
with them. No fixture, type or gallery module SHALL import Storybook.

#### Scenario: A story name outside the gallery namespace fails to compile

- **WHEN** a story declares a `name` that is not a `gallery.*` catalog key
- **THEN** `npx tsc --noEmit` fails

#### Scenario: A story without render or args is rejected

- **WHEN** a registered story declares neither `render` nor `args`
- **THEN** the registry test fails naming the story

### Requirement: The fixture registry is explicit and complete

The gallery SHALL list fixture modules in one explicit, reviewable registry; it SHALL NOT discover
fixtures at runtime (no `require.context` or glob in app code). Every `*.gallery.tsx` file under
`mobile/src/` SHALL be in the registry, and the registry SHALL reference no other file. Fixture
meta ids SHALL be unique, fixture titles SHALL be unique, and story ids SHALL be unique across the
registry.

#### Scenario: An unregistered fixture fails CI

- **WHEN** a `*.gallery.tsx` file exists under `src/` and is not in the registry
- **THEN** the registry test fails naming the orphan file

#### Scenario: A duplicate id or title fails CI

- **WHEN** two fixture modules share a meta id or a title, or two stories resolve to the same id
- **THEN** the registry test fails naming the duplicate

### Requirement: Stories have stable ids and deep links

A story's id SHALL be `<meta id>--<kebab-case export name>` (for example
`native-settings--switches`), independent of its translated name, so renaming copy never breaks a
link. Each story SHALL be reachable at `/developer/gallery/<story id>`, including as a cold deep
link (`timecalendar-dev://developer/gallery/<story id>` on development builds). An id that matches
no registered story SHALL redirect to the gallery index.

#### Scenario: A deep link opens one story

- **WHEN** a development build opens `timecalendar-dev://developer/gallery/native-settings--switches`
- **THEN** the switches story renders as the screen under a native header titled with its
  translated name

#### Scenario: An unknown story id falls back to the index

- **WHEN** `/developer/gallery/does-not-exist` is opened
- **THEN** the app redirects to `/developer/gallery`

### Requirement: The gallery index lists every story in native grouped sections

`/developer/gallery` SHALL render, under the compact native header with a localized title, one
native settings section per registered fixture module (titled with the fixture's translated
title, in registry order) and one navigation row per story (labeled with the story's translated
name, in export order) that opens the story route. Rows SHALL follow the native settings row
contract (one focus stop, link/button role, disclosure, decorative icons hidden).

#### Scenario: Activating a story row opens it

- **WHEN** the user activates the index row for `native-settings--switches`
- **THEN** the app pushes `/developer/gallery/native-settings--switches`

### Requirement: A story renders as a real screen

The story route SHALL render the story as the route's whole content under the root Stack's real
compact native header, titled with the story's translated name, with the app's real theme,
translation, safe-area and router providers. It SHALL add no gallery chrome (no controls panel, no
docs page, no story switcher) around the fixture, so focus order and the back button are what
ships.

#### Scenario: Screen readers meet the header first

- **WHEN** VoiceOver or TalkBack enters a story screen
- **THEN** the first focus stop is the native header (back button, then the story title) and
  the next stops are the fixture's own content

### Requirement: Every story renders in both schemes on both platforms

Automated tests SHALL render every registered story in the light and dark schemes on the iOS and
Android platform branches under the suite-wide native mocks, without throwing and without React
errors logged.

#### Scenario: A fixture that crashes in dark mode fails CI

- **WHEN** a story throws while rendering with the dark scheme on Android
- **THEN** the registry test fails naming the story, scheme and platform

### Requirement: Every interactive element in a story is accessible

In every story, on both platform branches, every host element that accepts a press, a value
change or a selection SHALL expose an accessibility role and a non-empty accessibility label.
Text inputs SHALL expose a non-empty label. The check SHALL run in the same matrix as rendering
and SHALL NOT allow per-story exemptions.

#### Scenario: An unlabeled control fails CI

- **WHEN** a story renders a pressable element without an accessibility label
- **THEN** the registry test fails naming the story, platform and element

### Requirement: Fixtures cover named stress states

The native settings fixture SHALL be split into named stories covering every seam primitive (rows
of each kind, destructive action, switches, choices, header and alert, floating action, radio
dialog) and SHALL include at least one stress story that renders the longest French copy in row
labels, subtitles, values, hints and section footers. The native text-entry dialog fixture SHALL
include a disabled-submit story and a pending story.

#### Scenario: Stress states are deep-linkable

- **WHEN** a reviewer opens the long-strings stress story and the disabled text-entry story by
  deep link with the app in French at the largest accessibility text size
- **THEN** each renders as its own screen for the device check

### Requirement: Gallery strings are translated

Every gallery and fixture string (index title, fixture titles, story names, fixture copy) SHALL be
translated in French and English under the `gallery.*` namespace through the typed flat catalog,
with no literal-string lint exemption and no parity exemption.

#### Scenario: A missing French gallery key fails CI

- **WHEN** a `gallery.*` key exists in English but not in French
- **THEN** `npx tsc --noEmit` fails

### Requirement: The project carries no Storybook toolchain

`mobile/package.json` SHALL declare no `storybook`, `@storybook/*` or `react-native-web` package in
any dependency field, and no `.storybook` or `.rnstorybook` directory SHALL exist under `mobile/`.
Adopting Storybook SHALL require amending the gallery ADR first.

#### Scenario: Adding a Storybook package fails CI

- **WHEN** `@storybook/react-native` is added to `mobile/package.json`
- **THEN** the no-Storybook contract test fails
