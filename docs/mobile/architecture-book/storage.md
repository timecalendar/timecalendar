# Storage

## Seams

- `@/storage` owns MMKV access for small key/value state. Feature code uses typed stores
  and reactive hooks, never `react-native-mmkv` directly.
- `@/db` owns Expo SQLite, Drizzle schema/operators, migrations, transactions, and live
  queries. Only feature `data/` layers access it.

ESLint enforces both boundaries. Native configuration is generated through Expo CNG.

## SQLite lifecycle

Bundled Drizzle migrations run before the application becomes ready. A migration failure
blocks readiness and is recorded; the app must not continue against an unknown schema.

Live queries observe SQLite update notifications and coalesce bursts into one read per
macrotask. They ignore an in-flight result after unmount. Calendar timeline repositories use
SQL half-open intersection predicates over the complete three-page instant range, plus a separate
UTC-midnight civil envelope for date-only rows; they apply no `LIMIT` and do not pre-read either
event table. Other existing whole-table consumers remain intentional for their current data size.

Checklist summary progress is the scoped-query case: the event-checklists data layer
normalizes the rendered UID set and selects only `event_uid` plus `is_checked` through
one live query per Home or Calendar screen. It deliberately applies no `deleted_at`
predicate; imported non-null values retain the existing Flutter-compatible counting
semantics, while application deletes remain hard deletes.

Use synchronous transaction callbacks and synchronous `.run()` executors. The Expo SQLite
synchronous driver does not await an async transaction callback, which would commit before
all statements finish.

## Tables

| Table             | Purpose                                           | Important representation                                                                                                                          |
| ----------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `personal_events` | Durable local user-created events                 | Dates are ISO-8601 UTC text; colors are `#RRGGBB`; IDs come from `expo-crypto`                                                                    |
| `user_calendars`  | Durable imported calendar identity and visibility | Server ID and irreplaceable source token are distinct; dates are ISO-8601 UTC text                                                                |
| `calendar_events` | Replaceable offline cache of synced events        | Server fields remain verbatim; structured fields are validated JSON text                                                                          |
| `checklist_items` | Event checklist items and order                   | Soft reference by event UID; deletion is hard; reordering is transactional                                                                        |
| `activity_logs`   | Incremental offline cache of calendar-log history | Keyed by the server log ID and merged, never replaced; the change payload is validated JSON text; indexed on `created_at` and `calendar_id`       |
| `activity_state`  | Activity read watermark and pagination position   | Singleton row `id = 1`, unseeded; a missing row reads as documented defaults; the read watermark is server time, the refresh stamp is device time |

Repository mappers own database encoding and defensive decoding. UI and forms work with
domain values, not rows.

Activity is the one server-backed cache that is **not** drop+replaced. Its history is
cursor-paginated, so a newest-page refresh that replaced the table would delete every
older page a student had already backfilled. Pages merge by server log ID inside one
transaction that also prunes rows beyond one year and rows whose calendar the device no
longer holds, then advances the cursor — so a failed write leaves both the rows and the
pagination position untouched. The one-year cutoff and the read watermark both derive
from server-issued time; no Activity code path may write a device-clock value into
`last_read_at`. See ADR [046](./decisions/046-activity-cache-merge-and-server-read-watermark.md).
The v1 server may represent one oversized source log as several adjacent rows. Fragment zero keeps
the source id so its upsert replaces a previously cached whole item; later fragments use stable
sortable ids and therefore coexist in server traversal order under the existing descending-id
tie-break. The cache does not parse the ids or reassemble fragments (ADR
[058](./decisions/058-activity-virtual-fragment-pagination.md)).

## MMKV values

MMKV holds settings, notification preferences, query persistence, school/group identity,
hidden-event identifiers, and Changelog acknowledgement. Keys are flat and namespaced.
Reads are total and return a safe default for missing, malformed, or legacy values.
The Settings-owned `settings.calendarView` closed `day | week | agenda` string is
environment-independent: missing, malformed, legacy, or unsupported values resolve to `week`,
and backend reset preserves the per-installation choice. Only the mode persists; Calendar derives
its civil anchor and clock offset from fresh-open policy. The `settings.showWeekends` boolean is
also environment-independent: missing or
malformed reads resolve to `true`, explicit false/true values remain reactive across app starts,
and backend reset preserves it.
The numeric `settings.calendarZoomPixelsPerHour` value is likewise environment-independent and
shared by Calendar Day and Week. Only finite values from 40 through 120 are valid; missing,
malformed, non-finite or out-of-range reads resolve to the 60 px/hour default. Backend reset
preserves the per-installation value, while reinstall may remove it.

