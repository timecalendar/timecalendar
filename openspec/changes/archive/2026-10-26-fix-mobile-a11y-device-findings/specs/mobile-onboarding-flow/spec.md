## ADDED Requirements

### Requirement: Welcome pages never clip their copy

Each onboarding welcome page SHALL let its content size itself: the content SHALL be centered when it fits the page and SHALL scroll vertically when it does not, without blocking horizontal paging. At accessibility text sizes the decorative illustration SHALL take half its default height. Page titles SHALL cap their font scale with the shared brand-text cap, so the brand word never breaks off a character.

#### Scenario: Copy taller than the page scrolls

- **WHEN** a welcome page renders at iOS AX5
- **THEN** its title and body are inside a vertical scroll container and no text is clipped by the page height

#### Scenario: The illustration yields at accessibility sizes

- **WHEN** the welcome screen renders at an accessibility text size
- **THEN** each page's illustration height is half the height it has at the default text size

#### Scenario: Titles cap their scale

- **WHEN** any welcome page title renders
- **THEN** its font scale multiplier is capped by the shared brand-text cap
