# Mobile feedback and iCal failure reporting

## Why

The React Native app has no user-facing way to send suggestions or report an import failure, leaving a parity gap with Flutter and removing the diagnostic context that helps support resolve calendar problems. Phase 07 step 3 restores that path through the existing `/contact` contract while keeping report contents private and retryable.

## What Changes

- Add a root `/feedback` screen with required e-mail and message validation, keyboard and accessibility behavior, loading/retry states, and typed French/English copy.
- Send feedback through the existing generated `POST /contact` client with all held calendar server IDs and enriched device, app, build, and variant information.
- Remember only the last validated e-mail through a total `@/storage` parser; never persist the message.
- Add a live Feedback destination in a new Settings support section.
- Add a report action only to the recorded server-side iCal import failure state. It forwards the attempted calendar URL and selected school ID/name when available; the invalid-URL prefilter remains local and does not offer reporting.
- Show a native success alert and return to the previous screen; show an accessible inline failure, keep submission retryable, and record body-free failure telemetry.
- Add component/data tests, a no-network Maestro validation flow, Architecture Book updates, a roadmap shipped marker, and a non-blocking human device-pass inbox note.
- Do not add the unused Flutter subject/category field, `gradeName`, attachments, screenshots, server behavior, or other Phase 07 screens.

## Capabilities

### New Capabilities

- `mobile-feedback`: the feedback form, validated remembered e-mail, contact submission enrichment, success/failure behavior, privacy constraints, localization, and verification contract.

### Modified Capabilities

- `mobile-settings-hub`: Settings gains a live support section and Feedback destination that navigates to `/feedback`.
- `mobile-ical-import`: a recorded server-side import failure gains a report action carrying only the failed URL and available school ID/name into the feedback flow.

## Impact

- New `mobile/src/features/feedback/` layered module and thin `mobile/src/app/feedback.tsx` root route; root Stack registration and FR/EN catalog additions.
- Existing Settings and iCal URL screens, their tests, and the public calendar-sources/school-selection seams used for enrichment context.
- Existing generated contact client and DTO are consumed unchanged; `openapi/openapi.json` and `mobile/src/api/generated/` must not drift.
- Existing `expo-device`, `expo-constants`, `@/storage`, and `@/firebase` seams are reused; no new dependency, database migration, server change, or native/store configuration change.
- Documentation updates under the mobile Architecture Book, Phase 07 roadmap, and migration inbox. Legacy `app/` remains a read-only parity reference.
