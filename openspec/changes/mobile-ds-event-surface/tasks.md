# Tasks

Run commands in `mobile/` unless a task says otherwise. Decisions D1 to D12 are in `design.md`.
Await every RNTL 14 helper, use `usePlatform` (`@/test-support/platform`) for platform branches,
and use no fake timers. Use LSP `findReferences` before moving or deleting a symbol. Add no code
comment except a non-obvious why. Docs describe the current state only. Tests and specs name no
real person (the CI disclosure scan rejects it). Never build Android on the Mac. Land three
commits, following the design's Migration Plan.

## 0. Baseline

- [ ] 0.1 Record what the change must keep:
      `grep -rhoE 'id: *"?[A-Za-z0-9_${}.-]+' .maestro | sort -u > /tmp/maestro-ids.before`,
      `grep -rhoE 'tapOn: *"[^"]+"' .maestro | sort -u > /tmp/maestro-names.before`, and
      `grep -rhoE '(upcoming-card|today-tile|agenda-event|today-timeline-list|home-all-day)[A-Za-z0-9_${}.-]*' src --include=*.tsx | sort -u > /tmp/tile-ids.before`.
      Re-check that 076 is the next free ADR number: from the repo root run
      `git fetch origin main && git ls-tree --name-only origin/main docs/mobile/architecture-book/decisions/ | tail -3`,
      read the reservation note in `decisions/README.md`, and run `gh pr list --state open` then
      `gh pr diff <N> --name-only | grep decisions/` for each open mobile PR. Verify: the three
      files are non-empty and the ADR number is written down for group 6.

## 1. Theme resolver and contrast hook (D1, D8) — commit 1

- [ ] 1.1 Create `src/theme/event-appearance.ts` with `resolveEventAppearance`, `EventAppearance`,
      `EventAppearanceScheme` and `EventFallbackColor = "#64748B"`, moved from
      `features/calendar/data/event-color.ts` with identical outputs. Keep the Rgb helpers private.
      Export the four public names from `src/theme/index.ts`. Replace every
      `CALENDAR_EVENT_FALLBACK_COLOR` reference with `EventFallbackColor` and delete the old
      constant if nothing else uses it. Verify: `npx tsc --noEmit` passes.
- [ ] 1.2 Point `features/calendar/data/{page-presentation,timeline-presentation}.ts` and
      `page-presenter.test.ts` at `@/theme`. Drop the `event-color` re-exports from
      `features/calendar/data/index.ts`. Delete `event-color.ts`. Move `event-color.test.ts` to
      `src/theme/event-appearance.test.ts` and keep its deterministic vectors and color list
      unchanged; drop only the `eventSurfaceColor` assertion. Verify: `npx jest src/theme
      src/features/calendar/data` passes and
      `grep -rn "event-color\"" src` finds nothing.
- [ ] 1.3 Add the D8 contrast tests to `event-appearance.test.ts`:
      - palette: `SWATCH_PRESETS` (imported from `@/features/personal-events/ui/color-swatch-presets`)
        plus `EventFallbackColor`, × `light`/`dark` × increased contrast off/on;
      - floors: foreground on surface ≥ 4.5, accent on the canvas (`#FFFFFF` / `#000000`) ≥ 3,
        every output `/^#[0-9A-F]{6}$/`;
      - a second `it.each` over the 216-color grid (`00 33 66 99 CC FF` per channel) with the
        same floors.

      Each case title names the color, scheme and policy. Verify: `npx jest src/theme/event-appearance
      --coverage --collectCoverageFrom='src/theme/event-appearance.ts'` shows ≥ 90% branches, and
      lowering the light alpha from 0.35 to 0.9 locally makes a palette case fail (revert).
- [ ] 1.4 Move `features/calendar/data/use-increased-contrast{,.test}.ts` to
      `src/hooks/use-increased-contrast{,.test}.ts`, renaming the hook to `useIncreasedContrast`.
      Update `page-presenter.ts` and every test mock of the old path
      (`grep -rn "use-increased-contrast\|useCalendarIncreasedContrast" src`). Verify: the grep
      shows only the new path and name, and `npx jest src/hooks src/features/calendar` passes.
