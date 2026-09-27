## 1. Keep create compatibility and discard input

- [x] 1.1 Keep `CreateCalendarDto.customData` optional with its nested `CalendarCustomData` and `BasicCredentials` validation shape while moving those types out of the fetch model; prove through the configured HTTP `ValidationPipe` that both `customData: null` and a valid `{ auth: { username, password } }` request reach calendar creation successfully.
- [x] 1.2 Stop copying `customData` into the new calendar and make `CalendarSyncService` build URL-only sources for create and resync; assert in `calendar-sync.service.test.ts` that the valid credential-bearing request persists a null column, passes no credentials to the fetcher, and still preserves the stored source URL and ADE window behavior.

## 2. Remove calendar-source authentication from fetching

- [x] 2.1 Remove `CalendarSource.customData` and the credential argument throughout `FetchService`, `SchoolStrategy.fetchEvents`, `Fetcher.fetch`, and `IcalFetcher.fetch`; update the source fixtures, debug DTO behavior, and signal/attempt call sites. Prove with fetch-service and strategy tests that URL transformation and context propagation still work.
- [x] 2.2 Remove Axios `auth` and the Basic-specific 401 `CustomError` branch. In the iCal fetcher test, return a challenged 401 and assert an ordinary bounded fetch failure, no Basic-specific marker, and no Authorization header derived from `customData`.
- [x] 2.3 Cover an eligible historical calendar row with non-null `customData` in a sync test and assert the retained column value never reaches the upstream fetcher; leave the nullable column mapping and migrations unchanged.

## 3. Record the contract and local proof

- [x] 3.1 Update the Architecture Book's `docs/mobile/architecture-book/data.md` with the current create seam behavior: deployed requests can send `customData`, but the server ignores it. Verify no mobile code, web code, or generated client changes are included.
- [x] 3.2 Run `cd server && npm test -- --coverage`, `npm run lint`, and `npx tsc --noEmit` with the repository's documented services; record exact commands and results. Run `openspec validate ignore-calendar-customdata` and `git diff --check`.

  Verification on the unchanged server inputs: `npm test -- --coverage --coverageProvider=v8 --maxWorkers=4 --silent --coverageReporters=text-summary` passed 111 suites and 846 tests with an isolated test database and queue. Coverage was 82.07% statements and lines, 81.12% branches, and 79.03% functions. `npm run lint`, `npx tsc --noEmit`, `openspec validate ignore-calendar-customdata`, and `git diff --check` passed.
- [x] 3.3 Prove the committed create contract is byte-for-byte unchanged by running the server's OpenAPI generation/check path and comparing `openapi/openapi.json` to the base; verify `server/src/migrations/`, `mobile/`, `web/`, and the calendar column mapping have no changes.

## 4. CI proof on the pushed head

- [x] 4.1 On the exact pushed PR head, confirm the server test job passes its tests and committed OpenAPI drift check; if the new compatibility or 401 proof fails in CI, repair the implementation or test without weakening either assertion.
