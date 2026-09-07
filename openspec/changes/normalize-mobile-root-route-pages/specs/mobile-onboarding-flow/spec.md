## ADDED Requirements

### Requirement: Ordinary onboarding pushes use compact native chrome and shared page rhythm

The nested onboarding Stack SHALL reuse the shared compact Stack options for every ordinary pushed child while the root `onboarding` container remains headerless. The branded carousel at `onboarding/index` SHALL remain headerless. School, institution-name, programme, connect, manual import, QR scan, iCal URL, and the retained off-path groups route SHALL show a localized compact native title and minimal chevron-only back affordance. Their ordinary content SHALL use the shared root-page rhythm without changing the welcome carousel, import-draft provider lifetime, deep links, journey order, input/keyboard behavior, camera behavior, or completion/dismissal behavior.

#### Scenario: Welcome remains a branded exception

- **WHEN** the onboarding entry route renders
- **THEN** the native nested header is hidden and the three-page brand carousel retains its own top controls, page headings, and safe-area composition
- **AND** pushing School transitions to a visible compact native header

#### Scenario: Import journey titles move into native chrome

- **WHEN** institution-name, programme, connect, manual import, iCal URL, QR permission, or groups content renders
- **THEN** its localized route title appears in native chrome and is not repeated as an oversized content heading
- **AND** any helper copy renders as caption content at the shared spacing below the header

#### Scenario: School and Programme actions survive inherited chrome

- **WHEN** School opens from calendar management or Programme renders its Skip action
- **THEN** School keeps its platform-specific dismissing chevron and native search configuration, and Programme keeps its iOS native or Android header Skip action
- **AND** both screens display their localized compact title instead of a blank header title

#### Scenario: QR camera retains full-bleed content

- **WHEN** QR permission is granted and the scanner phase renders
- **THEN** the localized compact header and back affordance remain visible
- **AND** the camera, viewfinder overlay, scan callbacks, failure recovery, and accessibility labels remain owned by the QR feature below the header
