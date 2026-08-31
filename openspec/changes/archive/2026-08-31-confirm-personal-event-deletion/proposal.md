## Why

React Native currently deletes a device-local personal event as soon as the user presses Delete, while the legacy Flutter flow asks for confirmation. Because personal events have no server backup, one accidental tap can permanently remove user-owned data.

## What Changes

- Replace immediate deletion with a localized, platform-native confirmation alert that explicitly offers Cancel and destructive Delete actions.
- Make every non-confirming exit inert: Cancel, supported back/outside dismissal, and accessibility escape leave the populated edit form open and perform no repository write.
- Admit only one confirmed deletion while the async repository call is pending; a successful delete closes the form exactly once, while a failed delete preserves the form, existing error notice and recorded-error behavior, then permits retry.
- Add focused component coverage for opening, cancelling, confirming, duplicate confirmation, success, failure, and retry.
- Extend the personal-events Maestro round-trip so it first cancels deletion and proves the event remains, then confirms and proves the event is removed.
- Record the physical-device VoiceOver/TalkBack and native-presentation checks as a non-blocking `(HUMAN: ...)` migration inbox item.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-personal-events-ui`: deletion from an edit form becomes confirmation-gated, cancellation-safe, single-flight, localized, accessible, and covered by component and Maestro proofs.

## Impact

- Primary code: `mobile/src/features/personal-events/ui/personal-event-form-screen.tsx` and its colocated test.
- Localization: `mobile/src/i18n/locales/en.json` and `mobile/src/i18n/locales/fr.json`, retaining typed bidirectional key parity.
- E2E and manual evidence: `mobile/.maestro/personal-events.yaml` and a new note under `docs/react-native-migration/inbox/`.
- The existing `useDeleteEvent().remove(uid)` repository/observability contract remains unchanged unless implementation uncovers a correctness gap; there is no data-model, API, schema, dependency, route, or native-configuration change.
- Sensitive surfaces touched: none. Legacy `app/` is read-only parity reference; no changes are expected in OpenAPI/generated code, server migrations, mobile native/store configuration, infrastructure, workflows, or binding Architecture Book rules.
