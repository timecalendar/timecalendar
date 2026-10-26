# Spec Delta

## MODIFIED Requirements

### Requirement: Stories have stable ids and deep links

A story's id SHALL be `<meta id>--<kebab-case export name>` (for example
`native-list--switches`), independent of its translated name, so renaming copy never breaks a
link. A meta id SHALL name the component it documents, so renaming the component renames its
story ids. Each story SHALL be reachable at `/developer/gallery/<story id>`, including as a cold deep
link (`timecalendar-dev://developer/gallery/<story id>` on development builds). An id that matches
no registered story SHALL redirect to the gallery index. A story opened without the gallery index
directly beneath it, by a cold or a warm deep link, SHALL place the index beneath itself without
a visible transition, so Back from the story returns to the gallery index and Back from the index
returns to where the app was.

#### Scenario: A deep link opens one story

- **WHEN** a development build opens `timecalendar-dev://developer/gallery/native-list--switches`
- **THEN** the switches story renders as the screen under a native header titled with its
  translated name

#### Scenario: An unknown story id falls back to the index

- **WHEN** `/developer/gallery/does-not-exist` is opened
- **THEN** the app redirects to `/developer/gallery`

#### Scenario: Back from a deep-linked story returns to the index

- **WHEN** a story is opened by deep link while the app shows a tab, and the user goes Back
- **THEN** the gallery index is shown, and a second Back returns to that tab

#### Scenario: A story opened from the index keeps one index beneath it

- **WHEN** the user opens a story from the gallery index and goes Back
- **THEN** the same index screen is shown and no second index entry exists in the stack

### Requirement: The gallery index lists every story in native grouped sections

`/developer/gallery` SHALL render, under the compact native header with a localized title, one
native list section per registered fixture module (titled with the fixture's translated
title, in registry order) and one navigation row per story available on the running platform
(labeled with the story's translated name and a localized hint, in the order the meta's `stories`
array declares) that opens the story route. Explicit order keeps related states together
(`Rows`, `Destructive`, `Switches`, `Choices` first) where alphabetical export order would scatter
them, and module namespaces expose no source order. Rows SHALL follow the native list row
contract (one focus stop, link/button role, disclosure, decorative icons hidden).

#### Scenario: A platform-scoped story is offered only on its platform

- **WHEN** the index renders on iOS
- **THEN** the Android-only `native-list--floating-action` and `native-list--radio-dialog`
  rows are absent, and opening either story id redirects to `/developer/gallery`

#### Scenario: Activating a story row opens it

- **WHEN** the user activates the index row for `native-list--switches`
- **THEN** the app pushes `/developer/gallery/native-list--switches`

### Requirement: Fixtures cover named stress states

The native list fixture SHALL be split into named stories covering every seam primitive (rows
of each kind, destructive action, switches, choices, header and alert, floating action, radio
dialog) and SHALL include at least one stress story that renders the longest French copy in row
labels, subtitles, values, hints and section footers. The native text-entry dialog fixture SHALL
include a disabled-submit story and a pending story. Every dialog story SHALL leave a way out:
Cancel, hardware Back and Save close the dialog, and a row behind it reopens it. The pending story
SHALL release its lock after a few seconds so Cancel and the iOS swipe-dismiss work.

The gallery SHALL also hold one fixture for each shared primitive in use: the root page with its
intro, the empty state, the error surfaces (full-page error, inline notice, text action, field
error), the primary action, the keyboard-safe action layout, the native numeric editor, the glass
surface, the native menu and the native date/time picker. Each SHALL have a default story and a
stress story with the longest French copy wherever the component shows app copy, and a story per
state the component exposes (disabled, busy, validation error, empty versus illustrated, section
versus screen). A state that only one platform renders SHALL be declared for that platform only.

#### Scenario: A dialog story can be dismissed and reopened

- **WHEN** the user cancels the text-entry dialog in a story
- **THEN** the dialog closes and the "open the dialog" row reopens it

#### Scenario: Stress states are deep-linkable

- **WHEN** a reviewer opens the long-strings stress story and the disabled text-entry story by
  deep link with the app in French at the largest accessibility text size
- **THEN** each renders as its own screen for the device check

#### Scenario: Disabled and busy actions are reviewable

- **WHEN** a reviewer opens `primary-action--disabled` and `primary-action--busy`
- **THEN** each renders the action in that state, announced as disabled or busy, and activating it
  does nothing

#### Scenario: The numeric editor validation state is reviewable

- **WHEN** a reviewer opens `native-list-numeric-editor--validation-error`
- **THEN** the native editor shows its validation message, and Cancel closes it and a row behind
  it reopens it
