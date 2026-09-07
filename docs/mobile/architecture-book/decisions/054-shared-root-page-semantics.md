# 054 — Share root-page semantics while keeping platform placement native

## Status

Accepted.

## Context

Root Stack destinations independently assembled page spacing, empty states, filled actions, and
keyboard behavior. The duplication produced inconsistent hierarchy and encouraged route titles to
appear in both native chrome and oversized page content. iOS and Android also place equivalent
actions differently, so visual-placement unification would work against their native conventions.

## Decision

Every user-facing non-tab root route inherits compact native Stack defaults with a minimal back
affordance; shell, nested-flow, redirect, and transition routes are explicit headerless exceptions.
Features continue to own localized titles and native header actions.

Shared `RootPage`/`PageIntro`, `EmptyState`, `PrimaryAction`, and
`KeyboardSafeActionLayout` components own reusable semantics. Pages own non-header safe areas and a
measured lane but do not add a scroll owner. Empty-state artwork is optional, decorative, local,
theme-paired, and license-recorded. Filled body actions use `primaryStrong`/`onPrimary`, while iOS
header and Android FAB placement remains feature-owned. Focused forms place one scroll owner and a
sibling action region inside keyboard avoidance; the screen retains safe-area ownership.

## Consequences

New root siblings must be classified and tested. Feature screens no longer need a duplicate route
heading, and collection/list behavior stays with its existing owner. Theme-token changes require
regenerating paired artwork. Native keyboard geometry, screen-reader order, artwork rendering, and
touch targets still require device evidence.

## Revisit if

Expo Router changes native Stack back-display behavior, React Native supplies a cross-platform
keyboard layout with equivalent ownership, or product design intentionally replaces native
platform action placement.
