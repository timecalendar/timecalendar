## 1. Delete the spike

- [x] 1.1 Delete `mobile/src/app/dev-paging-spike.tsx` and the whole `mobile/src/features/paging-spike/`
      directory (`ui/`, `data/` including `spike-fixtures.test.ts`, `index.ts`). Verify:
      `grep -rn "paging-spike" mobile/src` returns only the two lines handled in 1.2 and 1.3.
- [x] 1.2 In `mobile/src/app/_layout.tsx`, remove the `dev-paging-spike` `Stack.Screen` and the E02
      comment above it; leave the `dev-import` registration and its comment untouched. Verify:
      `grep -n "dev-paging-spike" mobile/src/app/_layout.tsx` returns nothing.
- [x] 1.3 In `mobile/src/components/settings-route-structure.test.ts`, remove `"dev-paging-spike"`
      from the `headerShown: false` loop list and from the `headerlessRoutes` set. Verify:
      `cd mobile && npx jest src/components/settings-route-structure.test.ts` passes, proving the
      registrations equal the discovered routes and the headerless set is exactly `(tabs)`,
      `onboarding`, `profile`, `more`, `dev-import`, `calendar-import-result`.

## 2. Architecture Book and evidence docs

- [x] 2.1 In `docs/mobile/architecture-book/navigation.md`, drop `dev-paging-spike` from the
      headerless exceptions sentence (`(tabs)`, `onboarding`, `profile`, `more`, `dev-import` and
      `calendar-import-result`) and delete the `/dev-paging-spike` paragraph. Describe the current
      state only, no history narration. Verify: `grep -n "paging" docs/mobile/architecture-book/navigation.md`
      returns nothing spike-related.
- [x] 2.2 In `docs/mobile/architecture-book/features.md`, delete the `paging-spike` table row; keep
      the table's column alignment valid Markdown. Verify: `grep -n "paging-spike" docs/mobile/architecture-book/features.md` returns nothing.
- [x] 2.3 Add a newest-first `## 2026-10-25 — Calendar paging spike removed` entry at the top of
      `docs/mobile/architecture-book/CHANGELOG.md`: the `paging-spike` feature and `/dev-paging-spike`
      route are gone; the headerless root set is `(tabs)`, `onboarding`, `profile`, `more`,
      `dev-import`, `calendar-import-result`, enforced by `settings-route-structure.test.ts`; E02
      evidence stays in `docs/perf/E02-spike-evidence.md` and `mobile/perf/samples/spike-d5038fad-*`
      (navigation.md, features.md). Older CHANGELOG entries stay as written.
- [x] 2.4 In `mobile/perf/README.md`, reword the `spike-d5038fad-*` entry so it describes the samples
      as captured from the E02 paging spike at `d5038fad` over fixture weeks (Android
      `snapToInterval`, `pagingEnabled`, ±8 pages), without presenting `/dev-paging-spike` as a
      route; keep the pointer to `docs/perf/E02-spike-evidence.md`. Do not touch
      `mobile/perf/samples/*`.
- [x] 2.5 Leave ADRs 005, 019, 062, `docs/perf/*`, `docs/projects/*` and
      `docs/mobile/releases/06-calendar-paging-gate.md` unedited. Verify:
      `git diff --stat origin/main -- docs/mobile/architecture-book/decisions docs/perf docs/projects docs/mobile/releases`
      is empty.

## 3. Local verification

- [x] 3.1 `cd mobile && npx tsc --noEmit` exits 0.
- [x] 3.2 `cd mobile && npm run lint` exits 0 with zero warnings.
- [x] 3.3 `cd mobile && npm test -- --coverage` passes, including the per-file coverage gate.
- [x] 3.4 Sweep: `grep -rln "paging-spike" . --exclude-dir=node_modules --exclude-dir=.git` lists only
      `openspec/changes/**`, the CHANGELOG (new and historical entries), `docs/perf/*`,
      `docs/projects/*` and `mobile/perf/samples/spike-d5038fad-*`.
- [x] 3.5 `openspec validate remove-mobile-paging-spike --strict` passes. Review
      `git diff origin/main...HEAD`: only the deleted spike files, `_layout.tsx`, the route-structure
      test, `navigation.md`, `features.md`, `CHANGELOG.md`, `mobile/perf/README.md` and this change
      differ. No new human-only step, so no inbox note.
