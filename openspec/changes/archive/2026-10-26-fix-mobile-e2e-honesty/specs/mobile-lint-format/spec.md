## MODIFIED Requirements

### Requirement: The device-zone-dependent offset function is a lint error

Lint SHALL report an error for every way a file under `mobile/src/` can reach `getTimezoneOffset` from `date-fns-tz`: a named or aliased import, a namespace import, a default import, a named or namespace re-export, and a dynamic `import()` of the module. That function reads a `Date`'s device-local fields as the zone's wall clock, so its result depends on the device zone. The message SHALL point to the app's instant-based zone-offset helper. Named imports of other `date-fns-tz` helpers and the device `Date`'s own offset method SHALL stay allowed. A test SHALL lint each form through the project's real lint configuration.

#### Scenario: A module imports getTimezoneOffset

- **WHEN** a file under `src/` imports `getTimezoneOffset` from `date-fns-tz`, under its own name or an alias
- **THEN** `npm run lint` fails with a message that names the instant-based offset helper

#### Scenario: A module reaches getTimezoneOffset through a namespace import

- **WHEN** a file under `src/` writes `import * as tz from "date-fns-tz"` and calls `tz.getTimezoneOffset(...)`
- **THEN** `npm run lint` fails on the import

#### Scenario: A module reaches date-fns-tz through a default import, a re-export or a dynamic import

- **WHEN** a file under `src/` default-imports `date-fns-tz`, re-exports `getTimezoneOffset` or the module namespace from it, or calls `import("date-fns-tz")`
- **THEN** `npm run lint` fails

#### Scenario: Other date-fns-tz helpers stay importable

- **WHEN** a file imports `formatInTimeZone`, `toZonedTime`, or `fromZonedTime` from `date-fns-tz`, or calls a `Date`'s own `getTimezoneOffset()`
- **THEN** lint reports no error for that code

## ADDED Requirements

### Requirement: SwiftUI container nodes carry no accessibility identifier

Lint SHALL report an error when a file under `mobile/src/` sets an accessibility identifier on an `@expo/ui/swift-ui` container node, whether through its `testID` prop or an `accessibilityIdentifier` modifier, however the component and the modifier are imported or aliased. Container nodes are the layout and grouping views that are not accessibility elements themselves: `BottomSheet`, `ControlGroup`, `DisclosureGroup`, `Form`, `GlassEffectContainer`, `Grid`, `Group`, `HStack`, `LazyHStack`, `LazyVStack`, `List`, `Mask`, `Namespace`, `Overlay`, `ScrollView`, `Section`, `TabView`, `VStack` and `ZStack`. The SwiftUI `Host` SHALL NOT carry an `accessibilityIdentifier` modifier; its `testID` stays allowed because it identifies the UIKit hosting view. Identifiers on leaf elements and controls SHALL stay allowed. The Jest SwiftUI mock SHALL fail a render that passes an identifier to a container node, so a spread prop that lint cannot see still fails a test.

#### Scenario: A Section receives an identifier modifier

- **WHEN** a chrome file renders `<Section modifiers={[accessibilityIdentifier("x")]}>`, under any import alias
- **THEN** `npm run lint` fails with a message that explains the identifier cascades onto the children

#### Scenario: A VStack receives a testID

- **WHEN** a chrome file renders an `@expo/ui/swift-ui` `VStack` with a `testID` prop
- **THEN** `npm run lint` fails

#### Scenario: A conditional modifier spread hides the identifier

- **WHEN** a container's modifiers array spreads a conditional or a local constant that contains an `accessibilityIdentifier` call
- **THEN** `npm run lint` fails

#### Scenario: Leaves and the Host testID stay allowed

- **WHEN** a `Button`, `Text`, `TextField`, `Toggle`, `LabeledContent` or `ProgressView` carries an identifier, or a `Host` carries a `testID`
- **THEN** lint reports no error

#### Scenario: A spread prop reaches a container under Jest

- **WHEN** a component under test passes an identifier to a SwiftUI container through a spread the lint rule cannot follow
- **THEN** the render throws in the test and names the container
