## 1. Specs

- [x] 1.1 Write the `mobile-calendar-timeline` delta: add the windowed native horizontal
      ScrollView requirement, remove the three-page working set, rename the revisioned settle
      requirement, and modify every requirement that prescribes PagerView, three pages,
      recycled slots, generations or revisioned transitions.
- [x] 1.2 Write the `mobile-calendar-sync`, `mobile-event-checklists` and
      `mobile-architecture-book` deltas.
- [x] 1.3 Run `openspec validate record-windowed-native-calendar-paging --strict`.

## 2. Architecture Book

- [x] 2.1 Add ADR 062 and its index row; point ADRs 019, 033 and 061 at it.
- [x] 2.2 Update `calendar.md`, `storage.md`, `data.md`, `testing.md` and `features.md` to the
      current paging owner and read path.
- [x] 2.3 Add a dated `CHANGELOG.md` entry.

## 3. Project records

- [x] 3.1 Add superseded notes to owned-calendar-renderer D04 (PagerView clause), D05,
      `design.md` and E02 tickets T05–T08.
- [x] 3.2 Set calendar-native-paging T10 to `status: done`.

## 4. Verify and archive

- [x] 4.1 Confirm `grep -ri "three-page\|PagerView" docs/mobile openspec/specs` returns only
      onboarding, historical or superseded mentions.
- [x] 4.2 Archive the change into the main specs and validate the touched specs.
