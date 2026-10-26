# Proposal

## Why

Loading, empty and error states are built nine ways across the app (assessment issue 6,
`duplication-and-drift.md` §A11): feature-local `ListStatus`/`StatusSymbol`, `GuideLoading`,
`ImportProgressView`, the event-details spinner, plain-text empties, and spinners in four colors.
The shared `EmptyState` does not scroll, so at the largest text size its artwork rises under the
navigation bar and its bottom is unreachable, and the gallery's field-error pattern links the field
to its error with `aria-describedby`, which React Native forwards to neither UIKit nor Android, so
a screen reader never hears the error from the field (inbox
`2026-10-25-mobile-gallery-fixtures-findings.md`). Roadmap slice 3.3
(`docs/mobile/design-system-audit/migration-roadmap.md`) replaces them with one `StatusView`; the
phase 5 screen slices need it.

## What Changes

- **New `StatusView` primitive** in `mobile/src/design/status/status-view.tsx`, exported from
  `@/design`:
  - `kind`: `loading` | `empty` | `error`; `presentation`: `screen` | `section` | `inline`.
  - `title` (required), `caption`, empty-only `artwork` or `symbol`, `action` (filled `Button`)
    and `secondaryAction` (text `Button`) on `empty` and `error`, `announcementKey`, `testID`,
    layout-only `style`. Props are a discriminated union per `kind`, so a loading state cannot
    carry an action or artwork.
  - `screen` owns a vertical scroll container that centers its content and scrolls once the
    content is taller than the viewport; `section` is a centered block inside a parent list or
    scroll view; `inline` is leading-aligned and content-sized.
  - At accessibility text sizes (`useIsAccessibilityTextSize()`) artwork is not rendered; symbols
    and the error glyph keep their fixed size.
  - One spinner color: `textSecondary`, hidden from assistive technology through a wrapper view.
  - Screen readers: the state is announced once when it appears and once per `announcementKey`
    change (iOS through the shared `useErrorAnnouncement` hook, extended with a `key` option;
    Android through the polite live region). Empty and error titles are headings; a loading state
    is one element with the progress-bar role, its title as name and `busy` state.
- **`EmptyState`, `ErrorState` and `ErrorTextAction` are removed, not aliased.** **BREAKING** for
  in-repo imports: all 12 feature files that render `EmptyState` or `ErrorState` migrate to `StatusView`
  with their `testID`s unchanged. `ErrorNotice`'s action renders a `text` `Button`; the
  `ErrorAction` type becomes `StatusAction` (a `Button` props subset).
- **Field errors reach the field**: `FieldError` loses its `nativeID` prop; a new
  `fieldErrorHint(error, hint?)` helper from `@/design` folds a shown error into the field's
  `accessibilityHint`, applied to every `TextInput` that renders a `FieldError` (feedback, personal
  event title, iCal URL, institution name, programme) and the gallery field-error story.
- **Slice 3.3 call sites migrate** (testIDs kept): school picker (`ListStatus` and `StatusSymbol`
  deleted; the missing-school link becomes a `text` `Button`) and group picker loading/empty;
  export guides `GuideLoading` and `GuideBlockingError`; calendar-sources `ImportProgressView`,
  import-result failure, QR import failure and user-calendars empty; event-details loading and
  not-found; the timezone chooser's no-results state.
- **Lint (Principle 1)**:
  - New repo-local rule `local/no-ad-hoc-status`: importing `ActivityIndicator` from
    `react-native`, and a `ListEmptyComponent` that renders anything but `StatusView`, are errors
    outside `src/design/`, the chrome seam, the calendar renderer and tests. Files not yet migrated
    sit in `tools/eslint-rules/ad-hoc-status-allowlist.js` with a pinned-ceiling contract test.
  - `aria-describedby` joins the shared `restrictedSyntax` list (every file).
  - `src/design/status/status-view.tsx` gets a 90% lines/branches coverage tier.
  - `school-picker-screen.tsx` leaves the raw-button allowlist (ceiling 16 → 15).