Display-timezone intent uses the environment-independent compatibility key
`settings.timezonePreference`: `system` or an exact generated-catalog identifier. The separate
environment-independent `settings.lastManualTimezone` remembers manual intent across automatic
mode. Reads classify corrupt and runtime-unavailable values without rewriting them; only an exact
catalog identifier supported by the current `Intl` runtime may update both keys. Effective
resolution uses a supported device zone and then `Europe/Paris` as non-destructive fallback.

Notification synchronization persists only the backend-bound boolean
`notifications.sync.dirty` and non-negative safe-integer
`notifications.sync.generation`. New intent advances generation and marks dirty synchronously
before a notification preference write. Missing or malformed values decode to `false` and `0`;
backend reset removes both. Tokens, calendar identifiers, locale/zone signatures, DTOs, errors,
retry timestamps, and request queues are never stored; every retry rebuilds from canonical current
sources.

The canonical `frequency`, `nbDaysAhead`, and `isActive` preference values remain independent:
turning subscription intent off does not clear frequency or horizon. Native choice surfaces and
custom drafts add no storage path. A confirmed preset or valid custom value uses the existing
setter once; draft edits and every dismissal path remain memory-only.

The versioned export-guide LKG registry is a backend-bound rebuildable cache behind `@/storage`.
Each logical record is isolated by requested locale, client schema, and active or exact-version
selector, then revalidates its strong ETag, response/body locale, resolved version, timestamp, and
complete catalogue before use. A valid response constructs the next registry in memory and commits
it with one string write, preserving other valid logical records; a thrown write leaves the prior
document intact. The registry never stores an import draft, provider selection, page index,
completion proof, route state, or active journey snapshot.

LKG freshness is inclusive through exactly 24 hours. A process-local monotonic observation ages
records while the JS process lives, so live wall-clock changes cannot extend freshness. After a
restart, that observation is unavailable and age falls back to persisted UTC wall time; negative
age fails closed, while a non-negative backward adjustment before restart can extend freshness by
the adjustment. This documented limitation is accepted for the rebuildable cache.

Changelog stores the flat numeric key `changelogSeenVersion`. Its feature store accepts only
finite, non-negative safe integers; missing, malformed, negative, or fractional values decode
as absent. The tabs gate silently seeds an absent value to the bundled current integer, while
an older integer presents only newer bundled releases. Phase 09 validates Flutter's
`current_version` and calls `setChangelogSeenVersion` before tabs eligibility runs.

Hidden events use one validated value shaped as `{ uidHiddenEvents, namedHiddenEvents }`.
They are filtered at the calendar event-source seam, not deleted from the synced cache.

## Durability

`user_calendars`, `personal_events`, checklists, and hidden-event state are durable user
data. `calendar_events`, `activity_logs`, `activity_state` and the TanStack Query cache are
rebuildable caches — backend-bound, refetched after a reset or a reinstall, and explicitly
**not** Phase-09 importer targets (Flutter's `calendar_logs` store is not imported), so the
importer-fidelity constraint that shaped the four earlier table schemas does not apply to
the Activity tables. Schema changes require a committed migration and mapper tests;
destructive cache replacement must remain transactional.

A migration is proven against real SQLite, not only against the mocked runner: the
committed SQL is applied to an in-memory `node:sqlite` database both on a fresh install and
on top of a database already holding rows in every earlier table. A migration that fails on
an installed database is a data incident, and the mocked seam cannot catch one.

## Backend environment reset

- `@/storage` centrally enumerates and classifies every known MMKV key. Theme, language,
  display-timezone and remembered manual value, Calendar view, Calendar zoom, Show weekends, and Changelog acknowledgement survive; selected backend and the temporary
  reset journal are controls; school/group selection, hidden events, notification values,
  remembered feedback e-mail and persisted Query data are backend-bound. Unknown keys default to
  backend-bound and are removed. The export-guide LKG registry is also backend-bound and is removed
  on reset. Type coverage fails when a centralized known key is unclassified.
- `@/db.resetBackendDatabase()` synchronously deletes `checklist_items`, `activity_logs`,
  `activity_state`, `calendar_events`, `user_calendars` and `personal_events` in that order
  inside one transaction. That list is the only one: the environment switch calls
  `resetBackendDatabase()`, so a table added there is covered by the switch with nothing
  else to update — and a table missing from it leaves another environment's private
  schedule data on the device.
- The version-1 current/target journal bridges stores that cannot share a transaction. It is written
  before clearing and removed only after the selected target commits. Valid or malformed journals
  block startup; valid recovery retries the idempotent participants. See ADR
  [043](./decisions/043-backend-environment-reset.md).