- [ ] 1.5 Commit 1: `npx tsc --noEmit`, `npm run lint` and `npm test` pass. The week grid's
      rendered colors are unchanged (`page-presenter.test.ts` vectors pass unedited apart from the
      import path).

## 2. Primitive (D2–D5, D10, D11) — commit 2

- [ ] 2.1 `src/design/event-surface/event-surface-context.ts`: `EventSurfaceContext`
      (`EventAppearance | undefined`) and `useEventSurfaceAppearance()`. It imports only `react`
      and `@/theme` types. Add `event-surface-context.test.ts` (undefined outside, the value
      inside a provider). Verify: `npx jest src/design/event-surface/event-surface-context` passes.
- [ ] 2.2 `src/design/event-surface/event-surface.tsx`: export `EventSurface`,
      `EventSurfaceText`, `EventSurfaceProps`, `EventSurfaceTextProps`, `EventSurfacePlacement`,
      `EventSurfaceDensity` and `EventSurfaceLayoutStyle`, per D3 and D4. It reads the scheme from
      `@/hooks/use-color-scheme` and the signal from `@/hooks/use-increased-contrast`, and imports
      `@/design/text/themed-text` by path, never the barrel. `accessibilityLabel` and
      `EventSurfaceText`'s `numberOfLines` are required. Use `StyleSheet.flatten` for the
      `Pressable` style function result (no style arrays reach a `Link`/native child). Verify:
      `npx tsc --noEmit` passes and `npx eslint src/design/event-surface` is clean.
- [ ] 2.3 `event-surface.test.tsx` per D11 on iOS and Android. Verify:
      `npx jest src/design/event-surface --coverage --collectCoverageFrom='src/design/event-surface/*.{ts,tsx}' --collectCoverageFrom='!**/*.gallery.tsx'`
      shows ≥ 90% branches on both modules.
- [ ] 2.4 `src/design/badge/badge.tsx`: add tone `onEventSurface` (D6), reading
      `useEventSurfaceAppearance()` from `@/design/event-surface/event-surface-context` and throwing
      outside a surface. Extend `badge.test.tsx` (inside: outline and label in the foreground, per
      scheme; outside: throws). Add an `onEventSurface` row to `badge.gallery.tsx` `Tones`, rendered
      inside an `EventSurface`. Verify: `npx jest src/design/badge src/design/import-graph.contract`
      passes (no cycle).
- [ ] 2.5 Export the new names from `src/design/index.ts` in alphabetical position. Add
      `"src/design/event-surface/event-surface.tsx"` and
      `"src/design/event-surface/event-surface-context.ts"` at `{ lines: 90, branches: 90 }` to
      `jest.config.js` `coverageThreshold`. Add a row for `src/design/event-surface/event-surface.tsx`
      to `tools/eslint-rules/design-import-policy.test.js` (barrel false, deep true, gallery false).
      Verify: `npx jest src/design/import-graph.contract src/design/gallery/fixture-coverage.contract tools/eslint-rules/design-import-policy`
      passes.
- [ ] 2.6 Gallery per D10: `event-surface.gallery.tsx` (`id: "event-surface"`, stories `Palette`,
      `Placements`, `IncreasedContrast`, `Checklist`, `LongStrings`) and
      `event-surface.gallery.test.tsx` (renders every story on iOS and Android; asserts the local
      palette equals `[...SWATCH_PRESETS, EventFallbackColor]`; asserts each tile is one button
      with its label). Register it in `src/design/gallery/registry.ts` after `colorDot`. Add
      `gallery.eventSurface.*` keys to `src/i18n/locales/en.json` and `fr.json`; the `LongStrings`
      FR title is the longest title string in either file for that story. Verify:
      `npx jest src/design/gallery src/design/event-surface src/i18n` passes, and
      `git diff main -- src/design/gallery/known-a11y-violations.ts` is empty.