- **Gallery**: `status-view.gallery.tsx` (meta `status-view`) with a story per kind and
  presentation, a busy retry, and longest French strings; the `empty-state` fixture is deleted and
  `error-surfaces` keeps its notice and field-error stories. New `gallery.statusView.*` FR/EN
  strings; `gallery.emptyState.*` and the state-only `gallery.errorSurfaces.*` keys go.
- **ADR 069** records the status contract, the alias removal, announcement ownership, the
  field-error hint and the ratchet.
- **Architecture Book**: `theming.md` (status section), `accessibility.md` (accessible async
  status, field errors), `lint-format.md`, `testing.md`, `features.md` (gallery inventory and the
  migrated features), ADR index, dated `CHANGELOG.md` entry; the 2026-10-25 inbox findings that
  this change fixes are struck from that note.

Out of scope (deferred to phase 5, each on the ad-hoc-status allowlist where lint sees it):
Activity loading and older-page footer spinner (5.4), the backend-environment recovery gate
(3.5), the developer import screen and the import-result success message (5.7), the event
checklist and calendar-screen plain-text empties and the QR permission loading text (5.8, 5.10,
5.7; lint cannot see a plain-text empty), the calendar renderer. `ErrorNotice` and `FieldError`
keep their contract; the `TextField` slice (3.4) absorbs `fieldErrorHint`.

## Capabilities

### New Capabilities

- `mobile-design-system-status-view`: the shared loading/empty/error contract (kinds,
  presentations, actions, scrolling, accessibility-size artwork, announcement and roles), its
  gallery fixture and its lint ratchet.

### Modified Capabilities

- `mobile-root-page-primitives`: shared empty-state composition becomes `StatusView` (screen,
  section, inline) and scrolls at large text; specialized states render through it.
- `mobile-design-system-layer`: the barrel scenario names `StatusView` instead of `EmptyState`.
- `mobile-lint-format`: ad-hoc status UI is a ratcheted lint error; `aria-describedby` is a lint
  error.
- `mobile-a11y`: a field with a visible error exposes it from the field itself.

## Impact

- Code (`mobile/`): new `src/design/status/status-view{,.test,.gallery,.gallery.test}.tsx`,
  `src/design/status/field-error-hint{,.test}.ts`; deleted
  `src/design/status/empty-state{,.test,.gallery}.tsx`,
  `src/features/school-selection/ui/{list-status,status-symbol}.tsx` (and tests); changed
  `src/design/status/error-surfaces{,.test,.gallery,.gallery.test}.tsx`, `src/design/index.ts`,
  `src/design/gallery/registry.ts`, `src/design/icon/icon-glyphs.ts`,
  `src/hooks/use-error-announcement.ts` (+ new test), feature UI under `school-selection`,
  `export-guides`, `calendar-sources`, `calendar`, `settings`, `home`, `activity`,
  `personal-events`, `hidden-events`, `environment`, `feedback`, `onboarding` and their tests;
  `src/i18n/locales/{en,fr}.json`; `eslint.config.js`; new
  `tools/eslint-rules/no-ad-hoc-status{,.test}.js`, `ad-hoc-status-allowlist{,.test}.js`;
  `tools/eslint-rules/{index,raw-button-allowlist,raw-button-allowlist.test}.js`; `jest.config.js`.
- Visual: migrated states change on device (one spinner color, one title step, centered section
  geometry, symbol glyphs on the timezone and event-details states, text `Button` secondaries).
  Copy, routes and selectors stay.
- No new dependency, no native module, no route, no `app.config.ts` or `eas.json` change. Does
  not touch `src/components/chrome/`.
- Docs: Architecture Book files above, new `decisions/069-status-view.md`, inbox note
  `docs/react-native-migration/inbox/2026-10-26-mobile-ds-status-view-screen-reader-pass.md`.
