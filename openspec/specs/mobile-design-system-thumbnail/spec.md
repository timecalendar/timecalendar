# mobile-design-system-thumbnail Specification

## Purpose
A design-system thumbnail shows a remote first-party image, such as a school logo or a provider
screenshot, at a fixed list-leading size, follows the color scheme, and falls back to a monogram.

## Requirements

### Requirement: A thumbnail shows a scheme-aware remote image at a fixed size

The design layer SHALL provide one thumbnail primitive with a medium and a large token size. It
SHALL take a light image URL and an optional dark URL, and SHALL show the dark URL in the dark
scheme when present and the light URL otherwise. The image SHALL fill a rounded chip on the logo
surface color, with a separator-colored hairline ring drawn above the image, and SHALL keep its size
at every OS text size.

#### Scenario: Dark scheme uses the dark artwork

- **WHEN** a thumbnail with a light and a dark URL renders in the dark scheme
- **THEN** the image loads the dark URL

#### Scenario: Missing dark artwork falls back

- **WHEN** a thumbnail with only a light URL renders in the dark scheme
- **THEN** the image loads the light URL

#### Scenario: Size is fixed

- **WHEN** a thumbnail renders at the largest accessibility text size
- **THEN** its width and height equal its size token

### Requirement: A thumbnail falls back to a monogram and recovers on a new source

When no URL is available or the image fails to load, a thumbnail given a monogram SHALL show the
monogram letter on the brand wash in the documented accessible wash label color, and SHALL notify
the caller of the failure. A failure SHALL apply only to the URL that failed: when the resolved URL
changes (new source or scheme switch), the thumbnail SHALL try the new URL.

#### Scenario: No URL shows the monogram

- **WHEN** a thumbnail with a monogram has no URL
- **THEN** it shows the monogram and no image

#### Scenario: A failed image shows the monogram and reports it

- **WHEN** the image fails to load
- **THEN** the monogram replaces it
- **AND** the caller's failure callback runs once

#### Scenario: A scheme switch retries

- **WHEN** the light image failed and the scheme switches to dark with a dark URL present
- **THEN** the thumbnail shows the dark image again

### Requirement: A thumbnail is decorative

A thumbnail SHALL be hidden from assistive technology; the row or control that contains it SHALL
own the accessible name.

#### Scenario: Screen readers skip the thumbnail

- **WHEN** a list row leads with a thumbnail
- **THEN** assistive technology reaches only the row's name, not the image or the monogram

### Requirement: The thumbnail has gallery fixtures

The thumbnail SHALL have gallery fixtures for the image, the dark-scheme image, the monogram
fallback and both sizes, rendered in both schemes.

#### Scenario: Fixtures render

- **WHEN** the gallery test renders each thumbnail fixture
- **THEN** every fixture renders without error in light and dark
