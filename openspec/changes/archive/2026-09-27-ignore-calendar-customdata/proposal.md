## Why

Calendar creation still accepts optional source credentials, and the server can forward them as HTTP Basic authentication. Current clients send `customData: null`, and a read-only production check found no stored non-null values. Retiring this unused credential path simplifies calendar fetching without rejecting deployed client requests.

## What Changes

- Keep `customData` in the calendar-create request with its current nullable, nested validation shape, but discard the value before persistence or fetching.
- Remove `customData` from fetch-layer calendar sources and remove credential arguments from the strategy and iCal fetcher calls. Upstream requests never receive Basic credentials from this field.
- Treat an upstream 401 as an ordinary fetch failure without an authentication-specific error payload. Existing mobile and web import flows already display generic errors.
- Retain the nullable `calendar.customData` database column for deployment compatibility. Its removal needs a later, separately scoped change.

## Capabilities

### New Capabilities

- `server-calendar-source-auth-retirement`: Calendar creation accepts but ignores legacy source credentials; fetches use only the effective URL and report 401 as a generic failure.

### Modified Capabilities

None.

## Impact

- Backend: `server/src/modules/calendar-sync/`, `server/src/modules/fetch/`, and their tests. The calendar entity keeps its existing column mapping.
- API: The committed `openapi/openapi.json` create shape and generated clients remain unchanged. No `mobile/`, `web/`, or schema migration is in scope.
- Sensitive surfaces: The OpenAPI contract and `server/src/migrations/` are adjacent to the change and must remain untouched. No native configuration, deployment infrastructure, or legacy Flutter files are involved.
