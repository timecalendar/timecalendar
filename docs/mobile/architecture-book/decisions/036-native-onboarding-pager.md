# 036 — Use the native pager bridge for onboarding

## Status

Accepted.

## Context

The onboarding entry needs three swipeable pages with programmatic Next controls and one page-selection source of truth. Rebuilding selection and snap behavior with `ScrollView pagingEnabled` would own lower-level paging mechanics already provided by each platform.

## Decision

Use Expo SDK 56's pinned `react-native-pager-view` 8.0.1 directly inside the onboarding UI feature. It uses `UIPageViewController` on iOS and `ViewPager2` on Android; direct child pages are non-collapsable `View`s, and `onPageSelected` owns state for both swipes and `setPage`/`setPageWithoutAnimation` controls. Keep the dependency feature-local rather than adding an unearned shared wrapper.

The module autolinks, requires no permission or config plugin, and is mocked suite-wide in Jest with its imperative/event contract. Because it contains native code, adding or upgrading it moves the Expo runtime fingerprint and requires fresh development/EAS binaries.

## Consequences

Onboarding gets platform-native gestures and paging semantics, but cannot run off-device without the Jest seam or arrive by OTA on older binaries. A generic carousel package is rejected as broader than the feature; `ScrollView pagingEnabled` is rejected because it would recreate selection and snapping behavior.

## Revisit if

Expo's supported pager API changes during an SDK upgrade, the native bridge becomes unmaintained, or at least two features need a materially shared pager abstraction.
