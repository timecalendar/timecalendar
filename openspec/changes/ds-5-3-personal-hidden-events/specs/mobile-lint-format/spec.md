## ADDED Requirements

### Requirement: Hand-built radio groups are a lint error

Lint SHALL report an error, in feature and route source files and outside tests, for a JSX
`accessibilityRole` or `role` attribute whose value is the literal `"radiogroup"` or `"radio"`, or
a conditional expression either branch of which is one of these literals. The message SHALL point
to the design-system color swatch field and to the native list's choice rows. The design layer
and the native-chrome seam SHALL NOT be checked. The rule SHALL have no allowlist, because no
feature or route file violates it.

#### Scenario: A feature hand-builds a radio group

- **WHEN** a feature file renders `<View accessibilityRole="radiogroup">`
- **THEN** `npm run lint` fails with a message that names the color swatch field

#### Scenario: A platform-conditional radio role is seen

- **WHEN** a feature file sets `accessibilityRole={isAndroid ? "radio" : "button"}`
- **THEN** `npm run lint` fails for that attribute

#### Scenario: The design layer may declare radios

- **WHEN** `src/design/field/color-swatch-field.tsx` declares the `radiogroup` and `radio` roles
- **THEN** the rule reports nothing for it
