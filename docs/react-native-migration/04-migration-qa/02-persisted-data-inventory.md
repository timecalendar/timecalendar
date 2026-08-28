# 02 — Persisted data inventory

← [01 — Scope & execution order](./01-scope-prerequisites-and-execution-order.md) · [Section index](./README.md) · next: [03 — Flutter seed packs](./03-flutter-seed-packs.md)

> Every persisted or recoverable datum in the Flutter app, traced in the source, with its React
> Native counterpart. This is the checklist the scenario catalog must cover, and the reference a
> tester uses to answer "was this supposed to survive?".

---

## 1. The four places data lives

### 1.1 Flutter — sembast document database

One file, `simple_database.db`, in the app's documents directory
(`app/lib/modules/database/providers/simple_database.dart:18-19`), schema version 3
(`app/lib/modules/database/providers/migrations.dart:5`). Opened at startup by
`main.dart` right after preferences are loaded (`app/lib/main.dart:51-54`).

The format is plain-text **JSONL**, unencrypted, append-only, with tombstones for deletes — a
line per write, last-write-wins per `(store, key)`. This was confirmed on a real iOS device
([`../00-exploration/data-persistence-migration.md` §3.2, §6](../00-exploration/data-persistence-migration.md#32-sembast-the-real-data)).

Six stores:

| Store | Record key | Declared at |
| --- | --- | --- |
| `user_calendars` | the calendar `id` | `app/lib/modules/calendar/repositories/user_calendar_repository.dart:11` |
| `personal_events` | the event `uid` | `app/lib/modules/personal_event/repositories/personal_event_repository.dart:11` |
| `checklist_items` | the item `uuid` | `app/lib/modules/event_details/repositories/checklist_item_repository.dart:16` |
| `hidden_events` | auto-generated; **exactly one record** | `app/lib/modules/hidden_event/repositories/hidden_event_repository.dart:15` |
| `calendar_events` | auto-generated (written with `addAll`, not by uid) | `app/lib/modules/calendar/repositories/calendar_event_repository.dart:11` |
| `calendar_logs` | the log `id` | `app/lib/modules/activity/repositories/calendar_log_repository.dart:14` |

### 1.2 Flutter — `shared_preferences`

Key/value settings, loaded at startup (`app/lib/main.dart:51-52`) by
`app/lib/modules/settings/providers/settings_provider.dart`. On iOS these land in
`NSUserDefaults` with **every key prefixed `flutter.`** (device-confirmed:
`Library/Preferences/fr.samuelprak.timecalendar.plist`). On Android the prefix is the same but
the backend is unconfirmed — see [Q-02](./09-open-engineering-questions.md#q-02--which-shared_preferences-backend-does-android-use).

### 1.3 React Native — SQLite via Drizzle

One database, `timecalendar.db` (`mobile/src/db/index.ts`), with four tables declared in
`mobile/src/db/schema.ts`: `personal_events`, `user_calendars`, `calendar_events`,
`checklist_items`. Their columns mirror the Flutter wire format **verbatim** — this is a
deliberate design constraint so the importer can write recovered rows with no transformation
(the schema file says so at every table). Schema migrations run at startup
(`mobile/src/app/_layout.tsx:42` → `mobile/src/db/migrate.ts`).

### 1.4 React Native — MMKV key/value

One instance behind the `@/storage` seam (`mobile/src/storage/index.ts`). The full key list is
`STORAGE_KEYS` in that file. Keys are also *classified*: `environment-independent`,
`reset-control`, or `backend-bound`. That classification matters —
`clearBackendBoundStorage()` wipes every `backend-bound` key when the backend environment is
switched, and `hiddenEvents.set` is backend-bound (see [D-11](#d-11) and
[Q-09](./09-open-engineering-questions.md#q-09--is-hiddenevents-being-backend-bound-correct-for-a-migrated-user)).

---

## 2. Inventory

Legend for **Class**:

| Class | Meaning |
| --- | --- |
| 🔴 **DEVICE** | Device-owned, no server copy. **Must migrate.** Loss is permanent. |
| 🟡 **SERVER** | Server-owned. May be dropped and refetched. |
| 🔵 **CACHE** | Derived/temporary. May be rebuilt. |
| ⚪ **RN-ONLY** | Exists only in RN; nothing in Flutter to migrate from. Verify it defaults sanely. |
| ❓ **UNKNOWN** | Needs an engineering answer before the expectation can be stated. Linked to a `Q-nn`. |

> ⚠️ The **"Visible offline right after the update"** column states the *intended* behavior — the
> contract the Phase-09 importer is specified to deliver
> ([`../01-roadmap/09-data-migration.md`](../01-roadmap/09-data-migration.md)). If the build under
> test has no importer ([B-3](./01-scope-prerequisites-and-execution-order.md#b-3--does-the-build-contain-the-importer)),
> the observed value for every 🔴 row will be "absent", and that is recorded as
> **N/A — importer not in build**, not `FAIL`.

### 2.1 The irreplaceable set — sembast

<a id="d-01"></a>
#### D-01 · Calendar subscription token

| | |
| --- | --- |
| **What / owner** | The opaque token that identifies the student's timetable subscription. Owned by calendar sources. It is the single most critical value on the device: the timetable is refetched *with* it, and there is no way to recover it from the server without it. |
| **Flutter stores it** | sembast `user_calendars` → `token` (`app/lib/modules/calendar/models/user_calendar.dart`, `toDbMap()`) |
| **RN expects it** | SQLite `user_calendars.token`, `text NOT NULL` (`mobile/src/db/schema.ts:56`); read by `getByToken` (`mobile/src/features/calendar-sources/data/user-calendars/repository.ts`) and by the sync orchestrator (`mobile/src/features/calendar/data/sync/sync.ts`) |
| **Class** | 🔴 **DEVICE** |
| **Visible offline right after the update** | Not directly (tokens are never shown in the UI). Its *presence* is visible: **Réglages → Vos calendriers** shows the calendar, and the settings summary shows a non-zero calendar count. |
| **Verified by** | `OFF-02`, `ON-01`, `ON-02`, `REC-02` |

<a id="d-02"></a>
#### D-02 · Calendar identity & metadata

| | |
| --- | --- |
| **What / owner** | Per calendar: `id`, `name`, `schoolName`, `schoolId`, `createdAt`, `lastUpdatedAt`. Calendar sources. The `id` is the sembast record key **and** the RN primary key. |
| **Flutter stores it** | sembast `user_calendars`, keyed by `id` (`user_calendar_repository.dart` `addUserCalendar`) |
| **RN expects it** | SQLite `user_calendars` — `id` PK, `name`, `school_name`, `school_id`, `created_at`, `last_updated_at` (`mobile/src/db/schema.ts:54-63`) |
| **Class** | 🔴 **DEVICE** (the id/token pair) with 🟡 metadata (`name`/`schoolName` are re-resolvable from the server *given the token*) |
| **Visible offline right after the update** | **Réglages → Vos calendriers → Gérer les calendriers** lists one row per calendar with its name and school. |
| **Verified by** | `OFF-02`, `OFF-19` |

<a id="d-03"></a>
#### D-03 · Calendar visibility flag

| | |
| --- | --- |
| **What / owner** | Per calendar, whether its events are shown. Calendar sources. Flutter defaults it to `true` and tolerates its absence (`UserCalendar.fromInternalDb`: `map.containsKey('visible') ? … : true`). |
| **Flutter stores it** | sembast `user_calendars` → `visible` (bool) |
| **RN expects it** | SQLite `user_calendars.visible`, integer boolean, default `true` (`mobile/src/db/schema.ts:62`); toggled by `setVisible` in the user-calendars repository |
| **Class** | 🔴 **DEVICE** (a deliberate student choice; nothing on the server records it) |
| **Visible offline right after the update** | The per-calendar switch on **Gérer les calendriers** reflects the pre-update position. |
| **Verified by** | `OFF-03` |

<a id="d-04"></a>
#### D-04 · Personal events

| | |
| --- | --- |
| **What / owner** | Student-authored events. Personal events. Fields: `uid`, `title`, `color` (`#RRGGBB`), `startsAt`, `endsAt`, `location?`, `description?`, `exportedAt` — the exact `PersonalEvent.toMap()` shape (`app/lib/modules/personal_event/models/personal_event.dart`). Dates are stored as UTC ISO-8601. |
| **Flutter stores it** | sembast `personal_events`, keyed by `uid` (a UUID v4 minted in `add_personal_event_controller.dart`) |
| **RN expects it** | SQLite `personal_events` — `uid` PK, `title`, `color`, `starts_at`, `ends_at`, `exported_at`, `location`, `description` (`mobile/src/db/schema.ts:22-31`). Read/written via `mobile/src/features/personal-events/data/repository.ts`. |
| **Class** | 🔴 **DEVICE** — **no server module exists**. A dropped event is gone forever. |
| **Visible offline right after the update** | Every event appears on **Réglages → Événements personnels**, on the Accueil/Calendrier surfaces for its date, and opens in the details screen with its title, time, colour, location and description intact. |
| **Verified by** | `OFF-04`, `OFF-05`, `OFF-06`, `OFF-07`, `OFF-16`, `OFF-18`, `OFF-19`, `ON-02` |

<a id="d-05"></a>
#### D-05 · Personal-event colour encoding

| | |
| --- | --- |
| **What / owner** | The `#RRGGBB` string, alpha stripped (`ColorUtils.colorToHex`, `app/lib/modules/shared/utils/color_utils.dart`). **Caveat for baselining:** when the student is in dark mode Flutter *lightens* the chosen colour before storing it (`SettingsProvider.getEventColorToSave` → `ColorUtils.lightenEvent`, +0.28 HSL lightness) and darkens it again for display. So the stored hex is not necessarily the hex the student picked. |
| **Flutter stores it** | Inside `personal_events.color` |
| **RN expects it** | `personal_events.color`, text, verbatim (`mobile/src/db/schema.ts:25`) |
| **Class** | 🔴 **DEVICE** |
| **Visible offline right after the update** | The event's colour swatch in the list and on the details screen. |
| **Verified by** | `OFF-04` (and see its note — record the colour *as rendered by Flutter*, and expect RN to render the stored hex without Flutter's dark-mode transform) |

<a id="d-06"></a>
#### D-06 · Checklist items

| | |
| --- | --- |
| **What / owner** | The per-event to-do list ("Ajouter une note"). Event checklists. Fields: `uuid`, `eventUid`, `content`, `isChecked`, `order` (1-based), `createdAt`, `updatedAt`, `deletedAt` (`app/lib/modules/event_details/models/checklist_item.dart`). |
| **Flutter stores it** | sembast `checklist_items`, keyed by `uuid` |
| **RN expects it** | SQLite `checklist_items` — `uuid` PK, `event_uid`, `content`, `is_checked`, `order`, and three nullable timestamps (`mobile/src/db/schema.ts:157-166`) |
| **Class** | 🔴 **DEVICE** — no server backup. |
| **Visible offline right after the update** | Open the owning event → **Liste de tâches** shows every item, in its original order, with its checked state. |
| **Verified by** | `OFF-08`, `OFF-09`, `OFF-17`, `OFF-18`, `OFF-19`, `ON-03` |

<a id="d-07"></a>
#### D-07 · Checklist ↔ event relationship

| | |
| --- | --- |
| **What / owner** | `checklist_items.eventUid` joins to **either** a personal event's `uid` **or** a synced course's `uid`. Both apps treat it as a soft reference with no foreign key — deliberately, because the RN sync drops and re-inserts every `calendar_events` row on each sync and a hard FK would cascade-delete the student's notes (`mobile/src/db/schema.ts:133-140`). |
| **Flutter stores it** | `checklist_items.eventUid` |
| **RN expects it** | `checklist_items.event_uid` (`mobile/src/db/schema.ts:159`); read by `findByEvent` ordered by `order` ascending |
| **Class** | 🔴 **DEVICE** |
| **Visible offline right after the update** | A note created on a *course* is still on that course; a note created on a *personal event* is still on that personal event. They are not swapped or merged. |
| **Verified by** | `OFF-09`, `ON-03` |

<a id="d-08"></a>
#### D-08 · Checklist ordering

| | |
| --- | --- |
| **What / owner** | `order`, 1-based, assigned as `length + 1` on add and re-numbered `i + 1` on reorder/delete (`app/lib/modules/event_details/providers/checklist_item_provider.dart`). RN reads with `ORDER BY "order" ASC` and re-numbers identically (`mobile/src/features/event-checklists/data/repository.ts`). |
| **Flutter stores it** | `checklist_items.order` |
| **RN expects it** | `checklist_items.order`, integer |
| **Class** | 🔴 **DEVICE** |
| **Visible offline right after the update** | The item list reads top-to-bottom in the pre-update order. |
| **Verified by** | `OFF-08`, `OFF-19` |

<a id="d-09"></a>
#### D-09 · Checklist `deletedAt`

| | |
| --- | --- |
| **What / owner** | A column that exists in both models and is **never set or read** by either app — Flutter's delete is a hard delete (`_store.delete(finder: Filter.byKey(uuid))`) and neither app filters on `deletedAt`. RN keeps the column purely so an imported record carrying a legacy non-null value round-trips (`mobile/src/db/schema.ts:149-156`). |
| **Flutter stores it** | `checklist_items.deletedAt`, usually `null` |
| **RN expects it** | `checklist_items.deleted_at`, nullable text |
| **Class** | 🔵 **CACHE** (inert) |
| **Visible offline right after the update** | Nothing. A deleted item must **not** reappear. |
| **Verified by** | `OFF-08` (step: a deleted item stays deleted) |

<a id="d-10"></a>
#### D-10 · Hidden events — by uid

| | |
| --- | --- |
| **What / owner** | The set of individual course `uid`s the student hid. Hidden events. |
| **Flutter stores it** | sembast `hidden_events`, **one single record** holding `{ uidHiddenEvents: [], namedHiddenEvents: [] }`. The repository deletes the store and re-adds one record on every write (`hidden_event_repository.dart` `setHiddenEvents`), so the record key is auto-generated and changes on each save. |
| **RN expects it** | MMKV key `hiddenEvents.set`, a single JSON blob in the **same verbatim shape** (`mobile/src/features/hidden-events/data/types.ts`) |
| **Class** | 🔴 **DEVICE** |
| **Visible offline right after the update** | **Not visible in the RN UI while the course cache is empty.** The management screen filters out a hidden uid until it resolves to a synced course (`mobile/src/features/hidden-events/ui/hidden-events-screen.tsx:44-50`). The blob still retains the uid. Prove survival with decoded MMKV storage evidence when available, or with the resolved entry and filtering behavior after refetch in `ON-05`; do not infer loss from an empty by-uid section offline. |
| **Verified by** | `OFF-10` (explicitly not UI-observable offline), `ON-05`; optional decoded storage evidence |

<a id="d-11"></a>
#### D-11 · Hidden events — by name

| | |
| --- | --- |
| **What / owner** | The set of course *titles* hidden wholesale ("Masquer tous les événements de même nom"). Same store and same blob as [D-10](#d-10). |
| **Flutter stores it** | `hidden_events` → `namedHiddenEvents` |
| **RN expects it** | `hiddenEvents.set` → `namedHiddenEvents` |
| **Class** | 🔴 **DEVICE**. Note it is classified **`backend-bound`** in RN (`mobile/src/storage/index.ts`), meaning a backend-environment switch wipes it. Production builds lock the environment, so this should not fire in a real upgrade — flagged as [Q-09](./09-open-engineering-questions.md#q-09--is-hiddenevents-being-backend-bound-correct-for-a-migrated-user). |
| **Visible offline right after the update** | Listed under **"Masqués par nom"** on the hidden-events screen. |
| **Verified by** | `OFF-10`, `ON-05` |

### 2.2 Server-owned and cache — sembast

<a id="d-12"></a>
#### D-12 · Timetable courses (`calendar_events`)

| | |
| --- | --- |
| **What / owner** | The student's actual courses. Calendar. Fetched from the API and cached locally; Flutter drops the whole store and re-adds on every sync (`calendar_event_repository.dart` `putCalendarEvents` → `_dropAll()` + `addAll`), so the records are keyed by an auto-generated key, not by `uid`. |
| **Flutter stores it** | sembast `calendar_events` |
| **RN expects it** | SQLite `calendar_events`, `uid` PK, also drop-and-replace per sync (`mobile/src/features/calendar/data/sync/repository.ts` `replaceAll`) |
| **Class** | 🟡 **SERVER** — explicitly **not** migrated ([roadmap 09 step 3](../01-roadmap/09-data-migration.md)); it rehydrates from `POST /calendars/sync` using the recovered token. |
| **Visible offline right after the update** | **Nothing, and that is correct.** The calendar and today view are expected to be empty of *courses* while offline, because the RN table starts empty and the first sync needs network. Personal events still show. |
| **Verified by** | `OFF-01` (empty course list is expected, not a failure), `ON-01` |

The cached entity is fully inventoried below. "Storage evidence" means a decoded
`calendar_events` row (normally Android `sqlite3` / a pulled database), because not every nested
value has a dedicated RN visual surface.

| Flutter `calendar_events` field | RN target | QA observable |
| --- | --- | --- |
| `uid` | `calendar_events.uid` primary key | Course identity and hidden/checklist joins in `ON-01`, `ON-03`, `ON-05`; exact value in storage evidence |
| `title` | `title` | Course title in `ON-01` |
| `color`, `groupColor` | `color`, `group_color` | Rendered course colour in `ON-01`; both exact hex values in storage evidence |
| `startsAt`, `endsAt`, `exportedAt` | `starts_at`, `ends_at`, `exported_at` | Start/end in `ON-01`; all three UTC ISO-8601 values in storage evidence |
| `location?`, `description?` | nullable `location`, `description` | Event details in `ON-01` when the selected reference course supplies them |
| `allDay` | `all_day` | All-day/timed placement in `ON-01` |
| `teachers[]` | JSON text `teachers` | Event details in `ON-01`; full array in storage evidence |
| `tags[]` | JSON text `tags` | Each nested tag is `{ name, color, icon }` (`app/lib/modules/calendar/models/event_tag.dart:41-43`). RN rendering projects tag names, so `ON-01` observes names; storage evidence proves all three nested fields. |
| `fields?` | nullable JSON text `fields` | The nested object is `{ canceled?, shortDescription?, subject?, groupColor? }` (`app/lib/modules/calendar/models/calendar_event_custom_fields.dart:3-34`). `ON-01` records any rendered canceled/short-description/subject state; storage evidence proves the full object. |
| `userCalendarId` | `user_calendar_id` | Parent calendar association in `ON-01`; exact value in storage evidence |
| *(not persisted by Flutter)* | required `type` | RN-only richer server field. Live sync supplies the API enum; the importer must use its documented safe default for any recovered cache row (`mobile/src/db/schema.ts:92-98`). No Flutter value exists to compare. |

<a id="d-13"></a>
#### D-13 · Activity / change log (`calendar_logs`)

| | |
| --- | --- |
| **What / owner** | The "Activité" feed of timetable changes. Cached from `GET /calendar-logs` (`app/lib/modules/activity/repositories/calendar_log_repository.dart`). Top-level fields are `id`, `calendarId`, `calendarToken`, `calendarName`, `calendarChange`, `createdAt`, `updatedAt` (`app/lib/modules/activity/models/calendar_log.dart:8-45`). `calendarChange` contains `oldItems[]`, `newItems[]`, and `changedItems[]`; each changed item is an old/new pair. Every nested event contains `uid`, `title`, `startsAt`, `endsAt`, and nullable `location` (`app/lib/modules/activity/models/calendar_change.dart:8-59`; `app/lib/modules/activity/models/calendar_log_event.dart:7-39`). |
| **Flutter stores it** | sembast `calendar_logs` |
| **RN expects it** | **Nothing.** There is no activity feature in `mobile/src/features/`. |
| **Class** | 🟡 **SERVER** + feature not ported |
| **Visible offline right after the update** | Nothing. The RN app has no Activité screen. |
| **Verified by** | `OFF-13` (record the absence of the feature; not a data-loss failure — the server holds the logs) |

There is no per-field RN mapping: **all** top-level fields, the three change collections, both
members of each changed pair, and every nested event field have **no RN target**. `OFF-13` records
that no Activité surface exists; it does not attempt to compare a cache the RN product cannot read.

### 2.3 Preferences — `shared_preferences`

All keys below are written by `app/lib/modules/settings/providers/settings_provider.dart`
(`loadSettings` seeds every one with its default on first run, so they exist on any real install)
and appear on-device with the `flutter.` prefix.

<a id="d-14"></a>
#### D-14 · `theme` / `dark_mode`

| | |
| --- | --- |
| **What / owner** | `theme` ∈ `system` \| `light` \| `dark` (default `system`). `dark_mode` is the pre-2.x legacy boolean, still written, and used once to seed `theme` when `theme` is absent. Settings. |
| **Flutter stores it** | `flutter.theme` (string), `flutter.dark_mode` (bool) |
| **RN expects it** | MMKV `settings.themePreference` ∈ `system` \| `light` \| `dark` (`mobile/src/features/settings/prefs/types.ts`) — the **same three values**, so a straight copy is possible. |
| **Class** | ❓ **UNKNOWN** pending [Q-10](./09-open-engineering-questions.md#q-10--which-preferences-does-the-importer-actually-copy). Roadmap 09 step 4 calls preference copying "optional, for UX continuity"; matching value domains prove only that copying is possible, not that it is required. |
| **Visible offline right after the update** | **Observe and record** Réglages → Apparence et langue → Thème and the rendered appearance. Do not pass/fail the imported choice until Q-10 settles the contract. |
| **Verified by** | `OFF-12` |

<a id="d-15"></a>
#### D-15 · `current_version` (changelog seen-version)

| | |
| --- | --- |
| **What / owner** | Which "what's new" sheet the student has already seen. Flutter's catalog tops out at **3** (`Constants.currentVersion = 3`, `app/lib/modules/shared/constants/constants.dart`); the RN catalog is at **4** (`CHANGELOG_VERSION = 4`, `mobile/src/features/changelog/data/catalog.ts`). |
| **Flutter stores it** | `flutter.current_version` (int) |
| **RN expects it** | MMKV `changelogSeenVersion` (number), validated as a non-negative safe integer (`mobile/src/features/changelog/store/seen-version.ts`); the gate logic is `decideChangelogGate` (`mobile/src/features/changelog/store/gate.ts`) — `undefined` → seed current and show nothing; `< 4` → present the new releases; `>= 4` → skip. |
| **Class** | 🔴 **DEVICE** — and behaviourally load-bearing. Roadmap 09 step 1 explicitly requires importing it **before `(tabs)` can mount**, so that a Flutter user at 3 sees the version-4 sheet exactly once. |
| **Visible offline right after the update** | The version-4 changelog sheet appears **once**, on first launch. On the second launch it does not. |
| **Verified by** | `OFF-11`, `REC-02` |

<a id="d-16"></a>
#### D-16 · `calendar_view_type`

| | |
| --- | --- |
| **What / owner** | `Week` \| `Planning` (`app/lib/modules/calendar/models/ui/calendar_view_type.dart`), default `Week`. Calendar. |
| **Flutter stores it** | `flutter.calendar_view_type` (string) |
| **RN expects it** | **Nothing persisted.** The RN calendar view is React state initialised to `"week"` on every launch (`mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`) — no storage key exists for it. |
| **Class** | ❓ **UNKNOWN** — [Q-04](./09-open-engineering-questions.md#q-04--are-the-flutter-only-calendar-preferences-intentionally-dropped) |
| **Visible offline right after the update** | Expected: the calendar opens in week view regardless of the Flutter choice. |
| **Verified by** | `OFF-13` |

<a id="d-17"></a>
#### D-17 · `show_weekends`, `colors_by_group`, `calendar_hour_height`, `startup_screen`

| | |
| --- | --- |
| **What / owner** | Four more Flutter calendar/app preferences: show weekends in week view (default `true`); colour courses by group rather than individually (default `false`); the pinch-zoom hour height (default `60.0`); which tab opens at launch, `home` \| `calendar` (default `home`). Settings. |
| **Flutter stores it** | `flutter.show_weekends`, `flutter.colors_by_group`, `flutter.calendar_hour_height`, `flutter.startup_screen` |
| **RN expects it** | **Nothing.** No corresponding key exists in `STORAGE_KEYS` (`mobile/src/storage/index.ts`) and no RN screen offers these settings. |
| **Class** | ❓ **UNKNOWN** — [Q-04](./09-open-engineering-questions.md#q-04--are-the-flutter-only-calendar-preferences-intentionally-dropped) |
| **Visible offline right after the update** | Expected: RN behaves as if all four are at their defaults. |
| **Verified by** | `OFF-13` |

<a id="d-18"></a>
#### D-18 · `notification_calendar`, `date_limit`

| | |
| --- | --- |
| **What / owner** | Flutter's two notification preferences: enabled (default `true`) and the "notify me about the next N days" horizon (default `14`). Both are still **written** by `loadSettings`, but the UI that changed them is commented out and the settings screen shows "Les notifications sont temporairement désactivées" with a permanently disabled switch bound to a *different*, unused key (see [D-19](#d-19)). So in practice every real install carries the defaults. |
| **Flutter stores it** | `flutter.notification_calendar` (bool), `flutter.date_limit` (int) |
| **RN expects it** | MMKV `notifications.isActive` (bool, default `true`) and `notifications.nbDaysAhead` (number, default **7**, clamped to 1–30). The RN default deliberately differs from Flutter's 14 (`mobile/src/features/notifications/data/types.ts` documents the choice), and `notifications.frequency` has no Flutter counterpart at all. |
| **Class** | ❓ **UNKNOWN** — [Q-05](./09-open-engineering-questions.md#q-05--should-flutters-notification-preferences-be-imported) |
| **Visible offline right after the update** | Expected: **Réglages → Notifications** shows the RN defaults (active, 7 days, immediately). |
| **Verified by** | `OFF-15` |

<a id="d-19"></a>
#### D-19 · `notification_calendar_disabled`

| | |
| --- | --- |
| **What / owner** | The key bound to the permanently-disabled notifications switch on the Flutter settings screen (`app/lib/modules/settings/screens/settings_screen.dart:101`). It is never read by `SettingsProvider` and has no default. It may or may not exist in a given install. |
| **Flutter stores it** | `flutter.notification_calendar_disabled` (bool), possibly absent |
| **RN expects it** | Nothing. |
| **Class** | 🔵 **CACHE** (dead key) |
| **Visible offline right after the update** | Nothing. |
| **Verified by** | — (documented so a tester who dumps preferences does not report it as unmigrated data) |

<a id="d-20"></a>
#### D-20 · `new_activity`, `last_activity_update`

| | |
| --- | --- |
| **What / owner** | The Activité feature's unread badge (`new_activity`, default `false`) and its last-checked timestamp (`last_activity_update`, default `0`). |
| **Flutter stores it** | `flutter.new_activity`, `flutter.last_activity_update` |
| **RN expects it** | Nothing — the Activité feature is not ported ([D-13](#d-13)). |
| **Class** | 🔵 **CACHE** (feature not ported) |
| **Visible offline right after the update** | Nothing. |
| **Verified by** | `OFF-13` |

### 2.4 Identity and push

<a id="d-21"></a>
#### D-21 · Account / sign-in state

| | |
| --- | --- |
| **What / owner** | **There is none.** The Flutter app has no login: `firebase_auth` is a dependency but is never called, and there is no Google/Apple sign-in path anywhere in `app/lib/`. The only thing resembling an "account" is the calendar subscription token ([D-01](#d-01)). The RN app likewise has no auth. |
| **Flutter stores it** | n/a |
| **RN expects it** | n/a |
| **Class** | ⚪ **RN-ONLY** (nothing to migrate) |
| **Visible offline right after the update** | No sign-in prompt should ever appear. |
| **Verified by** | `OFF-01` |

<a id="d-22"></a>
#### D-22 · FCM / APNs push token

| | |
| --- | --- |
| **What / owner** | The push token. Flutter fetches it at construction of `NotificationService` (`app/lib/modules/firebase/services/notification/notification.dart`); RN registers it to the backend at startup (`mobile/src/app/_layout.tsx` → `useNotificationRegistration`). |
| **Flutter stores it** | Not in app storage — held by the Firebase SDK. |
| **RN expects it** | Re-obtained from the SDK; PUT to the subscription endpoint. |
| **Class** | 🟡 **SERVER** / regenerates on its own. |
| **Visible offline right after the update** | Nothing (registration needs network). |
| **Verified by** | `ON-04` |

### 2.5 React-Native-only state (nothing to migrate from)

<a id="d-23"></a>
#### D-23 · School selection identity

| | |
| --- | --- |
| **What / owner** | MMKV `schoolSelection.schoolId` + `schoolSelection.groupValues` (`mobile/src/features/school-selection/store/types.ts`). RN derives "onboarding complete" from the presence of a school selection (`isOnboardingComplete()`). **Flutter has no equivalent key** — its school/grade choices are transient provider state used to build the subscription, and the resulting school identity survives only *inside* the `user_calendars` row (`schoolId`, `schoolName`). |
| **Flutter stores it** | Nothing directly; `user_calendars.schoolId` / `schoolName` are the only durable trace. |
| **RN expects it** | The two MMKV keys, both absent on a migrated device unless the importer synthesises them. |
| **Class** | ❓ **UNKNOWN** — [Q-06](./09-open-engineering-questions.md#q-06--should-the-importer-seed-the-rn-school-selection-from-user_calendarsschoolid) |
| **Visible offline right after the update** | Expected: the app opens normally (there is no redirect-to-onboarding gate in `mobile/src/app/`), the school-selection state is simply empty. It must **not** send a migrated student back through onboarding. |
| **Verified by** | `OFF-01`, `OFF-14` |

<a id="d-24"></a>
#### D-24 · Language and display-timezone preferences

| | |
| --- | --- |
| **What / owner** | MMKV `settings.languagePreference` (`system`/`fr`/`en`) and `settings.timezonePreference` (`system` or one of ten curated zones) — `mobile/src/features/settings/prefs/types.ts`. Flutter is French-only with no timezone preference. |
| **Flutter stores it** | Nothing. |
| **RN expects it** | Both absent → both read as `"system"` (the parsers are total and fall back). |
| **Class** | ⚪ **RN-ONLY** |
| **Visible offline right after the update** | **Apparence et langue → Langue** = *Système*; **Fuseau horaire** = *Automatique*. The app is in the device language (French on a French device). |
| **Verified by** | `OFF-12` |

<a id="d-25"></a>
#### D-25 · Notification frequency

| | |
| --- | --- |
| **What / owner** | MMKV `notifications.frequency`, default `immediately` (`mobile/src/features/notifications/data/types.ts`). No Flutter counterpart. |
| **Flutter stores it** | Nothing. |
| **RN expects it** | Absent → default. |
| **Class** | ⚪ **RN-ONLY** |
| **Visible offline right after the update** | **Réglages → Notifications** shows the default. |
| **Verified by** | `OFF-15` |

<a id="d-26"></a>
#### D-26 · Persisted query cache

| | |
| --- | --- |
| **What / owner** | MMKV `rq.schoolSelection.cache` — the TanStack-Query offline persister, holding only the schools list and school-groups queries (`mobile/src/features/school-selection/data/persist.ts`). |
| **Flutter stores it** | Nothing comparable. |
| **RN expects it** | Absent → the onboarding school list is empty until network returns. Harmless. |
| **Class** | 🔵 **CACHE** |
| **Visible offline right after the update** | Nothing (a migrated student does not open onboarding). |
| **Verified by** | — |

<a id="d-27"></a>
#### D-27 · Backend environment selection

| | |
| --- | --- |
| **What / owner** | MMKV `backendEnvironment.selected` + `backendEnvironment.resetJournal` (`mobile/src/storage/index.ts`). Only meaningful on development / store-preview builds; production is locked. Switching environments runs `clearBackendBoundStorage()` **and** `resetBackendDatabase()`, which deletes every row of `checklist_items`, `calendar_events`, `user_calendars`, `personal_events` (`mobile/src/db/reset.ts`). |
| **Flutter stores it** | Nothing. |
| **RN expects it** | Absent on a production build; the environment is fixed. |
| **Class** | ⚪ **RN-ONLY** — but **operationally dangerous during QA**. |
| **Visible offline right after the update** | Nothing on a production build. |
| **Verified by** | — |

> ⛔ **Tester warning.** If your RN build exposes a backend-environment switch, **do not touch it
> during a migration pass.** It is a destructive, journaled reset that wipes exactly the four
> tables this playbook exists to verify, and it will look identical to a migration failure.
> If you switch it by accident, the pass is void — restart at step 1.

<a id="d-28"></a>
#### D-28 · The legacy sembast file (safety net)

| | |
| --- | --- |
| **What / owner** | `simple_database.db` itself, after the import. Roadmap 09 step 6 specifies keeping it on disk for one release so a botched migration is recoverable. |
| **Flutter stores it** | The app documents directory. |
| **RN expects it** | To leave it alone. |
| **Class** | 🔴 **DEVICE** (the recovery copy of everything above) |
| **Visible offline right after the update** | Nothing in the UI — this is evidence collected via `adb`/device tooling. |
| **Verified by** | `REC-04` |

<a id="d-29"></a>
#### D-29 · Remembered feedback email

| | |
| --- | --- |
| **What / owner** | The last valid email entered in the RN feedback form, normalized by trimming surrounding whitespace (case is preserved) and reused to prefill the next form. Feedback. |
| **Flutter stores it** | Nothing. Flutter has no corresponding durable feedback-email preference. |
| **RN expects it** | MMKV `feedback.lastEmail` (`mobile/src/storage/index.ts:34,57`). `getRememberedEmail()` validates on read; `setRememberedEmail()` stores only a valid normalized address (`mobile/src/features/feedback/data/remembered-email.ts:4-18`). The form writes it before making the request (`mobile/src/features/feedback/ui/feedback-screen.tsx:67-81`). |
| **Class** | ⚪ **RN-ONLY**, classified `backend-bound` |
| **Visible offline right after the update** | Initially the feedback email field is empty. After a valid offline send attempt, the request fails but the normalized email prefills the form after close/reopen and app restart. |
| **Verified by** | `OFF-20` |

---

## 3. Coverage cross-check

Every inventory row must be covered by at least one scenario, or be explicitly marked as needing
an engineering answer. This table is the check.

| Datum | Class | Scenarios | Open question |
| --- | --- | --- | --- |
| [D-01](#d-01) subscription token | 🔴 | `OFF-02`, `ON-01`, `ON-02`, `REC-02` | — |
| [D-02](#d-02) calendar identity/metadata | 🔴/🟡 | `OFF-02`, `OFF-19` | — |
| [D-03](#d-03) calendar visibility | 🔴 | `OFF-03` | — |
| [D-04](#d-04) personal events | 🔴 | `OFF-04`…`OFF-07`, `OFF-16`, `OFF-18`, `OFF-19`, `ON-02` | — |
| [D-05](#d-05) personal-event colour | 🔴 | `OFF-04` | [Q-07](./09-open-engineering-questions.md#q-07--how-should-a-dark-mode-lightened-colour-be-treated-on-import) |
| [D-06](#d-06) checklist items | 🔴 | `OFF-08`, `OFF-09`, `OFF-17`, `OFF-18`, `OFF-19`, `ON-03` | — |
| [D-07](#d-07) checklist↔event link | 🔴 | `OFF-09`, `ON-03` | — |
| [D-08](#d-08) checklist ordering | 🔴 | `OFF-08`, `OFF-19` | — |
| [D-09](#d-09) checklist `deletedAt` | 🔵 | `OFF-08` | — |
| [D-10](#d-10) hidden by uid | 🔴 | `OFF-10` (offline limitation recorded), `ON-05` | — |
| [D-11](#d-11) hidden by name | 🔴 | `OFF-10`, `ON-05` | [Q-09](./09-open-engineering-questions.md#q-09--is-hiddenevents-being-backend-bound-correct-for-a-migrated-user) |
| [D-12](#d-12) timetable courses | 🟡 | `OFF-01`, `ON-01` | — |
| [D-13](#d-13) activity log | 🟡 | `OFF-13` | [Q-08](./09-open-engineering-questions.md#q-08--is-the-activité-feature-intentionally-not-ported) |
| [D-14](#d-14) theme / dark_mode | ❓ | `OFF-12` (observation) | [Q-10](./09-open-engineering-questions.md#q-10--which-preferences-does-the-importer-actually-copy) |
| [D-15](#d-15) `current_version` | 🔴 | `OFF-11`, `REC-02` | — |
| [D-16](#d-16) `calendar_view_type` | ❓ | `OFF-13` | [Q-04](./09-open-engineering-questions.md#q-04--are-the-flutter-only-calendar-preferences-intentionally-dropped) |
| [D-17](#d-17) weekends / group colours / hour height / startup screen | ❓ | `OFF-13` | [Q-04](./09-open-engineering-questions.md#q-04--are-the-flutter-only-calendar-preferences-intentionally-dropped) |
| [D-18](#d-18) notification prefs | ❓ | `OFF-15` | [Q-05](./09-open-engineering-questions.md#q-05--should-flutters-notification-preferences-be-imported) |
| [D-19](#d-19) `notification_calendar_disabled` | 🔵 | — | — |
| [D-20](#d-20) activity badge keys | 🔵 | `OFF-13` | — |
| [D-21](#d-21) account state | ⚪ | `OFF-01` | — |
| [D-22](#d-22) push token | 🟡 | `ON-04` | — |
| [D-23](#d-23) school selection | ❓ | `OFF-01`, `OFF-14` | [Q-06](./09-open-engineering-questions.md#q-06--should-the-importer-seed-the-rn-school-selection-from-user_calendarsschoolid) |
| [D-24](#d-24) language / timezone | ⚪ | `OFF-12` | — |
| [D-25](#d-25) notification frequency | ⚪ | `OFF-15` | — |
| [D-26](#d-26) query cache | 🔵 | — | — |
| [D-27](#d-27) backend environment | ⚪ | — | — |
| [D-28](#d-28) legacy sembast file | 🔴 | `REC-04` | [Q-11](./09-open-engineering-questions.md#q-11--is-the-one-release-sembast-safety-net-implemented) |
| [D-29](#d-29) remembered feedback email | ⚪ | `OFF-20` | — |

Three rows have no scenario on purpose: [D-19](#d-19) and [D-26](#d-26) are inert, and
[D-27](#d-27) is a control a tester must not touch. All three are documented so that a tester who
dumps device storage does not misreport them.

---

← [01 — Scope & execution order](./01-scope-prerequisites-and-execution-order.md) · [Section index](./README.md) · next: [03 — Flutter seed packs](./03-flutter-seed-packs.md)
