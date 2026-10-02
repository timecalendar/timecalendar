## Context

The behaviour already shipped in PR #446. The design and its decisions live in
`docs/projects/calendar-native-paging/` (D01, D02, D03, D05) and Architecture Book ADR 062. This
change only brings the specs and the book in line with the code.

## Decisions

- **Remove and add where scenario names encode the old pager.** OpenSpec keeps every existing
  scenario of a MODIFIED requirement, so a requirement whose scenario names prescribe three
  pages or the PagerView boundary is removed and added under a new name: the three-page working
  set (now "Calendar pages through a windowed native horizontal ScrollView"), the CI wiring
  proof, T05 civil-unit paging and the T09 page presentation. Every other affected requirement
  keeps its name and scenario titles and is modified in place, except "T02 commits one
  revisioned settled week context", which is renamed because revisions no longer exist.
- **Specs follow the code, not the plan.** Numbers come from the source: a window of 260 pages
  either side, a 30-page re-base margin, 2 mounted pages either side, 28-day chunks with ±1
  chunk of prefetch, at most 6 resident chunks and a 16-page presentation cache.
- **Checklist progress.** The window reader reads progress for every decoded timed event in the
  resident chunks, before page-level filtering. The checklist requirement now says filtered
  events produce no tile or progress node, rather than that their UIDs are absent from the query.
- **Historical requirements keep their ticket prefixes.** Requirement names such as "T05 …" stay
  as stable identifiers.

## Risks

- T09 (renderer tests and contract) and T08b (renderer source) run in parallel. If they change
  behaviour described here, they update these requirements in their own change.
