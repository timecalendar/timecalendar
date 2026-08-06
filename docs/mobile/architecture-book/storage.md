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

Use synchronous transaction callbacks and synchronous `.run()` executors. The Expo SQLite
synchronous driver does not await an async transaction callback, which would commit before
all statements finish.

## Tables

| Table | Purpose | Important representation |
| --- | --- | --- |
| `personal_events` | Durable local user-created events | Dates are ISO-8601 UTC text; colors are `#RRGGBB`; IDs come from `expo-crypto` |
| `user_calendars` | Durable imported calendar identity and visibility | Server ID and irreplaceable source token are distinct; dates are ISO-8601 UTC text |
| `calendar_events` | Replaceable offline cache of synced events | Server fields remain verbatim; structured fields are validated JSON text |
| `checklist_items` | Event checklist items and order | Soft reference by event UID; deletion is hard; reordering is transactional |

Repository mappers own database encoding and defensive decoding. UI and forms work with
domain values, not rows.

## MMKV values

MMKV holds settings, notification preferences, query persistence, school/group identity,
and hidden-event identifiers. Keys are flat and namespaced. Reads are total and return a
safe default for missing, malformed, or legacy values.

Hidden events use one validated value shaped as `{ uidHiddenEvents, namedHiddenEvents }`.
They are filtered at the calendar event-source seam, not deleted from the synced cache.

## Durability

`user_calendars`, `personal_events`, checklists, and hidden-event state are durable user
data. `calendar_events` and the TanStack Query cache are rebuildable caches. Schema changes
require a committed migration and mapper tests; destructive cache replacement must remain
transactional.
