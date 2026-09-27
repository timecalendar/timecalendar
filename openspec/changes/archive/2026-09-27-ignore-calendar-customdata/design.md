## Context

`CreateCalendarDto` accepts `customData` as an optional nested value. The global validation pipe forbids unknown properties, so deleting the DTO property would reject deployed clients that send `customData: null`. `CalendarSyncService.createCalendar` currently copies the field into a new `Calendar`; sync then builds a `{ url, customData }` source, and the fetch strategy passes credentials to `IcalFetcher`. The fetcher sets Axios `auth` and gives a Basic-specific error on a challenged 401.

The production read-only check found no non-null values in 505,445 calendars. Mobile and web creation both send `null`, and both show a generic import error today. The create request's committed OpenAPI schema references `CalendarCustomData`; that schema currently has no properties. The `calendar.customData` column is nullable and must remain while older server versions might still write it. The authenticated `POST /events` debug route also uses `CalendarSource` but is excluded from OpenAPI.

## Goals / Non-Goals

**Goals:**

- Preserve accepted calendar-create payloads and the committed create contract while discarding their credential value.
- Remove source credentials from all calendar fetch calls, including resync of previously stored rows.
- Make a challenged upstream 401 use the ordinary fetch failure shape, with no Basic-specific response marker or outbound Authorization header from `customData`.

**Non-Goals:**

- Drop the database column, change client code or generated contracts, change URL transformation, or implement fetch coalescing.
- Remove unrelated Basic authentication used to protect server administration endpoints.

## Decisions

## Decision 1 — Keep validation at the create boundary, then discard the value

Keep `CreateCalendarDto.customData` optional and nested with its current class and validation behavior. If moving `CalendarCustomData` and `BasicCredentials` out of the fetch models, place their definitions at the create DTO boundary without changing their runtime names or decorators; verify that OpenAPI generation produces the same create schema. `createCalendar` explicitly selects only the fields it uses and never copies `customData` into the sync input. A nullable JSON column mapping remains in `Calendar`, with a non-fetch-layer type if needed. This preserves old request acceptance without leaving a credential-bearing path into persistence.

Alternative: delete the DTO property. Rejected because `forbidNonWhitelisted` would make current clients fail creation. Alternative: keep writing null from the request. Rejected because accepting a future non-null value would make retention depend on a caller detail; the service must own the discard.

## Decision 2 — Make fetch sources URL-only across all callers

Remove `CalendarSource.customData` and the credential parameter from `FetchService`, `SchoolStrategy.fetchEvents`, `Fetcher.fetch`, and `IcalFetcher.fetch`. Build sources from `url` only in `CalendarSyncService`, for both creation and stored-calendar resync. Keep `FetchContext` as the separate signal/attempt argument and update the bound-work proof and fixtures to its new position. Strategy matching and URL renaming still receive the source URL and school code. Existing rows with a historical non-null column value are ignored when fetched.

Alternative: leave the unused argument in the fetch interface and ignore it only inside `IcalFetcher`. Rejected because the data would still cross the fetch boundary and could be reintroduced by another fetcher.

## Decision 3 — Handle 401 through the generic transport failure

Remove Axios `auth` assignment and the 401 challenge branch that throws `CustomError`. The retrying fetcher uses its existing bounded retry policy, and a final 401 is reported through the same `BadRequestException` path as other upstream HTTP failures. Tests should prove no auth-specific marker and no Basic Authorization header are emitted, while preserving the generic client error experience.

Alternative: retain the challenge-specific error without sending credentials. Rejected because clients do not use the marker and it preserves an obsolete credential prompt contract.

## Risks / Trade-offs

- **Old credential-bearing rows could stop fetching.** The production read-only census found none; retain the column during rollout and verify even a simulated historical row does not forward credentials.
- **Moving DTO classes could alter generated schema names or requiredness.** Compare generated OpenAPI output byte-for-byte against the committed contract; leave contract and clients untouched.
- **A 401 may consume the normal bounded retry budget.** Its user-facing result stays a generic import failure; test the final error and preserve the existing abort and budget behavior.
- **Other Basic-auth sites are unrelated.** Limit removals to calendar source fetching; keep administration endpoint authentication intact.

## Migration Plan

Deploy the server code with the column in place. New creates no longer persist credentials; existing rows are fetched by URL only. A rollback restores the old fetch behavior without a schema rollback. Consider dropping the column separately only after all deployed server versions stop writing it.

## Open Questions

None.
