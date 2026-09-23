## Purpose

Give students clear, consistent and accessible recovery from mobile failures while keeping their
input and usable calendar content available on both iOS and Android.

## ADDED Requirements

### Requirement: Failure presentation follows context
Field validation SHALL appear beside its input; an operation failure SHALL remain persistently
visible near the affected content; unavailable content SHALL show a title, explanation and recovery.
A valid field SHALL NOT be marked invalid solely because a remote operation failed. Empty content,
permission guidance, successful operations and native confirmation dialogs SHALL remain distinct.

#### Scenario: The server cannot import a valid URL
- **WHEN** a syntactically valid iCal URL fails to import
- **THEN** its value remains editable and a visible operation notice appears before Import
- **AND** the field is not presented as invalid and Report is subordinate to the sole Import action

#### Scenario: Cached content survives a failed refresh
- **WHEN** calendar, Home or Activity refresh fails with usable local content
- **THEN** that content stays visible alongside a compact recovery notice
- **AND** pagination retry requests only the failed older page

### Requirement: Recovery has a visible hierarchy
An error state SHALL explain the failed operation before presenting at most one primary action
and one secondary action. A notice embedded in a form SHALL NOT duplicate its existing submit
control. Recovery actions SHALL keep their existing concurrency, persistence and navigation rules.

#### Scenario: QR import recovery
- **WHEN** a scanned calendar fails to import
- **THEN** a visible import-failure title and explanation accompany primary Retry and secondary Change method
- **AND** Change method returns to the existing chooser without clearing institution or programme
- **AND** the chooser provides QR scanning or iCal entry without a chain of failed source routes

#### Scenario: An invalid QR is scanned
- **WHEN** the scanned payload is not a calendar source
- **THEN** explanatory guidance is readable on an opaque surface over the camera
- **AND** the scanner remains available for another code

### Requirement: Both platforms have accessible error surfaces
Errors SHALL have a non-color signal, readable light/dark contrast, wrapping text and platform-sized
controls (44pt iOS, 48dp Android). A newly visible or changed error SHALL be announced once without
repeated announcements on unrelated renders. Actions SHALL remain separately accessible and busy
recovery SHALL prevent duplicate activation. Rendering SHALL work on the existing supported native
build, including iOS 16.4, without adding dependencies.

#### Scenario: VoiceOver and TalkBack recovery
- **WHEN** an error appears or its message changes
- **THEN** the platform announces it politely once and recovery actions remain independently reachable
- **AND** decorative symbols are excluded from the accessibility tree

#### Scenario: Long text and large fonts
- **WHEN** French or English messages wrap at large accessibility font sizes
- **THEN** title, explanation and actions remain readable without truncation or overlap
- **AND** the owning screen can scroll if content exceeds its available height

### Requirement: Error consistency covers every existing mobile failure surface
The app SHALL use the shared error vocabulary for import, guides, schools/groups, Calendar/Home,
Activity, forms, write failures, native settings/dialogs, development import and startup recovery.
Native controls SHALL retain platform composition. The startup recovery surface SHALL render
before query/navigation providers. Feature-specific failures SHALL retain accurate user-facing copy,
private input SHALL NOT be exposed through generic error messages, and raw exceptions SHALL remain
outside the presentation API.

#### Scenario: Native rename save failure
- **WHEN** saving a valid calendar name fails
- **THEN** the native dialog keeps the value and shows an operation error without marking the field invalid
- **AND** a too-long name uses native field validation instead

#### Scenario: Startup recovery failure
- **WHEN** environment restoration fails before navigation is mounted
- **THEN** a themed error state offers retry without requiring navigation or query context
- **AND** restoration progress is presented as progress rather than an error
