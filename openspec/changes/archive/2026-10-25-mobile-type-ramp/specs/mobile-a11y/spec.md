# Spec Delta

## MODIFIED Requirements

### Requirement: Heading semantics encoded in the text component
The shared `ThemedText` component SHALL map its heading ramp steps (`type="largeTitle"`, `type="title"`, `type="title2"` and `type="sectionTitle"`, plus the `subtitle` alias that resolves to `sectionTitle`) to `accessibilityRole="header"`, so that titles are exposed to assistive technologies (VoiceOver/TalkBack) as headings without each call site declaring the role by hand. Every other accepted `type` SHALL carry no header role. The role for each accepted `type` SHALL be declared in an exhaustive typed record, so a variant added without a role decision fails `tsc`. A caller-supplied `accessibilityRole` SHALL take precedence over the defaulted header role.

#### Scenario: Title renders as a heading
- **WHEN** a `ThemedText` with `type` set to `largeTitle`, `title`, `title2`, `sectionTitle` or `subtitle` renders
- **THEN** its node exposes `accessibilityRole="header"` in the accessibility tree

#### Scenario: Non-title text is not a heading
- **WHEN** a `ThemedText` with the default `type` or any of `headline`, `body`, `callout`, `label`, `footnote`, `caption`, `captionSmall`, `default`, `small`, `smallBold` renders
- **THEN** its node does not carry the header role

#### Scenario: Explicit role wins
- **WHEN** a `ThemedText` with a heading `type` is also given an explicit `accessibilityRole`
- **THEN** the caller-supplied role is used, not the defaulted header role

#### Scenario: A new variant needs a role decision
- **WHEN** a developer adds a member to the accepted `type` union without adding it to the heading-role record
- **THEN** `npx tsc --noEmit` fails
