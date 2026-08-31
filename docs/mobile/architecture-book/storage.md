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
macrotask. They ignore an in-flight result after unmount. Whole-table reads are intentional
for the current data size; introduce scoped SQL queries if measured volume makes them too
expensive.

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

## MMKV values

MMKV holds settings, notification preferences, query persistence, school/group identity,
hidden-event identifiers, and Changelog acknowledgement. Keys are flat and namespaced.
Reads are total and return a safe default for missing, malformed, or legacy values.

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
  display-timezone and Changelog acknowledgement survive; selected backend and the temporary
  reset journal are controls; school/group selection, hidden events, notification values,
  remembered feedback e-mail and persisted Query data are backend-bound. Unknown keys default to
  backend-bound and are removed. Type coverage fails when a centralized known key is unclassified.
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
