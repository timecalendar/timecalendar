## ADDED Requirements

### Requirement: The tablet route matrix records the integrated shipped disposition

The tablet quick-wins matrix SHALL retain one row for every audited React Native route or surface and SHALL describe the behavior delivered by the tablet workstreams or an explicit no-change disposition. Each row SHALL name its semantic width rule and focused verification evidence. The final reconciliation SHALL NOT introduce landscape, multitasking, tablet-only navigation, native configuration, dependency, generated-client, migration, or legacy Flutter changes.

#### Scenario: A completed tablet workstream is reconciled

- **WHEN** a route owned by a completed tablet workstream is reviewed in the final matrix
- **THEN** the row describes its shipped measured-lane or full-bleed composition
- **AND** the row identifies the focused phone/tablet regression that protects preserved behavior
- **AND** the row contains no future-tense implementation or verification commitment for work that already shipped

#### Scenario: Device evidence is unavailable on the execution host

- **WHEN** the final pass cannot run a simulator, emulator, or physical device locally
- **THEN** the evidence records that limitation without claiming device execution
- **AND** available static, component, integration, and CI evidence remains explicit

### Requirement: Activity actionable rows prove resolved details navigation

The shared Activity Maestro journey SHALL activate seeded new and changed rows with a retry limited to taps that produce no hierarchy change. After each activation, the journey SHALL observe a selector that mounts only for resolved event details before asserting seeded details content. Static regression coverage SHALL lock this row-to-details ordering for both actionable fixture kinds.

#### Scenario: A changed row ignores the first iOS tap

- **WHEN** the changed Activity row is visible after scrolling and its first tap produces no hierarchy change
- **THEN** the flow retries the activation
- **AND** it waits for the resolved event-details owner
- **AND** it then confirms the changed event's seeded details content

#### Scenario: An actionable row navigates on the first tap

- **WHEN** a new or changed Activity row transitions to event details on its first activation
- **THEN** the no-change retry does not cause an unconditional second activation
- **AND** the resolved details owner proves the route before content assertions run

#### Scenario: Activity list content cannot satisfy the destination oracle

- **WHEN** the app remains on the Activity list after activating an actionable row
- **THEN** list-rendered title, time, or location text does not satisfy the navigation proof
- **AND** the flow fails because the resolved event-details owner never appears

#### Scenario: A newly held calendar expands a completed Activity chain

- **WHEN** the Activity journey imports a second calendar after the baseline calendar completed its one-row pagination chain
- **THEN** the application process remains alive while ownership reconciliation observes the addition
- **AND** the stale completed-chain state is reopened through the production ownership path
- **AND** the later page-two traversal proves both boundary fixtures are available

### Requirement: A delayed iOS deep-link confirmation does not mask route regression

The About native flow SHALL allow the iOS custom-scheme confirmation transition to settle between its initial optional activation and its optional replay activation. The flow SHALL remain shared with Android and SHALL retain the About route and content assertions after the system prompt is dismissed.

#### Scenario: The system confirmation reappears after its first dismissal

- **WHEN** iOS dismisses the first custom-scheme confirmation and re-presents it after the hierarchy transition
- **THEN** the flow waits for the transition to settle before evaluating its replay tap
- **AND** the replay tap dismisses the returned prompt
- **AND** the About content assertions execute inside the app rather than against SpringBoard

#### Scenario: An acknowledged About link leaves SpringBoard foregrounded

- **WHEN** iOS completes both optional confirmation activations but the stable About destination remains absent
- **THEN** the flow reissues that same About link once
- **AND** it handles the optional confirmation again
- **AND** it observes the About responsive-content owner before checking route content
- **AND** it does not replay the link after the About destination is already visible

#### Scenario: An acknowledged onboarding link leaves SpringBoard foregrounded

- **WHEN** iOS reports the iCal journey's onboarding link complete but the stable Welcome destination remains absent after the transition settles
- **THEN** the flow reissues that same onboarding link once
- **AND** it handles the optional confirmation again
- **AND** it does not replay the link after Welcome is already visible

### Requirement: Exact-head native health can finish the integrated journey

The Android iCal journey SHALL dismiss the optional AOSP keyboard contacts dialog after the first institution Continue action can trigger it and before retrying that application action. The iOS native health job SHALL provide a 120-minute execution budget for the complete shared flow set, and the workflow contract SHALL reject a smaller budget.

#### Scenario: The clean Android keyboard prompts on the first Continue action

- **WHEN** the institution name is complete and the first Continue tap triggers the AOSP keyboard contacts dialog
- **THEN** the Android-only dismissal targets the negative system action
- **AND** the existing optional Continue retry runs after that dismissal
- **AND** the journey reaches the programme input without granting contacts access

#### Scenario: The iOS flow set outlives its former job ceiling

- **WHEN** a cold iOS build and the complete shared Maestro suite require more than 75 minutes
- **THEN** the native health job remains active for up to 120 minutes
- **AND** a workflow-contract regression fails if that budget is reduced

#### Scenario: The Android programme action is obscured by the focused keyboard

- **WHEN** the exact programme value and the Continue accessibility element are visible
- **THEN** the flow activates the field's native Return action instead of tapping an obscured coordinate
- **AND** the journey reaches the connection step through the production submit handler

#### Scenario: SwiftUI omits requested rename resource identifiers

- **WHEN** the iOS hierarchy exposes the rename field and Save action only by their unique semantic labels
- **THEN** the flow interacts through those labels
- **AND** Android continues to use the Compose resource IDs
- **AND** both platforms exact-gate the entered value before saving
