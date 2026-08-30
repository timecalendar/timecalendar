# Feature map

This page shows ownership and important dependencies. Detailed behavior belongs in
code and product specifications.

| Feature            | Responsibility                                                                      | Persistence and external seams                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `settings`         | Theme, language, and display-timezone preferences                                   | `@/storage`; consumed by theme, i18n startup, every zone-threaded rendering surface, and notification registration                                           |
| `notifications`    | Subscription preferences, FCM registration, and notification routing                | `@/storage`, `@/firebase`, generated notification API                                                                                                        |
| `personal-events`  | Local event CRUD, validation, and forms                                             | `@/db`; dates stored as ISO-8601 UTC text                                                                                                                    |
| `school-selection` | School/group queries, search, theme-aware logos, and selected identities            | TanStack Query plus `@/storage`; nullable dark logo URLs fall back to the required default URL                                                               |
| `onboarding`       | Localized welcome → agenda → notifications carousel and source-selection flow       | Presentation-only; native pager composes school and calendar-source features                                                                                 |
| `calendar-sources` | QR/iCal import and user-calendar management                                         | `expo-camera`, generated API, `user_calendars` table                                                                                                         |
| `feedback`         | Validated suggestions and recorded iCal-failure reports                             | `@/storage` for the last valid e-mail, `@/firebase` for body-free failures, generated contact API                                                            |
| `calendar`         | Day/week grid, agenda, sync, event details, and routing                             | Renderer-neutral timeline facade with an isolated calendar-kit adapter, generated sync API, `calendar_events` table                                          |
| `hidden-events`    | Hide and restore synced events                                                      | One validated `@/storage` value; filtering occurs at the calendar event-source seam                                                                          |
| `event-checklist`  | Checklist CRUD and ordering for either event kind                                   | `checklist_items` table                                                                                                                                      |
| `activity`         | Device-local calendar-log history cache, the read watermark, the pagination position, **and the single refresh/pagination seam every Activity trigger shares** | `@/db`; `activity_logs` / `activity_state` tables, merged by server log ID rather than replaced; `@/api/generated/calendar-logs` (`POST /v1/calendar-logs/search`, the plain function — **no TanStack Query**, ADR 048); `findAll` from `@/features/calendar-sources/data` for held tokens + IDs — the feature's **only** cross-feature dependency, pointing outward so the graph stays acyclic (hidden calendars count as held); `@/firebase` records a skipped undecodable row, a malformed response and a storage fault as a static context with no payload. Exposes `pruneToHeldCalendars`, the removal-driven ownership prune, which TIM-399 wires to calendar removal |
| `home`             | Today-only dashboard and next-active-day summary                                    | Reads the unified calendar event source                                                                                                                      |
| `settings`         | Third-tab grouped navigation and held-calendar summary                              | Reads the public calendar-sources hooks; persists no state                                                                                                   |
| `splash`           | Startup presentation                                                                | Presentation-only                                                                                                                                            |
| `about`            | Localized product, privacy, contact, installed-version, and developer information   | `expo-application`, `expo-web-browser`, and `expo-linking`; persists no state                                                                                |
| `changelog`        | Bundled localized release history and tabs-eligible once-per-version presentation   | `@/storage` integer `changelogSeenVersion`; Phase 09 imports through `setChangelogSeenVersion` before tabs mount; JS-bundle version bumps remain OTA-capable |
| `environment`      | Build-authorized backend selection, the Settings entry that is the sole environment indicator, and journaled reset/recovery | `app.config` capability, `@/storage` journal/classification, `@/db`, Query runtime, Firebase diagnostics and injected reload                                 |

## Cross-feature contracts

- The calendar event-source seam merges synced and personal events, applies calendar
  visibility and hidden-event filters, and supplies Home, Calendar, and event details.
- Calendar taps open unified event details for both event kinds. Personal events can
  continue to the edit form; synced events remain read-only.
- User-calendar rows contain server calendar IDs and durable source tokens. Notification
  registration sends server IDs, not tokens.
- Feedback sends every held calendar's server ID. Calendar sources may open Feedback
  after a recorded iCal import failure with only the attempted URL and available
  selected-school ID/name; local invalid-URL errors never offer reporting.
- Feedback treats contact-service 503 responses as recoverable: the form retains the
  e-mail and message, re-enables explicit retry, announces equivalent FR/EN guidance,
  and records only the error plus the static `feedback/contact-submit` context. The
  shared API mutator never prints contact request or response bodies in development.
- Notification receipt always requests a calendar sync. Only notification taps navigate.
- Local preference parsers are total: absent, corrupt, or legacy values return safe
  defaults instead of throwing.
- UI failures are accessible. Unexpected native, persistence, and background failures are
  recorded through `@/firebase` without personal data.
- About owns its standalone `features/about` module and consumes the Settings grouped-row
  primitives. This reversible local ownership choice does not require an ADR.
- Changelog owns its typed newest-first catalog, total seen-version store, gate, and shared
  history/sheet content. Phase 09 must call its exported setter before `(tabs)` mounts; every
  future `CHANGELOG_VERSION` bump must ship matching bundled content in the same JS update.
- Environment switching owns all destructive coordination. Feature UI never clears SQLite/MMKV
  directly. Any future authentication/session feature must register its idempotent clear operation
  with the environment participant registry before shipping (ADR 043).

## Navigation

The root contains Home, Calendar, and Settings tabs. Settings, notification settings,
personal events, event details, calendar-source management, About, and onboarding are stack
routes outside the tab group. Settings owns a nested native Stack and a thin feature UI
entrypoint. `/about` is a root Stack sibling reached from Settings; `/settings` is canonical,
and root `/profile` temporarily redirects to it.

See [calendar.md](./calendar.md), [storage.md](./storage.md), and
[golden-path.md](./golden-path.md) for shared implementation contracts.
