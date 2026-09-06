## ADDED Requirements

### Requirement: Retry-classifier harness isolates distinguishable structural branches

The deterministic Maestro shell harness SHALL protect assertion-family recognition, `runFlowCommand` startup-phase membership, `openLinkCommand` restart-boundary membership, and the explicit empty-command-list branch with independent minimal fixtures. Each fixture SHALL be retryable under the production classifier, SHALL become terminal under its named mutation, and SHALL remain retryable under each of the other three listed mutations.

#### Scenario: Non-evaluated assertion recognition is protected

- **WHEN** the final same-depth restart epoch contains `assertConditionCommand` at `PENDING` followed by a non-boundary startup command other than `runFlowCommand`
- **THEN** the unmodified classifier SHALL treat the record as retryable
- **AND** only forcing assertion-family recognition to return false among the four listed mutations SHALL make the record terminal

#### Scenario: Run-flow startup membership is protected

- **WHEN** a startup-only record with no evaluated assertion ends in `runFlowCommand`
- **THEN** the unmodified classifier SHALL treat the record as retryable
- **AND** only removing `runFlowCommand` from the startup-phase command set among the four listed mutations SHALL make the record terminal

#### Scenario: Open-link restart-boundary membership is protected

- **WHEN** an evaluated assertion precedes a same-depth `openLinkCommand` restart boundary and no evaluated command follows that boundary
- **THEN** the unmodified classifier SHALL exclude the earlier assertion and treat the record as retryable
- **AND** only removing `openLinkCommand` from the restart-boundary command set among the four listed mutations SHALL make the record terminal

#### Scenario: Empty command record reaches the classifier

- **WHEN** a failed first attempt writes a parseable `commands.json` containing an empty list
- **THEN** the unmodified classifier SHALL treat the record as retryable and report `0 command(s) recorded, last=none status=none`
- **AND** only forcing the explicit empty-list branch to return false among the four listed mutations SHALL make the record terminal
