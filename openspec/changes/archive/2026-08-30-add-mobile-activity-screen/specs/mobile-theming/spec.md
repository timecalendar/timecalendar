# mobile-theming — delta

## ADDED Requirements

### Requirement: The theme layer defines semantic status color tokens

The theme layer SHALL define semantic status tokens for a positive state and an informational state alongside the existing destructive token, in both the light and the dark scheme, so a feature expressing "added", "modified", or "removed" draws from the shared palette instead of a locally defined color.

Each token SHALL be defined for light and dark together; a light-only status token is incomplete. Each SHALL be documented in the theme layer's contrast block with its computed ratio against the surfaces it is drawn on, and each SHALL meet the WCAG AA body-text threshold on those surfaces so the token may carry text and not only tint an icon.

Status tokens SHALL NOT be used as generic accents, and event or calendar colors SHALL NOT be used as status colors: an arbitrary event green is not a success state.

A consumer SHALL NOT rely on a status token as the only carrier of meaning; the distinction it expresses SHALL also be available as text.

Background or surface variants of these tokens SHALL NOT be added until a consumer fills a surface with one.

#### Scenario: A status token is defined and documented for both schemes

- **WHEN** the theme tokens are inspected
- **THEN** the positive and informational tokens each have a light and a dark value
- **AND** each has a documented contrast ratio against the surfaces it is drawn on, meeting WCAG AA for body text

#### Scenario: Status meaning survives without color

- **WHEN** a feature distinguishes states using the status tokens
- **THEN** the same distinction is also expressed as translated text
