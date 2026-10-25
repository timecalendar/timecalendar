## ADDED Requirements

### Requirement: The event color dot aligns to the first title line

The event details color dot SHALL be vertically centered on the first line of the event title at every text size on both platforms, including when the title wraps to several lines. The dot SHALL be decorative and hidden from assistive technology.

#### Scenario: A multi-line title at a large text size

- **WHEN** event details render a three-line title at Android font scale 2.0
- **THEN** the dot is aligned with the first line of the title, not the center of the three lines

#### Scenario: The dot is decorative

- **WHEN** event details render
- **THEN** the color dot is not an accessibility element and carries no accessible label