## 3. Checklist indicator and call sites (D6, D7) — commit 2

- [ ] 3.1 `features/event-checklists/ui/checklist-progress-indicator.tsx`: inside a surface
      (`useEventSurfaceAppearance()` defined), `inline` renders `Badge tone="onEventSurface"` and
      `compact` draws border, glyph and count in `appearance.foreground`; outside, unchanged.
      Extend `checklist-progress-indicator.test.tsx` for both variants inside and outside a surface.
      Verify: `npx jest src/features/event-checklists` passes.
- [ ] 3.2 `features/home/ui/upcoming-scroller.tsx`: the card is
      `EventSurface placement="flow" density="regular"` with `style={{ width: CARD_WIDTH }}`,
      `testID`, label, hint and `onPress` unchanged; lines per the D7 table via `EventSurfaceText`.
      Delete the local `card` background, radius, padding, min-height and `iosPressed` styles.
- [ ] 3.3 `features/home/ui/home-screen/today-section.tsx`: each all-day item is
      `EventSurface placement="flow" density="compact"`; title per D7. Delete `allDayEvent`'s
      paint and `iosPressed`.
- [ ] 3.4 `features/home/ui/today-timeline.tsx`: the positioned tile is
      `EventSurface placement="absolute" density="compact"` with `style={{ top, left, width, height }}`;
      the reflowed tile is `placement="flow" density="compact"`. Lines per D7 (the reflowed title
      and location gain caps 3 and 2). Delete `tile`/`reflowedEvent` paint, `iosPressed` and the
      `MIN_TARGET_SIZE` constant if unused.
- [ ] 3.5 Delete `features/home/ui/event-surface.ts`; remove its imports and the now-unused
      `useColorScheme` imports from the Home files. Verify: `grep -rn "eventSurfaceColor" src` finds
      nothing, and `npx jest src/features/home` passes with assertions added for one card, one
      all-day item and one timeline tile: testID, label and hint unchanged, leading border 3 in the
      resolved accent for the scheme, text color the resolved foreground.
- [ ] 3.6 `features/calendar/ui/agenda-list.tsx`: the tile is
      `EventSurface placement="flow" density="regular"` with `style={{ flex: 1 }}`, keeping the
      `agenda-event-<id>[-progress-<c>-<t>]` testID and the `calendar.agenda.event.openLabel*`
      label. Delete the `backgroundColor`/`borderLeftColor`/`shadowColor` inline object and the
      `tile` style's padding, radius, border and shadow keys (and its comment). Keep `row` and
      `indicatorColumn`. Verify: `npx jest src/features/calendar/ui` passes, with an assertion that
      an agenda tile has no `shadowOpacity`/`elevation`, no `backgroundElement` fill, and the
      resolved accent stripe.

## 4. Lint (D9) — commit 2

- [ ] 4.1 `tools/eslint-rules/no-raw-event-color.js`: extend the key set to the eight keys in D9
      and add the `CallExpression` check with message id `eventAppearanceCall`. Update the header
      comment's rationale and remaining-blind-spot sentence and link ADR 076. Update
      `no-raw-event-color.test.js` per D9 (new invalid cases, `borderLeftColor: theme.primary`
      valid, `eventSurfaceColor(...)` valid case replaced by `mix(event.color)`). Verify:
      `npx jest tools/eslint-rules/no-raw-event-color` passes.
- [ ] 4.2 Keep `raw-event-color-allowlist.js` at one entry and `RAW_EVENT_COLOR_ALLOWLIST_CEILING = 1`;
      update the `timecalendar/raw-event-color` block comment in `eslint.config.js` to name
      `EventSurface` and ADR 076. Verify: `npx jest tools/eslint-rules` passes and `npm run lint`
      passes with zero warnings.
