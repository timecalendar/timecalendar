## Why

Activity has a bounded server contract ([TIM-395](/TIM/issues/TIM-395)), a SQLite cache
([TIM-396](/TIM/issues/TIM-396)) and one shared refresh seam ([TIM-397](/TIM/issues/TIM-397)) — and
no way for a student to see any of it. `mobile/src/features/activity/` ships `data/` and nothing
else; Settings has no Activity row and the app has no `/activity` route.

This change adds the half a student can reach: a discoverable Settings entry with a live unread
badge, and an accessible, localized, offline-first timeline over the cache.

## What Changes

- **Add `mobile/src/features/activity/ui/`** and the thin `src/app/activity.tsx` route, registered
  as a root `Stack` sibling of `(tabs)` with a visible header (`navigation.md`).
- **Add the Activity row to the Settings Events section**, with a trailing unread badge rendering
  `1`–`99` then `99+` and nothing at zero. The row is always visible when the app can hold
  calendars — never gated on notification preferences — and with zero calendars it opens the
  ordinary empty state.
- **Render one server `calendar_log` row as one visual group**, newest first, header = change time
  + calendar name, children ordered new → changed → cancelled, each with its own semantic treatment
  and a text label so color is never the only carrier of meaning.
- **Add two semantic status tokens** — `positive` and `informational` — to `src/theme/tokens.ts` in
  both schemes, with computed WCAG ratios recorded next to the existing pairs (`destructive` already
  exists and carries the cancelled treatment).
- **Add two reactive reads to `activity/data`** (`useActivityLogs`, `useActivityState`) and the pure
  badge rule `formatUnreadBadge`. No new table, no new request, no change to the coordinator.
- **Wire the user-initiated operations only:** pull-to-refresh → `refreshNewestPage({ force: true })`
  and end-of-list / footer retry → `loadOlderPage()`. Opening the screen clears the local unread
  count from cache (D2).
- **Add French and English copy** with the specification's exact empty-state sentences, and screen
  tests for every state in both locales.
- **NOT changed:** the screen-open, foreground, push and post-sync triggers stay with Ticket 6
  ([TIM-399](/TIM/issues/TIM-399), D1); no historical event-details model (D5); no server change; no
  contract or generated-client change; no migration; no notification preference; no feature gate.

## Capabilities

### New Capabilities

- `mobile-activity-ui` — the Activity screen, its states, its grouping and ordering, its navigation
  rules, and the Settings unread entry.

### Modified Capabilities

- `mobile-activity-cache` — gains the reactive reads the screen and the badge render from.
- `mobile-settings-hub` — the Events section gains Activity; the current requirement explicitly
  forbids an Activity row until a requirement introduces it, so it must be restated.
- `mobile-theming` — gains the two semantic status tokens and their documented contrast pairs.

## Impact

- **Code:** `mobile/src/features/activity/ui/**` (new), `mobile/src/features/activity/data/hooks.ts`
  + `unread-badge.ts` (new) and the two barrels, `mobile/src/app/activity.tsx` (new),
  `mobile/src/app/_layout.tsx` (one `Stack.Screen`), `mobile/src/features/settings/ui/`
  (settings-screen + settings-row badge affordance), `mobile/src/theme/tokens.ts`,
  `mobile/src/i18n/locales/{en,fr}.json`.
- **Sensitive surfaces:** none of the repo's listed surfaces. `openapi/openapi.json`,
  `mobile/src/api/generated/`, `mobile/app.config.ts`, `eas.json` and `server/src/migrations/` are
  **not** touched — if the work reaches one of them the slice is wrong and it stops on the ticket.
  Accessibility and FR/EN parity are binding Book rules here, not polish.
- **Boundaries:** `activity/ui` may not import `@/db` or the generated calendar-log client — already
  lint-enforced (`eslint.config.js` `timecalendar/activity-seam`, B-1, ADR 048). The screen reaches
  its own `data/` sub-barrel, `@/features/calendar/data` for display formatting only (D6), and the
  event-details route as a **literal URL string** (D5).
- **Cross-ticket:** Ticket 6 owns the screen-open and foreground refresh policy (D1) and is the
  natural owner of the `markActivityRead(asOf)` path this change deliberately leaves uncalled (D2).
  Both are flagged on [TIM-399](/TIM/issues/TIM-399).
- **Risk:** one `calendar_log` row can hold **3,656** changed events (TIM-394 production maximum;
  p99 = 214). The rendering shape has to survive that, which is why children are flattened into the
  virtualized list rather than nested inside a group view (D3).
