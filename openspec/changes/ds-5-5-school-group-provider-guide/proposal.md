# School picker, group picker, provider selection and guide page on the design system (DS 5.5)

## Why

Roadmap slice 5.5 (`docs/mobile/design-system-audit/migration-roadmap.md:78`) is the last
onboarding-adjacent screen group still off the design system. Slices 3.3, 3.6 and 3.8 already moved
the school picker and provider selection to `ListRow`, `StatusView` and `useHeaderActions`. What is
left is the residue the ratchets still allowlist: the school-group Confirm built from a raw
`Pressable` (`raw-button-allowlist.js:10`), the school logo's typography literal
(`style-literal-allowlist.js:53-56`), its scheme read and hairline ring, `smallBold` tree rows with
44/48 literals, `themeColor` on the guide page and image, and two in-body titles that compete with
the native title (the guide page's `type="title"` heading and provider selection's `PageIntro`
title). The guide page also fails on preprod with "We couldn't load the export guide"; reading the
code and probing preprod read-only shows two causes, one of them in the app.

## What Changes

- **School picker**: the school logo becomes the new `@/design` `Thumbnail` primitive (scheme-aware
  source, logo chip with separator ring, monogram fallback in `onPrimarySoft`, decorative, fixed
  size). `school-logo.tsx` is deleted, which removes the last 5.5 row from the style-literal
  allowlist. Row, separators, status views, search and header Back stay as they are.
- **Group picker** (dormant, deep-link only): tree rows become `ListRow`s inside `ListSection`s;
  leaves keep the selected toggle, branches use a new `ListRow` `expanded` disclosure state; Confirm
  becomes `Button variant="filled"`. Behaviour, testIDs, labels and translation keys stay the same.
  The file leaves the raw-button allowlist.
- **`ListRow`** gains `expanded?: boolean`: a disclosure glyph (iOS `chevron.down`/`chevron.right`,
  Android `expand_less`/`expand_more`) and the `expanded` accessibility state. The type makes it
  exclusive with `selected` and `trailing="chevron"`.
- **Provider selection**: the in-body `PageIntro` title is removed; the native title stays the route
  heading and the caption stays. Provider thumbnails use `Thumbnail`.
- **`PageIntro`** loses its `title` prop (**BREAKING** for the design API, R-1): the rule "the native
  title is the route heading" becomes a `tsc` error instead of prose. Gallery fixtures and the
  `root-page` test follow; unused translation keys are deleted.
- **Guide page**: the in-body `type="title"` page heading is removed; the page's title becomes the
  native Stack title while the page is shown. Programmatic focus moves to a progress caption whose
  accessible name is "<page title>, Page n of N". `themeColor` becomes `tone` on the page and in
  `ExportGuideImage`.
- **Export guide on preprod** (investigation result, see design D8):
  - Root cause 1 (backend config, not app): `GET /v1/export-guides` answers **503 "Export guide
    catalogue unavailable"** on preprod and production because the `export-guides-v1` feature flag
    evaluates to `false` there (`GET /feature-flags/evaluate?keys=export-guides-v1` →
    `{"export-guides-v1":false}`); the server gates on it at
    `server/src/modules/export-guide/services/export-guide.service.ts:42-53`. The guide-assets are
    also missing from the preprod and production buckets (HTTP 403 on the asset key, 200 on the dev
    bucket). Both are owner actions: inbox note.
  - Root cause 2 (app bug, fixed here): the client accepts guide images only from the dev bucket
    (`mobile/src/features/export-guides/data/constants.ts:5-7`, enforced at
    `parser.ts:89-102`), while preprod and production serve from
    `timecalendar-preprod-public` and `timecalendar-public`. Once the flag is on, every image
    declaration would fail and the whole catalogue would block. The compiled allow-list gains the
    two first-party origins.
  - The blocking error already renders `StatusView` with Retry and Back (`guide-status.tsx:19-48`);
    that stays.
- **Ratchets**: `school-group-picker-screen.tsx` leaves `raw-button-allowlist.js` (ceiling 5 → 4);
  `school-logo.tsx` leaves `style-literal-allowlist.js` (`typographyLiteral` ceiling 7 → 6). No
  other allowlist lists a 5.5 file.
- **Migrated-screen contract**: eleven 5.5 files appended under slice `"5.5"`;
  `MIGRATED_FILE_FLOOR` 23 → 34.
- **Architecture Book**: `theming.md` (Thumbnail, `ListRow` disclosure, `PageIntro` caption-only),
  `accessibility.md` (guide-page focus target), `features.md`, `lint-format.md` (ratchet rows),
  new ADR for `Thumbnail`, dated `CHANGELOG.md` entry 2026-10-27.

## Capabilities

### New Capabilities

- `mobile-design-system-thumbnail`: the `Thumbnail` primitive: scheme-aware image source, chip and
  ring, monogram fallback, failure reset on source change, decorative semantics, gallery fixtures.

### Modified Capabilities

- `mobile-design-system-list-row`: a row can carry an `expanded` disclosure state, announced and
  drawn per platform.
- `mobile-root-page-primitives`: `PageIntro` is caption-only.
- `mobile-school-selection`: the dormant group step may change presentation to design-system
  primitives while its behaviour, selectors, labels and keys stay fixed; school logos follow the
  `Thumbnail` contract.
- `mobile-export-guide-journey`: the guide page's title is the native title; focus lands on the
  progress caption; provider selection has no in-body title.
- `mobile-export-guide-data`: the compiled image-origin allow-list names the three first-party
  public buckets.
- `mobile-design-system-layer`: the migrated-screen contract lists the 5.5 files.

## Impact

- Code: `mobile/src/design/{thumbnail/*,list/list-row.tsx,list/list-row.gallery.tsx,layout/root-page.tsx,layout/root-page.gallery.tsx,layout/keyboard-safe-action-layout.gallery.tsx,icon/icon-glyphs.ts,index.ts,gallery/registry.ts,screen-migration.contract.test.ts}`,
  `mobile/src/features/school-selection/ui/*`, `mobile/src/features/export-guides/ui/*`,
  `mobile/src/features/export-guides/data/{constants,parser.test}.ts`,
  `mobile/src/app/onboarding/{school,groups}.tsx` and `export-guide/*.tsx` (comments only),
  `mobile/src/i18n/locales/{en,fr}.json` (key deletions), `mobile/tools/eslint-rules/{raw-button,style-literal}-allowlist{,.test}.js`.
- Not touched: Activity, changelog and changelog sheet (slice 5.4, parallel change). The server and
  its feature-flag data are not changed.
- No dependency or native change. Maestro selectors (`export-guide-page`, `export-guide-next`,
  `onboarding-import-url`, the school name text) stay.
- Docs: `docs/mobile/architecture-book/{theming,accessibility,features,lint-format,CHANGELOG}.md`,
  `decisions/<next>-thumbnail.md`, `decisions/README.md`; inbox note
  `docs/react-native-migration/inbox/2026-10-27-export-guide-preprod-flag-and-assets.md`.