- [ ] 4.3 Inject-and-revert proof (record the output for the PR):
      (a) put `borderLeftColor: event.color` back into `agenda-list.tsx`: `npm run lint` fails with
      `local/no-raw-event-color`;
      (b) add `const a = resolveEventAppearance({ color: event.color, scheme: "light", increasedContrast: false })`
      to `upcoming-scroller.tsx`: lint fails with `eventAppearanceCall`;
      (c) add `agenda-list.tsx` to the allowlist: the allowlist test fails (stale entry, over
      ceiling);
      (d) render `<EventSurfaceText>` without `numberOfLines` and `<EventSurface>` without
      `accessibilityLabel` in a test file: `npx tsc --noEmit` fails.
      Revert all four. Verify: `git status` shows no change in those files afterwards.
- [ ] 4.4 Selector check: re-run the 0.1 greps into `/tmp/*.after` and `diff` each pair. Verify:
      the three diffs are empty and `npx jest e2e/maestro-selectors` passes.

## 5. CI proof — commit 2

- [ ] 5.1 The CI proof for the runtime behavior is the Jest suite gated by `test-mobile`:
      `event-appearance.test.ts` (palette and grid contrast floors), `event-surface.test.tsx`
      (appearance, one element, capped text), `badge.test.tsx` (`onEventSurface`),
      `checklist-progress-indicator.test.tsx`, the Home and agenda suites, the registry matrix and
      the lint rule suites. Verify: after push, the PR's `test-mobile` job
      (`.github/workflows/ci-mobile.yml`) is green and its log lists `event-appearance.test.ts`,
      `event-surface.test.tsx` and `no-raw-event-color.test.js`; the timezone matrix legs are green.

## 6. Architecture Book, ADR and docs (`docs/mobile/architecture-book/`) — commit 3

- [ ] 6.1 Create `decisions/076-event-surface.md` from `TEMPLATE.md` (number from 0.1), status
      Accepted, per D12: Context (three vocabularies, the 3.28–4.51:1 Home text, the agenda shadow,
      the owner decision), Decision (D1–D4, D6, D9 and the event-tile exception), Rejected,
      Consequences (event details stays allowlisted for 5.8; the grid's compact pill keeps status
      tones on its tint until 5.11; the inbox device pass), Revisit if. Add the index row to
      `decisions/README.md`. In ADR 074's "Revisit if", the `EventSurface` trigger stays as written;
      ADR 076 answers it. Verify: from the repo root, `rg -n "076" docs/mobile/architecture-book`
      shows the index row and every link.
- [ ] 6.2 `theming.md`:
      - Under "Do not add a colored leading rail…", add the event-tile exception: an event tile's
        stripe is its resolved accent, drawn only by `EventSurface` or the week-grid renderer
        (`local/no-raw-event-color`, ADR 076).
      - In "Prefer color that comes from the content", say Home and agenda tiles are
        `EventSurface` (tint and stripe).
      - Add `## Event tiles — EventSurface (src/design/event-surface/)` after "Badges and color
        dots": anatomy, placement, density, `EventSurfaceText`, the `onEventSurface` badge tone,
        the gates (contrast test, 90% tiers, lint, gallery story ids) and the deferrals (5.8,
        5.9, 5.11).
      - In the token/role list, name `resolveEventAppearance` in `src/theme/event-appearance.ts`.

      Verify: `rg -n "EventSurface|event-appearance|ADR 076|076-event-surface" docs/mobile/architecture-book/theming.md`
      shows each.
- [ ] 6.3 `accessibility.md`: add `## Event tiles — encoded in EventSurface` (one element, the
      required label from the existing builders, title-first names for Maestro, foreground text at
      4.5:1 proven by test, type-required line caps, no shrink-to-fit). Link the inbox note.
      Verify: the section exists and every link resolves.
