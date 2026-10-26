# Spec Delta

## MODIFIED Requirements

### Requirement: Stories have stable ids and deep links

A story's id SHALL be `<meta id>--<kebab-case export name>` (for example
`native-settings--switches`), independent of its translated name, so renaming copy never breaks a
link. Each story SHALL be reachable at `/developer/gallery/<story id>`, including as a cold deep
link (`timecalendar-dev://developer/gallery/<story id>` on development builds). An id that matches
no registered story SHALL redirect to the gallery index. A story opened without the gallery index
directly beneath it, by a cold or a warm deep link, SHALL place the index beneath itself without
a visible transition, so Back from the story returns to the gallery index and Back from the index
returns to where the app was.

#### Scenario: A deep link opens one story

- **WHEN** a development build opens `timecalendar-dev://developer/gallery/native-settings--switches`
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

### Requirement: Fixtures cover named stress states

The native settings fixture SHALL be split into named stories covering every seam primitive (rows
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

- **WHEN** a reviewer opens `native-settings-numeric-editor--validation-error`
- **THEN** the native editor shows its validation message, and Cancel closes it and a row behind
  it reopens it

## ADDED Requirements

### Requirement: The gallery documents the type ramp and the token layer

The gallery SHALL hold a typography fixture that renders every type-ramp step under its name, in
display order, with its size and line height, and every text tone; heading steps SHALL keep their
heading role. It SHALL hold a token fixture that renders every color role with its light and its
dark value side by side regardless of the app's scheme, every documented contrast pair in each
scheme with its computed ratio and its floor, and the spacing, radius, icon-size and elevation
scales. The contrast pairs SHALL come from the same table the contrast gate checks, so the page
cannot list a pair the gate does not.

#### Scenario: A new color role appears on the swatch page

- **WHEN** a role is added to the light and dark color tokens
- **THEN** the color story lists it with both values without a fixture change

#### Scenario: A documented pair appears on the swatch page

- **WHEN** a pair is added to the documented contrast table
- **THEN** the contrast gate checks it and the contrast-pairs story lists it with its ratio

### Requirement: Every design-layer primitive ships with a fixture and a test

Every component module under `mobile/src/design/` SHALL have a sibling `*.gallery.tsx` fixture and
a sibling `*.test.tsx`, except the gallery infrastructure modules named in an explicit helper list.
The check SHALL fail naming the module that lacks either file, and SHALL fail when a helper-list
entry no longer exists.

#### Scenario: A primitive without a fixture fails CI

- **WHEN** a component module is added under `src/design/` with a test but no `*.gallery.tsx`
- **THEN** the fixture-coverage contract test fails naming the module

#### Scenario: A stale helper entry fails CI

- **WHEN** a helper-list entry names a file that no longer exists under `src/design/`
- **THEN** the fixture-coverage contract test fails naming the entry
