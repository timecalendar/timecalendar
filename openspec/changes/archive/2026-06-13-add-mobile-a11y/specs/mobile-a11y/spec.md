## ADDED Requirements

### Requirement: Heading semantics encoded in the text component
The shared `ThemedText` component SHALL map its title-level variants (`type="title"` and `type="subtitle"`) to `accessibilityRole="header"`, so that titles are exposed to assistive technologies (VoiceOver/TalkBack) as headings without each call site declaring the role by hand. A caller-supplied `accessibilityRole` SHALL take precedence over the defaulted header role.

#### Scenario: Title renders as a heading
- **WHEN** a `ThemedText` with `type="title"` (or `type="subtitle"`) renders
- **THEN** its node exposes `accessibilityRole="header"` in the accessibility tree

#### Scenario: Non-title text is not a heading
- **WHEN** a `ThemedText` with the default `type` (or a body variant) renders
- **THEN** its node does not carry the header role

#### Scenario: Explicit role wins
- **WHEN** a `ThemedText` with `type="title"` is also given an explicit `accessibilityRole`
- **THEN** the caller-supplied role is used, not the defaulted header role

### Requirement: Skeleton screens expose meaningful semantics
Every surviving skeleton screen SHALL expose correct, meaningful accessibility semantics: screen titles SHALL be headings, and transient async states (loading, error) SHALL be conveyed to assistive technology as status rather than rendered as unlabeled text. No interactive control SHALL be introduced solely to exercise the lint rules.

#### Scenario: Schools screen title is a heading
- **WHEN** the schools screen renders its title
- **THEN** the title node carries the header role

#### Scenario: Async status is accessible
- **WHEN** the schools screen is in its loading or error state
- **THEN** the status text is readable by assistive technology as a status message, not a silent or unlabeled node

### Requirement: Accessibility lint rules remain enforced
The `react-native-a11y` rules (`has-accessibility-props`, `has-valid-accessibility-descriptors`, `has-valid-accessibility-role`, `no-nested-touchables`) SHALL remain active as errors, and the `i18next/no-literal-string` rule SHALL continue to cover `accessibilityLabel` and `accessibilityHint` so accessibility copy is translated. `npm run lint` SHALL pass with zero warnings. These rules are unexercised while the skeleton has no interactive control; the first interactive control SHALL be their first live test.

#### Scenario: A touchable without a11y props is rejected
- **WHEN** a developer adds a touchable/pressable with no accessibility role and no label+hint
- **THEN** the lint rule reports an error and CI fails

#### Scenario: Untranslated accessibility copy is rejected
- **WHEN** a developer passes a literal string to `accessibilityLabel` or `accessibilityHint` instead of a `t()` call
- **THEN** the `i18next/no-literal-string` rule reports an error

### Requirement: Accessibility wiring is verified by an automated test
The unit test suite SHALL include a test that renders a component through the real accessibility tree and asserts that an accessibility role/semantic resolves (not merely that a prop was passed), so the heading contract is proven in CI rather than only configured.

#### Scenario: Header role resolves in the rendered tree
- **WHEN** the a11y proof test renders a title-bearing component under the default locale
- **THEN** querying the accessibility tree by the `header` role finds the title node

### Requirement: Runtime accessibility posture recorded where lint cannot enforce it
The Architecture Book SHALL record, as prose, the accessibility concerns that cannot be encoded as a lint rule — Dynamic Type / font-scaling posture, touch-target minimums, meaningful-label review, manual screen-reader passes, reduced motion, and color contrast — each stating why it is not a lint rule and which step or artifact owns it.

#### Scenario: Book documents the non-encodable rules
- **WHEN** a developer reads the Architecture Book a11y section
- **THEN** it lists what the live lint rules enforce and where they bite, the heading-role component contract, and each non-encodable concern with its reason and owner

#### Scenario: Font scaling is not disabled
- **WHEN** a developer renders user-facing text
- **THEN** `allowFontScaling` is left at its default (text scales with the OS font size); disabling it is contrary to the recorded posture