- [ ] 6.4 `lint-format.md`: rewrite the `local/no-raw-event-color` entry for the eight keys, the
      resolver-call check and its message, the unchanged allowlist at ceiling 1, the remaining
      caveats (variables, arbitrary helpers, `color=` props, `.ts` files outside `files`), and the
      4.3 proof. Remove the per-side-border caveat. Verify:
      `rg -n "borderLeftColor|eventAppearanceCall" docs/mobile/architecture-book/lint-format.md`
      shows both.
- [ ] 6.5 `calendar.md`: the appearance paragraph says imported colors pass through the theme
      layer's resolver (`@/theme`), shared with `EventSurface`, and the high-text-contrast signal is
      `useIncreasedContrast` in `src/hooks/`. Verify: `rg -n "Calendar-owned deterministic" docs/mobile/architecture-book/calendar.md`
      finds nothing.
- [ ] 6.6 Update the rest:
      - `features.md`: the gallery registry table gets an `event-surface` row; Home (cards,
        all-day items, timeline tiles as `EventSurface`), Calendar (agenda tiles as
        `EventSurface`, no shadow) and Event checklists (surface-aware pills).
      - `testing.md`: the 90% tiers for the two event-surface modules and the palette and grid
        contrast test.
      - `architecture.md`: add `event-surface/` to the design family list.

      Verify: `rg -n "EventSurface|event-surface" docs/mobile/architecture-book/{features,testing,architecture}.md`
      covers each file.
- [ ] 6.7 `CHANGELOG.md`: add `## 2026-10-26 — Event surface` at the top, with bullets for the
      primitive and the event-tile exception (theming.md, ADR 076), the theme-owned resolver and
      shared hook (theming.md, calendar.md), the accessibility contract (accessibility.md), the lint
      extension at ceiling 1 (lint-format.md), and the migrated sites (features.md). Leave earlier
      entries as they are. Verify: the entry is first and every link resolves.
- [ ] 6.8 Outside the Book: `docs/react-native-migration/inbox/2026-10-26-mobile-ds-event-surface-device-pass.md`
      exists (written at planning). Update its story ids if they changed. Mark the 3.9 row done in
      `docs/mobile/design-system-audit/migration-roadmap.md` only if earlier slices are marked
      there (follow the file's convention). Verify: every story id the note names is produced by
      `src/design/gallery/stories.ts`.

## 7. Verification

- [ ] 7.1 `npx tsc --noEmit` passes.
- [ ] 7.2 `npm run lint` passes with zero warnings.
- [ ] 7.3 `npm test -- --coverage` passes, including the 90% per-file tiers (`src/theme/**`,
      `src/hooks/**`, the two event-surface modules, `badge.tsx`), the registry matrix with an
      unchanged known-violation list, `tools/eslint-rules`, the design import-policy and
      import-graph contracts, FR/EN parity and `e2e/maestro-selectors.test.ts`. Record the suite and
      test counts for the PR.
- [ ] 7.4 Timezone legs: `TZ=Pacific/Kiritimati npm test`, `TZ=Pacific/Pago_Pago npm test` and
      `TZ=America/St_Johns npm test` (or `npm run test:timezones`) each pass.
- [ ] 7.5 From the repo root, `openspec validate mobile-ds-event-surface` passes. Grep the change
      folder, the new tests and the inbox note for developer or account names. Verify: none found.

## 8. Device verification

- [ ] 8.1 iOS simulator pass (run by the conductor): each
      `timecalendar-dev://developer/gallery/event-surface--<story>` in light and dark at the default
      size and at accessibility-extra-extra-extra-large; then Home (upcoming cards, all-day items,
      timeline and its large-text reflow) and Calendar → Agenda with seeded events of several
      colors. Check: the straight 3-unit stripe, 8-unit corners, no agenda shadow, black/white text,
      no clipped trailing word, VoiceOver reads one element per tile with the title first, and the
      grid and agenda colors match for one event. Verify: screenshots recorded for the PR.
- [ ] 8.2 Android device, TalkBack and high-text-contrast pass (HUMAN: see inbox/2026-10-26-mobile-ds-event-surface-device-pass.md).
      Skip and continue; this does not block the PR.
