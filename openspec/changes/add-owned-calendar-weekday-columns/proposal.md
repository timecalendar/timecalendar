## Why

The owned Calendar now has dated five/seven-day columns and a synchronized pinned header, but the exact-head mobile gate rejects the renderer's React Native `Animated`, giant-component, and manual-memoization diagnostics. T04 cannot return to owner QA until that implementation is reshaped around the installed Reanimated/PagerView seam without changing its visible behavior.

## What Changes

- Derive a complete launch week as seven display-zone civil dates from the explicit first-weekday policy, then filter Saturday and Sunday by weekday identity only for week presentation.
- Render five or seven equal-width, aligned day columns beneath the existing native month/year title, with localized weekday/date labels and a non-color Today cue; the vertically pinned date strip follows the existing native pager's horizontal progress so headers and grid move as one surface.
- Add a default-true `Show weekends` switch to the Calendar section of Settings and persist it through the existing typed MMKV settings seam.
- Feed the reactive preference into every previous/current/next owned week page and header slot while retaining seven-calendar-day paging, the bounded three-page working set, one native gesture owner, revisioned settlement, vertical scroll position, and unchanged Agenda range/content.
- Replace the React Native `Animated.event` bridge with PagerView's documented Reanimated event-handler pattern so `onPageScroll` remains callable while native position/offset drive the pinned header on the UI thread.
- Split the renderer coordinator, motion lifecycle, pinned header, pager canvas, and grid presentation into bounded feature-private units, and rely on the enabled React Compiler instead of the six flagged manual memoization sites.
- Add focused civil-week, formatting, preference, renderer, Settings, Calendar-screen, repository-contract, localization, and regression verification, plus revision-bound owner-device evidence.
- Update current Calendar, Settings/storage, and feature-map Architecture Book guidance and its changelog for the T04 contract, including the Reanimated pager-progress seam.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-calendar-timeline`: Keep the dated five/seven-day behavior while requiring a callable, UI-thread Reanimated pager-progress projection and a changed-code-clean renderer structure.

## Impact

- Affected runtime modules: feature-private files under `mobile/src/features/calendar/renderer/`; the already implemented Calendar, Settings, and storage behavior remains unchanged.
- Affected tests and harnesses: focused renderer tests, PagerView/Reanimated Jest setup only if the supported package mock needs a narrower observable, `mobile/calendar-owned-shell.contract.test.ts`, and the existing retained Calendar regressions.
- Affected documentation: Calendar and settings/storage current-state Architecture Book pages, feature map, changelog, and a T04 owner-device evidence note.
- Existing React Compiler, Reanimated, React Native, date-fns/date-fns-tz, Expo Localization, MMKV, and PagerView seams are sufficient. No dependency, API/generated client, database schema or migration, native/store configuration, deployment/CI configuration, workflow, or legacy Flutter change is expected.
