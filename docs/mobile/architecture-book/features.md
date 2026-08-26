# Feature map

This page shows ownership and important dependencies. Detailed behavior belongs in
code and product specifications.

| Feature | Responsibility | Persistence and external seams |
| --- | --- | --- |
| `settings` | Theme, language, and display-timezone preferences | `@/storage`; consumed by theme, i18n startup, every zone-threaded rendering surface, and notification registration |
| `notifications` | Subscription preferences, FCM registration, and notification routing | `@/storage`, `@/firebase`, generated notification API |
| `personal-events` | Local event CRUD, validation, and forms | `@/db`; dates stored as ISO-8601 UTC text |
| `school-selection` | School/group queries, search, and selected identities | TanStack Query plus `@/storage` |
| `onboarding` | Localized welcome → agenda → notifications carousel and source-selection flow | Presentation-only; native pager composes school and calendar-source features |
| `calendar-sources` | QR/iCal import and user-calendar management | `expo-camera`, generated API, `user_calendars` table |
| `feedback` | Validated suggestions and recorded iCal-failure reports | `@/storage` for the last valid e-mail, `@/firebase` for body-free failures, generated contact API |
| `calendar` | Day/week grid, agenda, sync, event details, and routing | Renderer-neutral timeline facade with an isolated calendar-kit adapter, generated sync API, `calendar_events` table |
| `hidden-events` | Hide and restore synced events | One validated `@/storage` value; filtering occurs at the calendar event-source seam |
| `event-checklist` | Checklist CRUD and ordering for either event kind | `checklist_items` table |
| `home` | Today-only dashboard and next-active-day summary | Reads the unified calendar event source |
| `settings` | Third-tab grouped navigation and held-calendar summary | Reads the public calendar-sources hooks; persists no state |
| `splash` | Startup presentation | Presentation-only |
| `about` | Localized product, privacy, contact, installed-version, and developer information | `expo-application`, `expo-web-browser`, and `expo-linking`; persists no state |

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
- Notification receipt always requests a calendar sync. Only notification taps navigate.
- Local preference parsers are total: absent, corrupt, or legacy values return safe
  defaults instead of throwing.
- UI failures are accessible. Unexpected native, persistence, and background failures are
  recorded through `@/firebase` without personal data.
- About owns its standalone `features/about` module and consumes the Settings grouped-row
  primitives. This reversible local ownership choice does not require an ADR.

## Navigation

The root contains Home, Calendar, and Settings tabs. Settings, notification settings,
personal events, event details, calendar-source management, About, and onboarding are stack
routes outside the tab group. Settings owns a nested native Stack and a thin feature UI
entrypoint. `/about` is a root Stack sibling reached from Settings; `/settings` is canonical,
and root `/profile` temporarily redirects to it.

See [calendar.md](./calendar.md), [storage.md](./storage.md), and
[golden-path.md](./golden-path.md) for shared implementation contracts.
