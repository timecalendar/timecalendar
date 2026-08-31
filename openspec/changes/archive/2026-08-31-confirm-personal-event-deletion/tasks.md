## 1. Localized native confirmation

- [x] 1.1 Add French and English keys for the confirmation title, permanence message, Cancel action, and destructive Delete action in `mobile/src/i18n/locales/en.json` and `fr.json`; verify typed bidirectional parity with `cd mobile && npx tsc --noEmit`.
- [x] 1.2 In `mobile/src/features/personal-events/ui/personal-event-form-screen.tsx`, replace the immediate delete handler with `Alert.alert`: localized title/message, Cancel first with `style: "cancel"`, Delete second with `style: "destructive"`, Android's supported native dismissal callback, and an iOS presentation-edge release that does not rely on the unavailable `onDismiss` callback.
- [x] 1.3 Add a synchronous `idle | prompting | deleting` ref guard plus render state: suppress duplicate prompts, admit only the first destructive callback, disable `personal-event-delete` with `accessibilityState={{ disabled: true }}` while removal is pending, and release the guard on cancel, dismissal, or failed completion.
- [x] 1.4 Keep `useDeleteEvent().remove(uid)` as the only confirmed write; on `true` call `router.back()` exactly once, and on `false` keep the populated form and existing `WriteErrorNotice`/recorded-error behavior mounted for retry. Change `form/hooks.ts` only if a failing proof demonstrates that its current contract is insufficient.

## 2. Component and hook proof

- [x] 2.1 Extend `mobile/src/features/personal-events/ui/personal-event-form-screen.test.tsx` with an exception-safe `Alert.alert` spy and explicit router reset so suite-owned mocks cannot leak between randomized tests.
- [x] 2.2 Add a component test proving that pressing `personal-event-delete` opens the localized native alert but performs no repository write or navigation.
- [x] 2.3 Add component tests invoking the captured Cancel and Android native `onDismiss` callbacks, plus an iOS proof that invokes no nonexistent dismissal callback; prove every path is inert, preserves the form, and allows the confirmation to reopen.
- [x] 2.4 Add a deferred-promise component test that invokes the destructive callback repeatedly while pending and presses the underlying Delete control again; prove one `remove(uid)` call and disabled accessibility state.
- [x] 2.5 Add component tests proving successful removal calls `router.back()` once, while failed removal shows the existing localized error, performs no navigation, preserves populated input values, releases the guard, and allows a later successful retry.
- [x] 2.6 Run the focused CI proof tests: `cd mobile && npm test -- --runInBand src/features/personal-events/ui/personal-event-form-screen.test.tsx src/features/personal-events/form/hooks.test.ts`; keep the existing hook rejection/Crashlytics assertions green.

## 3. Maestro cancellation and confirmation round-trip

- [x] 3.1 Update `mobile/.maestro/personal-events.yaml` after opening the created event: press Delete, tap the English Cancel action, assert the edit screen remains, return to the list, and assert the unique event title is still present.
- [x] 3.2 Reopen the preserved event, press Delete, tap the English destructive Delete action, and retain the final assertion that the list no longer contains the title.
- [x] 3.3 Validate the edited flow off-device with `cd mobile && npx prettier --check .maestro/personal-events.yaml` and run `./e2e/test_run_e2e.sh`; do not add the `run-e2e` PR label or claim native execution on this no-KVM host.

## 4. Accessibility and documentation

- [x] 4.1 Add a dated note under `docs/react-native-migration/inbox/` tagged `(HUMAN: ...)` requesting physical-device VoiceOver and TalkBack verification of initial alert focus, title/message/action announcements, cancel/destructive semantics, accessibility escape, Android back/outside dismissal, and platform-native presentation; record the steps as pending, not passed.
- [x] 4.2 Review `docs/mobile/architecture-book/{accessibility,i18n,testing,storage}.md` after implementation. Record Architecture Book update as N/A in the PR/handoff if the implementation remains the planned leaf use of existing contracts; if implementation establishes or changes a reusable rule, update the topical page and Architecture Book changelog before handoff.
- [x] 4.3 Confirm the diff does not modify the read-only sensitive Flutter `app/` reference or any other sensitive surface (`openapi/openapi.json`, generated API code, server migrations, mobile native/store config, infrastructure, workflows); call out any unexpected touch in the PR body and handoff.

## 5. Local-green and handoff evidence

- [x] 5.1 Run formatting checks for every touched source, catalog, YAML, inbox, and OpenSpec file; apply formatting rather than weakening the check.
- [x] 5.2 Run `cd mobile && npx tsc --noEmit` and targeted ESLint over the touched TypeScript/TSX files with zero warnings.
- [x] 5.3 Run the focused component/hook/i18n tests and then the smallest coverage command that includes the changed form screen; confirm existing coverage thresholds/configuration remain unchanged.
- [x] 5.4 Run `openspec validate confirm-personal-event-deletion --strict` and keep every completed task checked; record any genuinely device-only item as the inboxed human follow-up rather than marking it passed.
- [x] 5.5 Push the implementation commit(s) to the existing TIM-439 branch and update the existing draft PR body to mark apply complete, including exact commands/results, the native-E2E limitation, sensitive-surface status, and the component test as the PR `test-mobile` CI proof. Re-read the PR body after writing it and report exact-head CI state without claiming pending checks are green.
