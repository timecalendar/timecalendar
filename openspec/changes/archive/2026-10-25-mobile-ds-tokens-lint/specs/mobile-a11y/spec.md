# Spec Delta

## MODIFIED Requirements

### Requirement: Runtime accessibility posture recorded where lint cannot enforce it
The Architecture Book SHALL record, as prose, the accessibility concerns that cannot be encoded as a lint rule — touch-target minimums, meaningful-label review, manual screen-reader passes, reduced motion, and color contrast at the call site — each stating why it is not a lint rule and which step or artifact owns it. Font scaling SHALL be listed with the lint-enforced rules: disabling it is a lint error, and the Book SHALL record that `maxFontSizeMultiplier` caps are allowed and where the existing caps live.

#### Scenario: Book documents the non-encodable rules
- **WHEN** a developer reads the Architecture Book a11y section
- **THEN** it lists what the live lint rules enforce and where they bite, the heading-role component contract, and each non-encodable concern with its reason and owner

#### Scenario: Font scaling is not disabled
- **WHEN** a developer renders user-facing text with `allowFontScaling={false}`
- **THEN** lint fails, so text always scales with the OS font size
