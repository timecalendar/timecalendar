## Why

The owned Calendar can page and scroll a complete week, but students cannot yet choose a one-day timeline and the current view choice is lost on restart. T05 adds the smallest coherent day/week control while retaining the settled date and visible clock position through every switch.

## What Changes

- Add a distinct one-day geometry to the existing owned renderer while retaining one native vertical scroll owner, one native pager, three mounted pages, the pinned header projection, automatic insets, and no alternate renderer.
- Make paging and settlement mode-aware: day pages move by one display-zone civil date, week pages move by one complete Monday-first civil week, and day paging continues through Saturday and Sunday even when Show weekends is off.
- Switch day to week at the containing launch week and week to day at that week's first day, preserving the settled vertical clock offset and invalidating callbacks from any partial or stale page transition.
- Add Day to both platform view menus, make headers, previous/next accessibility actions, and one-settlement announcements describe the selected mode, and keep Today and one-shot `focusDate` coherent with day mode within their existing bounded behavior.
- Persist the validated day/week/agenda view choice per installation through the settings and storage seams. Missing or corrupt values recover to week, backend reset preserves the choice, and a fresh process derives today's day or containing week instead of restoring a prior date or clock offset.
- Keep Agenda and event-details access unchanged; bidirectional Agenda active-date transfer, fresh current-time scrolling, full Today/deep-link intent semantics, zoom, events, and direct date selection remain later slices.
- Update current Calendar, settings/storage, testing and feature-map guidance, record the Architecture Book change, and add revision-bound automated and owner-device verification for the T05 checklist.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-calendar-timeline`: Add owned day geometry, mode-aware civil paging and settlement, predictable day/week date transfer, mode-specific headers/accessibility, and preserved vertical clock position.
- `mobile-settings-prefs`: Add a total, reactive, persisted Calendar view preference whose missing or invalid value defaults to week.
- `mobile-storage`: Classify the Calendar view key as environment-independent so backend reset preserves the per-installation choice.

## Impact

- Runtime code: `mobile/src/features/calendar/data/`, `mobile/src/features/calendar/renderer/`, Calendar screen/controller and platform view menus, settings preferences, storage inventory, and FR/EN resources.
- Tests: pure transition tables, renderer/coordinator settlement and geometry, Calendar screen/menu integration, preference and reset persistence, localization parity, and `mobile/calendar-owned-shell.contract.test.ts`; retain the three existing native journeys and add only bounded proof where their shared Calendar interaction can safely cover the switch.
- Documentation: Calendar, settings/storage, testing and feature-map Architecture Book pages plus changelog and a T05 owner-device evidence note.
- Sensitive surfaces: none. No API/generated client, database schema or migration, native/store configuration, deployment/CI workflow, dependency, or legacy Flutter change is expected.
