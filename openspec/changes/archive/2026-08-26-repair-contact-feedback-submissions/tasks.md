## 1. Crisp metadata and staged delivery

- [x] 1.1 Add a total contact-metadata builder at the server contact adapter boundary that preserves non-empty enrichment while omitting empty derived nickname, empty joined calendar IDs, and other empty optional values; unit-test numeric-only e-mail local parts, zero calendars, optional-field omission, and the fully enriched case.
- [x] 1.2 Wrap Crisp conversation creation, metadata update, and message send with the closed `create | metadata | message` stage discriminator; add a focused `crisp.client` suite proving operation order, exact privacy-bounded arguments, failure-stage classification, and that later operations do not run after rejection.
- [x] 1.3 Keep the submitted message/e-mail out of new errors and logs; add regression assertions that staged errors expose only the bounded stage and never vendor response text, session ID, or submitted DTO fields.

## 2. Server outcome semantics and bounded metric

- [x] 2.1 Add and register `ContactMetricsService` with `contact_submissions_total`; inject it into `ContactService` and increment exactly once using only bounded `result` and `stage` attributes.
- [x] 2.2 Update contact service tests for one complete success and each Crisp-stage rejection, asserting exact metric attributes and no success/message send after a failed prerequisite.
- [x] 2.3 Map the staged downstream error to one static `ServiceUnavailableException` while leaving validation at 400 and successful delivery at 201; extend the controller regression suite so the metadata `invalid_data` sequence returns 503 with no submitted content or vendor payload.

## 3. OpenAPI contract synchronization

- [x] 3.1 Annotate `POST /contact` with its 400 and static 503 response semantics, run `npm run generate:openapi` from `server/`, and inspect the sensitive `openapi/openapi.json` diff to confirm the request DTO and successful 201 contract remain unchanged.
- [x] 3.2 Run `npm run generate` from `mobile/`, commit `mobile/src/api/generated/` only if Orval produces a contract-derived diff, and verify a second generation of both artifacts is clean; never hand-edit generated files.

## 4. React Native privacy and localized recovery

- [x] 4.1 Add URL-aware development diagnostic redaction in `mobile/src/api/mutator.ts` so `/contact` logs method/path/status but neither request nor response bodies; extend `mutator.test.ts` to prove contact redaction and unchanged non-sensitive diagnostics.
- [x] 4.2 Refine the existing feedback failure key in both typed EN/FR catalogs to state that the message was not sent and can be retried, without adding a screen or changing the form layout.
- [x] 4.3 Extend the feedback generated-mutation test with `ApiError(503, staticBody)` and assert the recorded call remains exactly `recordUnknownError(error, "feedback/contact-submit")`; add EN and FR screen assertions that the 503 retains e-mail/message, re-enables Send, announces localized retry guidance, and permits an explicit second submit.

## 5. Living documentation and evidence

- [x] 5.1 Update `docs/mobile/architecture-book/data.md` with the `/contact` development-log redaction rule and `features.md` with the feedback 503/retry privacy contract; add a factual Architecture Book changelog entry, with no ADR because this is a leaf repair.
- [x] 5.2 Record in the implementation handoff that privacy-filtered production traces identified Crisp metadata PATCH `400 invalid_data` after successful conversation creation; include only aggregate counts/stages/statuses, never contact content, identity, session IDs, or raw trace attributes.
- [x] 5.3 Mark device-only and Maestro changes N/A: the existing mail-safe validation flow and interaction model are unchanged, this host has no KVM, and no new human inbox note or `run-e2e` label is warranted.

## 6. Local green and CI proof

- [x] 6.1 Run the focused server contact suites in-band and the focused mobile mutator/feedback data/UI suites; confirm the empty-metadata and metadata-rejection tests fail against the pre-repair behavior and pass after the change as the CI proof regressions.
- [x] 6.2 Run server build/lint and the repository's server contact coverage appropriate to the touched files; run mobile `npx tsc --noEmit`, `npm run lint`, and `npm test -- --coverage`, preserving the 90% logic and 70% global gates.
- [x] 6.3 Run both committed-contract drift checks after generation and `openspec validate repair-contact-feedback-submissions`; inspect `git diff --check` and confirm no server migration, native/store/EAS, infrastructure/workflow, deployment, secret, or legacy Flutter surface changed.
