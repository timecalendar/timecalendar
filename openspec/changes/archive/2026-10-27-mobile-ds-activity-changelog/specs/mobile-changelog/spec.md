## MODIFIED Requirements

### Requirement: History and sheet share one native content presentation

The app SHALL expose `/changelog` as a regular pushed root Stack screen that shows all
bundled releases and `/changelog-sheet` as a root modal with a visible native header. The
sheet SHALL use an iOS form-sheet presentation with a large scrollable detent/grabber and an
Android full-screen native modal presentation. Both surfaces SHALL compose the same content
component in a measured readable lane, themed and safe-area-aware.

The content SHALL render each release as a titled list section whose title is the localized
"Version {label}" heading, exposed as a heading, with the selector
`changelog-release-<version>`. Each release item SHALL be a static list row with the item's
platform icon as its leading icon, the item title as its label and the item description as its
subtitle, with the selector `changelog-release-<version>-item-<index>`. Rows SHALL use the shared
list row's platform look (iOS inset-grouped rows with an icon tile, Android Material segments with
a flat icon) and SHALL wrap at every text size. Leading icons SHALL be hidden from assistive
technology, and each row SHALL be read as one element, title then description. The content SHALL
NOT draw cards, fixed row heights or text-weight overrides of its own.

The sheet's close action SHALL be a native header action labelled "Close" / "Fermer" with its
hint and the selector `changelog-close`: a navigation-bar button on iOS and a Material text
action in the top app bar on Android.

#### Scenario: History shows every release

- **WHEN** a user opens `/changelog` from About
- **THEN** the regular pushed screen shows every bundled version newest-first
- **AND** native back navigation returns to About

#### Scenario: Sheet follows each platform idiom

- **WHEN** `/changelog-sheet` is presented on iOS or Android
- **THEN** iOS uses the configured form sheet and Android uses the configured full-screen
  modal form
- **AND** both have a visible localized native header and scrollable shared content

#### Scenario: Releases are list sections of static rows

- **WHEN** the history renders version 4.0 in English
- **THEN** "Version 4.0" is a heading over three static rows, "A fresh new design", "A faster
  calendar" and "A truly native feel", each with its description as a subtitle and its icon
  as the leading icon
- **AND** no row is activatable

#### Scenario: Close is a native header action

- **WHEN** the sheet renders on iOS and then on Android
- **THEN** iOS exposes a right bar item labelled "Close" with its hint, and Android exposes a
  right top-app-bar text action named "Close" with its hint and `changelog-close`
- **AND** activating either acknowledges the version before dismissing

#### Scenario: Content is accessible at large text

- **WHEN** a screen reader or large accessibility text size is active
- **THEN** version headings are exposed as headings, each item is read in logical order,
  decorative symbols are not separate focus targets, and text/controls remain operable
