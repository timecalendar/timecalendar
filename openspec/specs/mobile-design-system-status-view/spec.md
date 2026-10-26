# mobile-design-system-status-view Specification

## Purpose
One shared status contract for the React Native app: how every loading, empty and error state is
laid out, scrolls, scales with text and reaches screen readers, owned by the primitive rather than
by each screen.

## Requirements

### Requirement: Status states declare a kind and a presentation

The app SHALL provide one shared status view whose caller MUST choose a kind (`loading`, `empty`
or `error`) and a presentation (`screen`, `section` or `inline`) and MUST supply a localized
title. An empty or error state MAY carry a localized caption, a primary action and a secondary
action. An empty state MAY carry either decorative artwork or a status symbol, never both. A
loading state SHALL NOT accept a caption, an action, artwork or a symbol, and an error state SHALL
NOT accept artwork or a symbol; these SHALL be type errors. The caller SHALL be able to pass
layout-only style (margins, flex, alignment, width, position) and SHALL NOT be able to pass colors,
padding or typography.

#### Scenario: A loading state cannot carry a retry

- **WHEN** a caller renders a loading status with an action
- **THEN** `npx tsc --noEmit` fails

#### Scenario: An empty state cannot carry artwork and a symbol

- **WHEN** a caller renders an empty status with both artwork and a symbol
- **THEN** `npx tsc --noEmit` fails

### Requirement: Presentations own their layout and the screen presentation scrolls

The `screen` presentation SHALL fill its parent, center its content vertically and horizontally
while the content fits, and SHALL scroll from the top once the content is taller than the
viewport, so no content moves under the navigation header or below the reachable area at any text
size. The `section` presentation SHALL be a centered block with no scroll container of its own,
vertically centered within the height its parent gives it, for use inside a list's empty slot or
a page that already scrolls. The `inline` presentation SHALL be leading-aligned and content-sized.
Every presentation SHALL keep media → title → caption → actions source and reading order, use
theme tokens only, wrap all text without a font-scale cap, and add no animation.

#### Scenario: A full-screen state at the largest text size

- **WHEN** a `screen` empty state with artwork, a long French title, caption and two actions renders at iOS `accessibility-extra-extra-extra-large` or Android font scale 2.0
- **THEN** the content starts below the header and the user can scroll to the last action
- **AND** no text clips

#### Scenario: A section state inside a list

- **WHEN** a list's empty slot renders a `section` status
- **THEN** no second vertical scroll container is mounted inside the list

#### Scenario: An inline state follows section alignment

- **WHEN** a content section renders an `inline` empty status
- **THEN** its title and caption are leading-aligned and the state is content-sized

### Requirement: Status media follows one rule per kind

A loading state SHALL show one indeterminate progress indicator in the secondary text color,
hidden from assistive technology. An error state SHALL show the fixed error glyph in the error
color. An empty state SHALL show its artwork or symbol when given. Symbols and the error glyph
SHALL keep their design size at every font scale and SHALL be hidden from assistive technology.
Artwork SHALL be decorative, SHALL follow the active color scheme, and SHALL NOT render when the
text size is at or above the accessibility text-size threshold, following a live text-size change.

#### Scenario: Artwork leaves at accessibility sizes

- **WHEN** an empty state with artwork renders at a font scale at or above the accessibility threshold
- **THEN** the artwork is not rendered and the title is the first content

#### Scenario: Artwork returns below the threshold

- **WHEN** the font scale drops below the accessibility threshold while the state is shown
- **THEN** the artwork renders again

#### Scenario: The spinner is not a focus stop

- **WHEN** a screen reader moves through a loading state
- **THEN** the progress indicator is not a separate element

### Requirement: Status states expose roles and busy state

An empty or error state's title SHALL be exposed as a heading and its caption as text, each a
separate accessibility element in title-then-caption order. A loading state SHALL be one
accessibility element with the progress-bar role, its title as the accessible name and a busy
state, and its title SHALL NOT be a heading. Actions SHALL be the shared button: the primary
action filled, the secondary a text button, stacked primary first, each with its own role, label,
optional hint, and disabled/busy state; a busy action SHALL keep its label and block activation.

#### Scenario: An error title is a heading

- **WHEN** an error state renders on iOS or Android
- **THEN** its title has the header role and its caption is a separate text element

#### Scenario: Loading exposes busy

- **WHEN** a loading state renders
- **THEN** one element carries the progress-bar role, the title as its name and `busy: true`

#### Scenario: Retry is a real button

- **WHEN** the user activates an error state's retry action
- **THEN** its handler runs once
- **AND** while the caller marks it busy, the action exposes `{ disabled: true, busy: true }` and does not run again

### Requirement: Status states are announced once when they appear

A status state SHALL be announced to the screen reader when it mounts: its title for loading, its
title and caption for empty and error. On iOS the announcement SHALL be queued through the
platform announcer; on Android the state's root SHALL carry a polite live region and the
primitive SHALL NOT issue a second explicit announcement. A caller MAY pass an announcement key;
the state SHALL be announced again when that key changes and SHALL NOT be announced again when
only its text changes under the same key (for example a no-results title that embeds the query).

#### Scenario: An error is announced on appearance

- **WHEN** an error state mounts on iOS
- **THEN** the platform announcer is called once with the title and caption

#### Scenario: Typing does not re-announce no-results

- **WHEN** a no-results state stays mounted with the same announcement key while its title changes with the query
- **THEN** no further iOS announcement is made

#### Scenario: A new kind is announced

- **WHEN** the announcement key changes from `loading` to `empty`
- **THEN** the new state is announced once

#### Scenario: Android relies on the live region

- **WHEN** a status state renders on Android
- **THEN** its root carries a polite live region and no explicit announcement is made

### Requirement: The status view ships with gallery stories and a coverage tier

The gallery SHALL list a status-view fixture with a story for each kind in each presentation that
the app uses, a busy retry, and the shared longest-French-string stress copy with artwork and both
actions; that story SHALL state whether artwork is currently shown. Every story SHALL render in
light and dark on both platforms with a role and a label on every action. The status view and the
field-error hint helper SHALL each meet a 90% lines and branches per-file coverage threshold.

#### Scenario: The stress story at accessibility size

- **WHEN** a reviewer opens `status-view--long-strings` at the largest text size
- **THEN** the story scrolls, shows no artwork, and its caption says artwork is hidden

#### Scenario: Coverage falls below the tier

- **WHEN** a change leaves a branch of the status view untested so that its branch coverage falls below 90%
- **THEN** `npm test -- --coverage` fails
