## MODIFIED Requirements

### Requirement: Firebase accessed through a single wrapper seam
All application code SHALL access Crashlytics, Analytics, and Cloud Messaging through a single
`src/firebase/` module exposing the app's own helpers, rather than calling
`@react-native-firebase` directly at feature call sites, so the SDK is swappable behind one
seam. Each helper SHALL resolve the native instance lazily inside its body so importing
`@/firebase` never touches native code, with the single documented exception of the messaging
background-message handler, which MUST be registered at module init (RN harness constraint) and
is the only top-level native access permitted in the seam.

#### Scenario: Feature code does not import the SDK directly
- **WHEN** a screen or feature needs to log an event, record an error, request notification permission, or get the FCM token
- **THEN** it imports a helper from `@/firebase`
- **AND** it does not import `@react-native-firebase/*` directly

#### Scenario: Importing the seam does not touch native (background handler excepted)
- **WHEN** `@/firebase` is imported under Jest
- **THEN** the import succeeds without resolving native Crashlytics/Analytics/Messaging instances
- **AND** the only top-level native call is the messaging `setBackgroundMessageHandler` registration
