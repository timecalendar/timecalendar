## Why

PR #446 (calendar-native-paging E04 T08) made one windowed native horizontal `ScrollView` the
Calendar's paging owner and a screen-level `CalendarWindowStore` its read path. The main specs
still require a three-page `PagerView` working set, page generations, revisioned transitions and
a per-range live query, so they no longer describe the shipped Calendar.

## What Changes

- Replace the three-page working-set requirement with one requirement for the windowed native
  horizontal ScrollView: absolute `EpochDay`-based page indexes keyed `mode:epochDay`, a re-based
  content window, about five mounted pages, UI-thread settlement and no remount on crossings.
- Rewrite the PagerView boundary scenarios (callable page-scroll handler, recentring, idle
  settlement, recycled slots, generations and revisions) in terms of the scroll handler, settles
  and stale-event filtering. "No second pager" becomes no second horizontal pager or scroll owner.
- Describe each page's frozen `PagePresentationV1`, its explicit `loading | ready | error` status
  and the bounded chunk store in the T09 data requirements, the sync read-range requirement and
  the checklist-progress requirement.
- Record the paging owner in the Architecture Book: ADR 062, amendments to ADRs 019, 033 and 061,
  and `calendar.md`, `storage.md`, `data.md`, `testing.md`, `features.md` and `CHANGELOG.md`.
- Add superseded notes to the owned-calendar-renderer project (D04's PagerView clause, D05,
  `design.md`, tickets T05–T08).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-calendar-timeline`: windowed native horizontal paging replaces the three-page pager.
- `mobile-calendar-sync`: timeline reads are chunk-window reads; Agenda and Home keep range reads.
- `mobile-event-checklists`: timeline checklist progress is read with each chunk batch.
- `mobile-architecture-book`: the book records windowed native ScrollView paging.

## Impact

- Documentation and specs only. No runtime code, test, dependency, schema, native or CI change.
- Sensitive surfaces touched: none.
