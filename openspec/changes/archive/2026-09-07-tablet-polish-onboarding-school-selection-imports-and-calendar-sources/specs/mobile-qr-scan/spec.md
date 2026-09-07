## ADDED Requirements

### Requirement: QR guidance is bounded independently from the camera
The QR scanner SHALL keep the camera full bleed while permission, instruction, viewfinder,
import-state, and recovery content use measured readable lanes within their existing owners.

#### Scenario: Granted camera remains full bleed
- **WHEN** the QR scanner is measured at tablet width with camera permission granted
- **THEN** the camera continues to fill its available surface
- **AND** the fixed-square viewfinder, guidance, and actions are centered within readable bounds

#### Scenario: Permission and recovery states remain readable
- **WHEN** permission, import, error, retry, scan-another, or manual-import content is displayed at
  tablet width
- **THEN** that content is centered in a measured readable lane
- **AND** permission transitions, import state, debounce, and recovery behavior remain unchanged
