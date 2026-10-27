# 079 — `Thumbnail` for list-leading images

## Status

Accepted.

## Context

Two screens led their rows with a remote image and each drew it its own way. The school picker
used a feature-local `school-logo.tsx`: a logo chip with a literal font size for the fallback
letter and a `key` remount on the caller to retry after a scheme switch. Export-guide provider
selection used an ad-hoc `expo-image` with `Radii.small` and `cover`, and its own failure state.
Neither was reachable by the migrated-screen contract without an exemption, and future image-led
rows (calendar sources, the school header on Home) would have copied one of them. This is roadmap
slice 5.5.

## Decision

- `src/design/thumbnail/thumbnail.tsx` exports `Thumbnail` from `@/design`. It takes
  `source: { light, dark? }`, `size: "medium" | "large"` (40 / 56 from the `ThumbnailSize` token),
  an optional `monogram`, an optional `onError` and a `testID`.
- In the dark scheme it loads `dark ?? light`; an empty URL counts as none.
- The image sits on a `logoSurface` chip (`Radii.medium`, clipped, artwork overshooting by one
  point so Android leaves no sub-pixel gap) with a `separator` hairline ring overlaid above it,
  because React Native paints children above a view's own border. Artwork is `contain`.
- With no image, or after a load failure, the tile is `primarySoft` with the monogram on the
  `headline` step in `onPrimarySoft` and `allowFontScaling={false}`.
- It keeps the failed URI in state and compares it with the resolved one, so a scheme or source
  change retries with no caller `key`.
- The tile is hidden from assistive technology; the row names itself.
- School rows use `medium` with a monogram; provider rows use `large` and keep their failed-image
  subtitle through `onError`.

Rejected:

- Keeping `school-logo.tsx` in the feature with a contract exemption. The contract has no
  exemptions, and the file is the drift the slice removes.
- A `ListRow` `leading: { image }` variant. It couples row geometry to image loading and failure,
  and a non-row image could not share it.
- `tone="action"` for the monogram. `actionText` on the pink wash is not a documented pair;
  `onPrimarySoft` is.

## Consequences

- Provider thumbnails move from `cover` on `Radii.small` to `contain` on the logo chip.
- The monogram does not scale with text, like `ColorDot`: it is decorative and the row label
  scales.
- [`thumbnail.test.tsx`](../../../../mobile/src/design/thumbnail/thumbnail.test.tsx) is on a 90%
  per-file coverage tier; the gallery (`thumbnail--image`, `--dark-image`, `--monogram`,
  `--sizes`) runs in both schemes on both platforms.
- How the chip and ring render on a device is device evidence
  ([inbox note](../../../react-native-migration/inbox/2026-10-27-mobile-ds-5-5-device-pass.md)).

## Revisit if

- A list needs a thumbnail size other than 40 or 56, or a non-square image.
- A screen reader user needs the image itself announced (it would carry its own label).
