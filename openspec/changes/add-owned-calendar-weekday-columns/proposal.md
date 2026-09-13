## Why

The owned Calendar can page and vertically scroll an empty week, but its grid still has no dated day columns and cannot distinguish the days a student is reading. T04 completes the first empty-week milestone with localized Monday-to-Sunday headers and a persistent, default-on weekend visibility preference.

## What Changes

- Derive a complete launch week as seven display-zone civil dates from the explicit first-weekday policy, then filter Saturday and Sunday by weekday identity only for week presentation.
- Render five or seven equal-width, aligned day columns beneath the existing native month/year title, with localized weekday/date labels and a non-color Today cue.
- Add a default-true `Show weekends` switch to the Calendar section of Settings and persist it through the existing typed MMKV settings seam.
- Feed the reactive preference into every previous/current/next owned week page while retaining seven-calendar-day paging, the bounded three-page working set, revisioned settlement, vertical scroll position, and unchanged Agenda range/content.
- Add focused civil-week, formatting, preference, renderer, Settings, Calendar-screen, repository-contract, localization, and regression verification, plus revision-bound owner-device evidence.
- Update current Calendar, Settings/storage, and feature-map Architecture Book guidance and its changelog for the T04 contract.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-calendar-timeline`: Replace the T03 undivided empty clock plane with dated five/seven-day week columns and a persistent weekend-visibility setting while preserving seven-day paging and Agenda behavior.

## Impact

- Affected runtime modules: pure Calendar week/day helpers and formatting exports, `mobile/src/features/calendar/renderer/owned-calendar-shell.tsx`, Calendar screen wiring, the typed Settings preference store/hooks, and the existing Settings hub.
- Affected tests and harnesses: Calendar data/renderer/screen suites, Settings preference/hub suites, storage classification tests, localization catalogs, `mobile/calendar-owned-shell.contract.test.ts`, and the established Maestro selector/harness contracts.
- Affected documentation: Calendar and settings/storage current-state Architecture Book pages, feature map, changelog, and a T04 owner-device evidence note.
- Existing React Native, date-fns/date-fns-tz, Expo Localization, MMKV, and PagerView seams are sufficient. No dependency, API/generated client, database schema or migration, native/store configuration, deployment/CI configuration, or legacy Flutter change is expected.
