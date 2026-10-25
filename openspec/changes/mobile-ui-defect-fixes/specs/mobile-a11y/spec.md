## ADDED Requirements

### Requirement: Small brand-colored text meets the AA body-text contrast floor

Text labels rendered below the WCAG large-text size in the brand color SHALL use the `actionText` tone, which meets the 4.5:1 body-text floor against the page background in both schemes. The bright `primary` identity tone (4.35:1 on white in light mode) SHALL NOT color small text. Large glyphs, fills, and non-text UI may keep `primary`, which meets the 3:1 floor.

#### Scenario: Small brand text action uses actionText

- **WHEN** a small bold brand-colored text action (onboarding Skip and Next, onboarding Connect Back, Home upcoming "See all", hidden-events Unhide, event-checklist Add, export-guide page visible Back) renders in light mode
- **THEN** its text color is the light `actionText` value, not the light `primary` value

#### Scenario: Dark mode is unchanged

- **WHEN** the same labels render in dark mode
- **THEN** their text color is the dark `actionText` value, which equals the dark brand tone already in use

#### Scenario: Large brand glyphs are out of the rule

- **WHEN** the school logo monogram fallback renders its large letter
- **THEN** it may keep the `primary` tone
