## 1. Point-domain and bounded-read semantics

- [ ] 1.1 Update the synced and personal row decoders so equal timed endpoints become accepted point facts, reversed timed ranges use the exhaustive allowlisted rejection reason, and date-only ranges still require a later exclusive end; verify with focused decoder tests for equal, reversed, missing, invalid, and valid sibling rows.
- [ ] 1.2 Update the synced/personal range repositories and shared `intersectsRange` predicate with the explicit point disjunction (`start >= from && start < to`) alongside the unchanged positive-interval half-open rule; verify SQL-shape and pure boundary tests at both range edges.
- [ ] 1.3 Replace the unsupported-instant classification with an explicit supported point/interval result while retaining date-only, spanning, and offset-transition exclusions; verify all classifier branches and midnight ownership.
- [ ] 1.4 Extend `TimedTileV1` and immutable presentation construction with point shape, localized display-title input, full semantic content, and resolved appearance fields while preserving original identity, chronological tie-breaks, and recursive freezing; verify presentation tests at 100% statements/branches.

## 2. Optional-content and privacy hardening

- [ ] 2.1 Make the shared event title optional after trimming and keep optional location/description/teacher/tag normalization total, element-wise, and non-mutating; verify malformed JSON, mixed arrays, blank/non-string fields, and valid siblings for both source kinds.
- [ ] 2.2 Harden rich synced/personal event-details mapping so malformed optional teachers/tags/text cannot reach rendering operations, while required identity/date facts and synced/personal action ownership remain unchanged; verify mapper and screen tests.
- [ ] 2.3 Narrow the Calendar rejection reporter to a static code, exhaustive allowlisted reason, integer count, and fixed subsystem tag, emitted once per reason/revision; verify sentinel strings from every malformed field are absent from serialized diagnostic calls and valid Maths remains published.

## 3. Localized complete event meaning

- [ ] 3.1 Add typed parity-checked `calendar.event.noTitle` translations with exact English `(No title)` and French `(Sans titre)` values and a pure display-title helper that resolves only at presentation time; verify helper and real-i18n catalog tests.
- [ ] 3.2 Apply the shared localized title rule to timeline, Agenda, retained Home summaries, and unified event details without writing fallback copy to storage; run each affected consumer suite and retain existing titled-event behavior.
- [ ] 3.3 Compose timeline accessibility names from full resolved title, full formatted time, optional full location, and checklist phrase exactly once while visual children remain hidden; verify normal, two-minute, point, missing-title, long-content, neighbour-page, and original-UID activation cases.

## 4. Deterministic event appearance

- [ ] 4.1 Replace alpha-string styling with pure sRGB parse/composite/luminance/contrast helpers and an immutable event appearance resolver for scheme and increased-contrast inputs, including deterministic rounding and the neutral invalid-color fallback; verify exact light/dark vectors and 100% statement/branch coverage.
- [ ] 4.2 Add exhaustive/representative property tests proving every resolver output is opaque and deterministic, foreground-to-surface contrast is at least 4.5:1, and the adjusted source-derived boundary cue is at least 3:1 against the active canvas.
- [ ] 4.3 Add the smallest calendar-owned runtime mapping from supported platform increased-contrast signals to the resolver input, including subscription cleanup and deterministic unsupported-platform fallback; verify the hook without creating a global accessibility abstraction.
- [ ] 4.4 Render resolved surface, foreground, accent, and increased-contrast outline explicitly in the owned tile, keeping imported colors out of theme tokens; verify light, dark, invalid-color, arbitrary-color, and increased-contrast renderer cases.

## 5. Tiny visual and interaction geometry

- [ ] 5.1 Add pure geometry helpers for exact positive-duration visual height, the centered 4dp point marker, and a separately clamped 44pt iOS / 48dp Android interaction rectangle over the 00:00–24:00 plane; verify noon, two-minute, zoom-bound, 00:00, and 24:00-edge tables at 100% statements/branches.
- [ ] 5.2 Refactor the owned canvas so the interaction wrapper owns the single `Pressable` and accessibility target while the interval block or point marker remains duration-faithful and non-accessible; verify platform minimum geometry, one semantic node, and original-UID routing.
- [ ] 5.3 Make constrained visual content title-first, showing location/checklist only when their complete line budget fits and allowing point markers to omit visual text without dropping semantics; verify narrow-width/short-height fixtures and unchanged normal-tile layout.
- [ ] 5.4 Prove vertical scroll, horizontal page, and pinch ownership cancel pending tiny-event presses through the existing native hierarchy, with no responder, second gesture owner, or accidental details navigation; retain the repository ownership contract.

## 6. Fixtures, current documentation, and focused proof

- [ ] 6.1 Add or extend fabricated fixtures with a noon point, two-minute event, missing title, long title/location, arbitrary and invalid colors, malformed optional arrays/content, missing/invalid/reversed required dates, and a valid Maths row; keep fixtures free of copied user content.
- [ ] 6.2 Update the Architecture Book Calendar, data, testing, and changelog current-state guidance for point membership, split visual/interactive geometry, title fallback, contrast policy, row isolation, and honest host-versus-T28 evidence; add no ADR unless implementation changes an approved boundary.
- [ ] 6.3 Extend `mobile/calendar-owned-shell.contract.test.ts` as the CI proof that the owned renderer retains one pager/scroll/gesture tree, point/tiny geometry comes from the new pure seams, the committed-page semantic target is singular, and no vendor/compatibility/network/sensitive-surface dependency appears.
- [ ] 6.4 Run every edited Jest suite by exact path, including decoder/events/range repositories/support/color/presentation/renderer/screen/details/Agenda/Home/i18n and the repository contract, and record exact commands/results against the tested commit.

## 7. Local-green and handoff evidence

- [ ] 7.1 From `mobile/`, run focused 100% coverage for every introduced pure decoder/range/color/geometry/presentation module, then `npm test -- --coverage`; record suite/test counts and thresholds without claiming device evidence.
- [ ] 7.2 From `mobile/`, run `npx tsc --noEmit`, `npm run lint`, scoped `npx prettier --check` over every edited source/test/catalog file, and `npm run react-doctor:changed`; resolve findings without suppression, timeout inflation, or gate weakening.
- [ ] 7.3 Run `npx openspec validate harden-tiny-calendar-events --strict`, the disclosure scan, and the established Maestro selector/harness static checks affected by fixture changes; do not add a fourth top-level journey or claim native execution on this host.
- [ ] 7.4 Record the exact tested head, fabricated fixture/reset instructions, aggregate-only diagnostic proof, all command outcomes, and outstanding T28 physical-device/accessibility checks in the implementation handoff; confirm no contract, migration, native/store/EAS, deploy/CI, legacy Flutter, or infrastructure surface changed.
