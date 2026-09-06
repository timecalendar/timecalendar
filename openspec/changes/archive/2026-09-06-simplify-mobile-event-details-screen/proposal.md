## Why

The unified event-details screen now combines loading, data presentation, synced-event visibility actions, personal-event editing, and checklist integration in one 399-line component. React Doctor flags that orchestration as high-complexity, making behavior-preserving changes harder to review even though each branch already has a clear product contract.

## What Changes

- Split event-details loading/not-found states, header actions, title/tags/content, and event-kind actions into focused calendar UI modules while keeping `EventDetailsScreen` as straightforward orchestration below 200 lines.
- Preserve the exact synced-visible, synced-hidden, personal, loading, and not-found behavior, including success-only back navigation after hiding, uid/name unhide semantics, personal edit routing, calendar-name fallback, formatting, accessibility, and checklist mounting.
- Remove screen-level manual memoization only where the enabled React Compiler and focused tests demonstrate that it carries no semantic or measured performance requirement.
- Keep duplicate tags renderable. The generated `EventTag` contract has no identifier and does not establish name uniqueness, so the change will not introduce a name-only key; the remaining identity strategy will be documented and classified against React Doctor evidence.
- Add direct component coverage at the extracted boundaries and rerun React Doctor on the changed files, resolving the high-complexity finding and classifying every remaining diagnostic without suppression.
- Update the Calendar Architecture Book entry to describe the resulting thin event-details orchestration and focused UI ownership.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-event-details`: require maintainable, focused screen orchestration while preserving the existing unified synced/personal rendering and action contracts under direct branch coverage.

## Impact

- Primary code: `mobile/src/features/calendar/ui/event-details-screen.tsx` plus focused modules under the same `ui/` sublayer and their colocated tests.
- Existing seams remain authoritative: `calendar/data` for event details and formatters, `calendar-sources` for held-calendar names, `hidden-events/data` for visibility persistence, `event-checklists` for checklist UI, Settings for the display zone, and Expo Router for navigation.
- Documentation: `docs/mobile/architecture-book/calendar.md` receives a current-state update. No ADR is expected because this is a local, reversible decomposition that does not change dependency direction or product behavior.
- No new dependency, route, localization key, API/data model, migration, native configuration, store configuration, E2E label, or deployment action is expected.
- Sensitive surfaces touched: none. The OpenAPI contract, generated API client, server migrations, native/store/EAS/Firebase configuration, infrastructure, workflows, and legacy Flutter app remain unchanged.
