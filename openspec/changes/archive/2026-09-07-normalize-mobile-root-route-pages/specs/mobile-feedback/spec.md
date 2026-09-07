## MODIFIED Requirements

### Requirement: Feedback form follows keyboard, accessibility, and localization contracts

The feedback screen SHALL present its localized route title exclusively in the compact native Stack header and SHALL render the existing explanatory copy as a caption-only `PageIntro` within a shared readable `RootPage`; it SHALL NOT repeat the route title as an oversized in-content heading. It SHALL retain visible translated field labels, translated accessibility labels, and minimum 44pt iOS / 48dp Android interactive targets. The e-mail input SHALL use the e-mail keyboard and Next action to focus the message input. The message SHALL support multiple lines and Return SHALL insert a newline rather than submit. The existing `KeyboardAvoidingView` and `ScrollView` SHALL keep all content reachable when the keyboard and large text are active, without a nested scroller or duplicated responsive gutter. Every feedback and entry-point key SHALL exist in flat typed EN and FR catalogs with parity.

#### Scenario: Keyboard traversal reaches the multiline message
- **WHEN** the user activates Next from the e-mail field
- **THEN** focus moves to the message field
- **AND** Return in the message field creates a new line without submitting

#### Scenario: Native title and caption expose one route hierarchy
- **WHEN** the Feedback route opens
- **THEN** the native compact header shows the localized Feedback title and the shared page intro shows only the explanatory caption
- **AND** the content tree proceeds from caption to field labels, fields, errors, and Send without a duplicate content heading

#### Scenario: Assistive technology receives semantic form state
- **WHEN** the screen renders its native title, caption, labels, errors, loading, and controls
- **THEN** route chrome, caption, field labels, alerts/live regions, button roles, disabled state, and touch targets expose the required semantics in meaningful focus order

#### Scenario: FR and EN remain typed and complete
- **WHEN** TypeScript and i18n tests run
- **THEN** all feedback, Settings-entry, and iCal-report keys resolve in both catalogs with no hardcoded user-facing copy
