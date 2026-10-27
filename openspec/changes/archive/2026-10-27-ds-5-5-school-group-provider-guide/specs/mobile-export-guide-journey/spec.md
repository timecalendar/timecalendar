## MODIFIED Requirements

### Requirement: Guide content is inert, accessible, localized, and theme-safe
Provider/page copy SHALL render as plain React Native text and validated images only, never parsed
markup, links, executable components, or browser content. A failed thumbnail/page image SHALL
degrade to a stable text-only placeholder while preserving completion. Client-owned shell text
SHALL have typed FR/EN parity. Screens SHALL use native Stack chrome, existing theme tokens,
readable safe layout, scalable text, reduced-motion behavior, 44pt iOS/48dp Android targets, and a
screen-reader order of the native header (whose title is the page title), the focused progress
caption whose accessible name is the page title followed by the localized progress, description,
one image or placeholder meaning with caption, then Next.

#### Scenario: Markup-shaped server strings stay inert
- **WHEN** labels, titles, descriptions, alt text, or captions contain HTML/Markdown-shaped text
- **THEN** the literal text is rendered without a link, parser, WebView, or executable element

#### Scenario: Image failure keeps the guide usable
- **WHEN** a validated image fails native loading or decoding
- **THEN** a text-only placeholder exposes the same alternative meaning once and any caption stays
  visible without duplicate announcement
- **AND** Next remains available

#### Scenario: Accessibility shell remains operable
- **WHEN** a page opens in FR or EN, light or dark mode, largest supported text, or reduced motion
- **THEN** its progress caption receives focus once, announcing the page title and the localized
  page progress, and traversal follows the specified order
- **AND** content remains readable and every action meets its platform target minimum

## ADDED Requirements

### Requirement: Guide routes are named by the native title only
The provider-selection route SHALL be named by its native title and SHALL show only its caption in
content, with no in-content heading. While a valid guide page renders, the native title SHALL be
that page's title and the content SHALL contain no heading; while the guide loads or is blocked,
the native title SHALL be the localized guide title. The blocked state SHALL be the shared status
view with a single-flight Retry and Back.

#### Scenario: Provider selection has no in-content heading
- **WHEN** provider selection renders its providers
- **THEN** the native title is the localized "Export guide" title
- **AND** the content exposes no heading before the caption and rows

#### Scenario: A guide page titles the header
- **WHEN** page 2 of a pinned snapshot renders
- **THEN** the native title is page 2's title
- **AND** the page title is not rendered again as content text

#### Scenario: Loading and blocked keep the generic title
- **WHEN** the guide is resolving or blocked
- **THEN** the native title is the localized guide title
- **AND** the blocked state shows the status view with Retry (`export-guide-retry`) and Back
