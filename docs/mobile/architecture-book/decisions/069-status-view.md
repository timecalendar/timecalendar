# 069 — One `StatusView` for loading, empty and error states

## Status

Accepted.

## Context

Loading, empty and error states were drawn three ways: `EmptyState` and `ErrorState` in
`src/design/status/`, a feature-local `ListStatus` in school selection, and bare
`ActivityIndicator` + text rows in seven feature files. Spinner colors, title steps, roles and
announcements differed per screen. A centered status column did not scroll, so at the largest
text sizes it rose under the header and clipped its actions. `ErrorTextAction` was a raw
`Pressable` that `local/no-raw-button` could not see. Field errors pointed at the field through
`nativeID` / `aria-describedby`, a relation React Native forwards to neither UIKit nor Android.

## Decision

- `StatusView` lives in `src/design/status/status-view.tsx`, imported from `@/design`. Its props
  are a discriminated union on `kind`: `loading` (title only), `empty` (caption, `action`,
  `secondaryAction`, and `artwork` or `symbol`), `error` (caption and actions; the glyph is fixed
  `exclamationmark.circle` / `error_outline` in `error`). `style` is layout-only
  (`ButtonLayoutStyle`) and merges last.
- `presentation` is `screen`, `section` or `inline`:

  | Presentation | Container                                                               | Alignment |
  | ------------ | ----------------------------------------------------------------------- | --------- |
  | `screen`     | vertical `ScrollView`, `flexGrow: 1` content centered, fills its parent | centered  |
  | `section`    | `View`, `flexGrow: 1`, centered in the height its parent gives          | centered  |
  | `inline`     | content-sized `View`; loading lays spinner and title in a row           | leading   |

  `screen` owns its scroll: it centers while it fits and scrolls from the top once it does not.
  It is never placed inside a list or a scroll view; a list empty slot uses `section`.

- Media: loading draws `ActivityIndicator` in `textSecondary` (large, small for `inline`) inside a
  hidden wrapper; symbols and the error glyph are `Icon` 40 with `scaling="fixed"`. Artwork is not
  rendered when `useIsAccessibilityTextSize()` is true; the text owns the viewport.
- Semantics: empty and error titles are `sectionTitle` (header role, ADR 063), captions are
  separate secondary text, media is hidden, no `alert` role. Loading is one accessible element
  with role `progressbar`, label = title, `busy` state. Actions are `Button`s (`filled` primary,
  `text` secondary) stacked primary first.
- Announcement: `useErrorAnnouncement(spoken, { key: announcementKey ?? kind })` speaks once per
  appearance and per key change, not on every message change under the same key. iOS uses the
  queued announcement; Android relies on a polite live region on the loading `progressbar` or the
  title and caption group, never on the actions, so a Retry busy toggle does not re-read the state.
- `EmptyState`, `ErrorState`, `ErrorTextAction` and `ErrorAction` are removed, not aliased.
  `ErrorNotice`'s action is a `StatusAction` rendered as `Button variant="text"`.
- Field errors fold into the input's `accessibilityHint` through `fieldErrorHint(error, hint)`, which takes `string | null | undefined`.
  `FieldError` keeps its alert text and live region and has no `nativeID`. `aria-describedby` is
  a restricted-syntax error as a JSX attribute or an object key.
- Lint: `local/no-ad-hoc-status` reports a `react-native` `ActivityIndicator` import and a
  `ListEmptyComponent` that renders anything but `StatusView`. Unmigrated files sit in
  `tools/eslint-rules/ad-hoc-status-allowlist.js`, pinned by a ceiling test.

Rejected: `EmptyState`/`ErrorState` aliases (two APIs and a second ratchet); a flat prop bag (a
spinner with a retry type-checks); an `onLayout` switch to scrolling (second layout pass, flicker
on live text-size change); shrinking artwork with font scale; an `alert` role on the error title
(it collapses the heading and neither screen reader speaks a mounted alert); folding field errors
into `accessibilityLabel` or `accessibilityValue` (renames the field or masks its value); Android
`accessibilityLabelledBy` (Android-only, names instead of describes); `no-restricted-imports` or
`no-restricted-syntax` for the ratchet (cannot exempt `StatusView` through conditionals).

## Consequences

Every status in a feature is one primitive with one layout, one spinner color and one announcement
owner. Migrated screens change on device: secondary-tone spinners, `sectionTitle` titles, no
artwork at accessibility sizes. Lint cannot see a `screen` nested in a scroll view or a plain-text
empty outside a list slot; review and the gallery catch those. A field's error is spoken when it
appears and again when the field gains focus, via the hint. Each later slice removes its allowlist
entry and lowers the ceiling.

## Revisit if

- A status needs content other than title, caption, media and two actions (progress value, a
  list of causes).
- React Native forwards a described-by relation on both platforms.
- The allowlist reaches zero: drop the ignores and delete the allowlist test.
