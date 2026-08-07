# Feature map

This page shows ownership and important dependencies. Detailed behavior belongs in
code and product specifications.

| Feature | Responsibility | Persistence and external seams |
| --- | --- | --- |
| `settings` | Theme and language preferences | `@/storage`; consumed by theme and i18n startup |
| `notifications` | Subscription preferences, FCM registration, and notification routing | `@/storage`, `@/firebase`, generated notification API |
| `personal-events` | Local event CRUD, validation, and forms | `@/db`; dates stored as ISO-8601 UTC text |
| `school-selection` | School/group queries, search, and selected identities | TanStack Query plus `@/storage` |
| `onboarding` | Welcome and source-selection flow | Presentation-only; composes school and calendar-source features |
| `calendar-sources` | QR/iCal import and user-calendar management | `expo-camera`, generated API, `user_calendars` table |
| `calendar` | Day/week grid, agenda, sync, event details, and routing | Renderer-neutral timeline facade with an isolated calendar-kit adapter, generated sync API, `calendar_events` table |
| `hidden-events` | Hide and restore synced events | One validated `@/storage` value; filtering occurs at the calendar event-source seam |
| `event-checklist` | Checklist CRUD and ordering for either event kind | `checklist_items` table |
| `home` | Today-only dashboard and next-active-day summary | Reads the unified calendar event source |
| `settings` | Third-tab grouped navigation and held-calendar summary | Reads the public calendar-sources hooks; persists no state |
| `splash` | Startup presentation | Presentation-only |

## Cross-feature contracts

- The calendar event-source seam merges synced and personal events, applies calendar
  visibility and hidden-event filters, and supplies Home, Calendar, and event details.
- Calendar taps open unified event details for both event kinds. Personal events can
  continue to the edit form; synced events remain read-only.
- User-calendar rows contain server calendar IDs and durable source tokens. Notification
  registration sends server IDs, not tokens.
- Notification receipt always requests a calendar sync. Only notification taps navigate.
- Local preference parsers are total: absent, corrupt, or legacy values return safe
  defaults instead of throwing.
- UI failures are accessible. Unexpected native, persistence, and background failures are
  recorded through `@/firebase` without personal data.

## Navigation

The root contains Home, Calendar, and Settings tabs. Settings, notification settings,
personal events, event details, calendar-source management, and onboarding are stack
routes outside the tab group. Settings owns a nested native Stack and a thin feature UI
entrypoint. `/settings` is canonical; root `/profile` temporarily redirects to it.

See [calendar.md](./calendar.md), [storage.md](./storage.md), and
[golden-path.md](./golden-path.md) for shared implementation contracts.
