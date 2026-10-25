## ADDED Requirements

### Requirement: Every allowed environment choice and a cancel path are reachable on both platforms

The Settings environment selector SHALL present every environment allowed by the build capability plus a cancel path on both platforms. It SHALL NOT use a presentation that silently drops choices (the Android native alert keeps at most three buttons). On Android the selector SHALL be a native Material single-choice dialog that marks the effective environment and offers Cancel; on iOS it SHALL remain a native alert listing every choice and Cancel. Selecting a choice SHALL keep the existing behavior: the current environment is a no-op, switching is single-flight, and any other choice requires the explicit destructive confirmation before any reset runs.

#### Scenario: Development capability on Android offers all three environments and Cancel

- **WHEN** a development build on Android opens the environment selector
- **THEN** Local, Preproduction, and Production are all selectable and the current environment is marked
- **AND** a Cancel action dismisses the selector with no confirmation and no reset

#### Scenario: Choosing another environment still requires confirmation

- **WHEN** the user selects an environment other than the current one on either platform
- **THEN** the destructive confirmation is presented and no reset runs until it is confirmed

#### Scenario: Choosing the current environment is inert

- **WHEN** the user selects the current environment
- **THEN** no confirmation is presented and no reset runs

#### Scenario: Production builds stay unchanged

- **WHEN** the build capability is production
- **THEN** no environment selector renders on either platform
