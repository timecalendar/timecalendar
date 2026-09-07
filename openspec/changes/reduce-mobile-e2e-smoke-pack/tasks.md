## 1. Deterministic import fixture

- [x] 1.1 Add a test/E2E-environment-only NestJS iCalendar fixture endpoint whose events use a date-safe, date-neutral seeded title; add focused server tests proving the payload parses and the route is absent outside the harness environment.
- [x] 1.2 Exercise the existing calendar-create/sync path against the fixture in the cheapest server integration seam and verify the fixture needs no outbound university dependency or API-contract/generated-client change.

## 2. Three retained Maestro journeys

- [x] 2.1 Replace the onboarding/import fragments with one top-level fresh-user journey that clears state, selects the live seeded school, enters a programme, follows Connect and URL import, submits the fixture URL, observes the synced Agenda event, and opens its real details; verify every transition uses a shipped stable selector.
- [x] 2.2 Rewrite the personal-event top-level journey to enter through Home or Calendar, create and reopen the event from that rendered surface, edit stable text, cold-reopen to prove persistence, and confirm deletion; verify the event is absent after cleanup without driving native date/time pickers.
- [x] 2.3 Replace the per-event hidden journey with one subscribed-calendar visibility journey that imports the seeded subscription, anchors its rendered Agenda schedule, toggles the calendar off and proves the schedule disappears after cold re-entry, toggles it on and proves it returns after cold re-entry, and leaves visibility restored.
- [x] 2.4 Move all retained reusable setup YAML into a nested helper directory and remove every other top-level native flow so `mobile/.maestro/*.yaml` contains exactly the three business journeys; verify helpers remain callable but are not discovered independently.

## 3. Cheapest-seam coverage and static guards

- [x] 3.1 Audit each removed flow (Activity, settings/about/appearance, environment, feedback, rename, checklist, hidden-event, Home/calendar standalone, iCal validation, and other reachability/UI variants) against existing server, store/integration, and component suites; record the mapping in the E2E documentation and add focused tests only for valuable uncovered behavior.
- [x] 3.2 Update `maestro-selectors.test.ts` and any flow-specific selector proofs for the new paths while preserving recursive helper scanning, anchored seeded-title handling, no-bare-`back`, and non-vacuous negative assertions; run the focused Jest selector tests.
- [x] 3.3 Extend `test_run_e2e.sh` to prove the exact three-file top-level inventory, lexical process-per-flow execution, nested-helper exclusion, first-terminal-failure behavior, teardown, and `--keep-up`; run the shell harness proof.
- [x] 3.4 Keep `classify-maestro-attempt.mjs` and its mutation-backed retry fixtures device-free and unchanged in semantics; run the classifier/harness fixture suite and confirm no removed device journey is reintroduced as a recovery fixture.

## 4. Specifications and active documentation

- [x] 4.1 Apply the `mobile-e2e` delta spec and update `mobile/e2e/README.md` to name the three journeys, helper convention, deterministic fixture, local command, and removed-flow coverage map.
- [x] 4.2 Update Architecture Book `testing.md`, its `CHANGELOG.md`, and a new ADR to define the three-journey daily smoke budget, its maximum-five board-decision boundary, retained static gates, and broader human release-candidate exploratory acceptance; verify consistency with ADR 038 and ADR 055.
- [x] 4.3 Update the Phase 10 roadmap (and any active E2E migration guidance that names the broad automated pack) so daily smoke and human release-candidate parity checks are explicitly distinct.

## 5. Local-green and CI proof

- [x] 5.1 Run OpenSpec validation, the focused server fixture/import tests, focused mobile coverage added by the audit, Maestro selector-integrity tests, `mobile/e2e/test_run_e2e.sh`, and the retry-classifier/workflow-structure fixtures; record exact commands and results.
- [x] 5.2 Run the applicable mobile TypeScript, lint, formatting, and Jest gates plus the affected server lint/test checks, fixing only failures caused by this change; confirm no API contract, generated client, migration, native/store config, deploy workflow, or legacy Flutter file changed.
- [x] 5.3 Add or update the CI proof so baseline CI fails for any fourth top-level YAML, independently discovered helper, stale retained selector, or weakened harness/classifier invariant, then confirm the exact implementation head is green.

## 6. Bounded native evidence

- [x] 6.1 After all focused/static checks pass and the final implementation commit is pushed, manually dispatch the native E2E workflow once for that exact immutable commit and verify both Android and iOS are selected.
- [x] 6.2 Record both platform conclusions and artifact links on the issue. Do not repeat without a relevant code/config commit or concrete artifact evidence of a transient infrastructure failure; if trustworthy proof remains unavailable, report grouped E2E-health debt instead of expanding the remediation chain.

## Verification evidence

- `openspec validate reduce-mobile-e2e-smoke-pack --strict` — passed.
- `cd server && npm test -- --runInBand e2e/e2e-ical-fixture.controller.test.ts` — 1 suite, 3 tests passed.
- `cd mobile && npm test -- --runInBand e2e/maestro-selectors.test.ts` — 1 suite, 20 tests passed.
- `mobile/e2e/test_run_e2e.sh` and `mobile/e2e/test_ci_mobile_e2e.sh` — passed.
- `cd mobile && npx tsc --noEmit && npm run lint` — passed.
- `cd mobile && npm test -- --coverage --runInBand` — 163 suites and 1,381 tests passed; 98.96% lines and 92.93% branches.
- `cd server && npm run lint` — passed.
- `cd server && npm run test:e2e -- --runInBand` — 1 suite and 1 test passed.
- PR baseline CI for exact implementation head `c348e01374c9b762ea13e76e1e61775e880afc7e` — all 8 checks passed, including mobile checks, server tests, and the branch disclosure scan.
- Deliberate native workflow run `34159981625` resolved exact implementation head `c348e01374c9b762ea13e76e1e61775e880afc7e`, selected Android and iOS, and passed target selection plus server-image preparation.
- The bounded native evidence pass ended while both platform jobs were still building. Neither platform had reached Maestro execution, so trustworthy conclusions and platform artifacts were unavailable; this is recorded as grouped Android/iOS E2E-health debt, with no duplicate dispatch.
