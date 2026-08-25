# Tasks — mobile feedback and iCal failure reporting

## 1. Feedback form logic and remembered e-mail

- [ ] 1.1 Scaffold `mobile/src/features/feedback/` with data/form/UI sublayer barrels and a public feature barrel; verify lint boundaries permit only the data layer to import the generated contact client.
- [ ] 1.2 Implement typed localizable form validation for normalized required e-mail and required non-whitespace multiline message; unit-test empty, invalid, whitespace, and valid/trimmed branches to the 90% logic threshold.
- [ ] 1.3 Add the flat `feedback.lastEmail` store through `@/storage`, with a total valid-e-mail-or-empty parser and read/write helpers; unit-test unset, valid, whitespace-normalized, malformed, and corrupt values and verify no message persistence exists.

## 2. Submission enrichment and generated contact seam

- [ ] 2.1 Add a pure device-info formatter/read seam using `expo-device` and `expo-constants` for model, OS/version, app name/version/build, and `extra.appVariant`, with deterministic fallbacks; unit-test complete iOS/Android-style and missing-metadata inputs.
- [ ] 2.2 Implement `useSendFeedback()` in the feedback data layer over the real generated `useContactControllerSendMessage` mutation; build `SendMessageDto` from normalized form values, every held calendar server ID, device info, and only optional `calendarUrl`/`schoolId`/`schoolName` context, omitting subject and `gradeName`.
- [ ] 2.3 Add a data-layer proof with a real QueryClient and mocked `@/api/mutator`: assert the exact standard and iCal-enriched DTOs, all-calendar inclusion regardless of visibility, optional-field omission, pending/reset behavior, and rejection without a live server; verify `openapi/openapi.json` and `mobile/src/api/generated/` remain unchanged.

## 3. Feedback route and native form UI

- [ ] 3.1 Implement `FeedbackScreen` with keyboard-aware scrolling, heading/intro, visible and accessible labels, e-mail Next-to-message focus, multiline message behavior, minimum touch targets, field errors, duplicate-submit prevention, and a polite pending status.
- [ ] 3.2 Prefill the total-parsed remembered e-mail and persist the normalized address after client validation; on success show the localized native Alert with one Close action that calls `router.back()`.
- [ ] 3.3 On rejection retain both inputs, expose the retryable inline polite `alert`, re-enable Send, and call `recordUnknownError(error, "feedback/contact-submit")` with no DTO/e-mail/message metadata.
- [ ] 3.4 Add `mobile/src/app/feedback.tsx` as a thin re-export and register `/feedback` in the root Stack with header/back behavior; add screen tests for route-param normalization, focus/keyboard props, all validation branches, remembered-email behavior, pending state, success Alert/back, failure/retry, and the exact body-free telemetry call.

## 4. Settings and iCal failure entry points

- [ ] 4.1 Add a localized third Settings section (`support`) with a full-width Feedback row to `/feedback`; update `settings-screen.test.tsx` to assert section order, translated row presence/accessibility, and route wiring instead of Feedback absence.
- [ ] 4.2 In `IcalUrlScreen`, resolve optional selected school ID/name through public school-selection hooks and add Report a problem only inside the recorded `isError` block; navigate with an encoded Expo Router object to `/feedback` carrying only trimmed `calendarUrl` plus available `schoolId`/`schoolName`.
- [ ] 4.3 Extend iCal screen tests to prove Report appears after a valid server-side rejection, preserves Retry/recording, forwards exact context with absent fields omitted, and never appears or navigates for empty/invalid URL prefilter errors.

## 5. Typed copy, accessibility, and no-network E2E proof

- [ ] 5.1 Add flat typed EN/FR keys for Feedback title/intro/labels/required-invalid errors/loading/send/success/failure/close, the Settings support row/section/hint, and iCal Report label/hint; run TypeScript to prove bidirectional catalog parity and lint to prove no hardcoded user-facing strings.
- [ ] 5.2 Add a shared `mobile/.maestro/feedback.yaml` flow that clears state, opens Settings, navigates through the Feedback row, submits the empty form, and asserts client-side e-mail/message errors; verify the flow never enters valid values and therefore never calls the real e-mail-sending `/contact` endpoint.
- [ ] 5.3 Add focused accessibility assertions for heading semantics, visible/input labels, alert/live-region errors, pending/disabled state, translated control labels/hints, and ≥44pt iOS / 48dp Android targets.

## 6. Living documentation and human evidence

- [ ] 6.1 Update `docs/mobile/architecture-book/features.md` with the new `feedback` owner/seams and the calendar-sources → feedback failure-context contract; update `navigation.md` with root `/feedback`; add a factual entry to `docs/mobile/architecture-book/CHANGELOG.md`. Do not add an ADR unless implementation reveals a genuinely binding new rule.
- [ ] 6.2 Mark Phase 07 step 3 shipped in `docs/react-native-migration/01-roadmap/07-auxiliary-features.md` using the established style and this PR's number.
- [ ] 6.3 Add a non-blocking `docs/react-native-migration/inbox/` note tagged `(HUMAN: …)` for iOS/Android keyboard traversal, multiline entry, dynamic type, VoiceOver/TalkBack, dark mode, success Alert/back, failure retry, and iCal context verification.

## 7. Local green and CI proof

- [ ] 7.1 Run targeted feedback, Settings, and iCal data/UI tests while implementing; ensure every new logic file clears the 90% per-file lines/branches threshold and presentation tests cover platform/accessibility branches.
- [ ] 7.2 Run the full mobile Definition of Done locally: `npx tsc --noEmit`, `npm run lint`, and `npm test -- --coverage`; record exact green results in the handoff.
- [ ] 7.3 Validate and inspect the Maestro YAML without attempting a simulator on this KVM-less host; rely on the repository's CI/native evidence path and do not add `run-e2e` merely to force a local-device-equivalent run.
- [ ] 7.4 Run `openspec validate add-mobile-feedback`, confirm all tasks/spec scenarios and Architecture Book updates are satisfied, and capture the generated-client drift check as the CI proof that the existing `/contact` contract was consumed unchanged.
