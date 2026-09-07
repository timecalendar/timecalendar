# 056 — Compose divergent native dialogs behind the chrome seam

## Status

Accepted.

## Context

The calendar rename form must keep an editable draft visible through asynchronous failure. SwiftUI
alerts dismiss when an action fires, while Material 3 exposes a controlled alert dialog with
different text-state and dismissal APIs. Exporting both alpha APIs to a feature would make product
logic own platform churn and incompatible lifecycle semantics.

## Decision

The chrome seam may privately compose divergent platform-native primitives when one stable,
product-neutral behavior contract cannot be represented by a thin re-export. The first use is
`NativeTextEntryDialog`: SwiftUI and Material 3 own text entry, progress, and actions; the wrapper
owns one native observable text buffer plus platform layout and dismissal mechanics; the feature
continues to own validation, copy, mutation, persistence, and close policy. Ordinary native
controls remain thin chrome re-exports.

We reject SwiftUI `Alert` because save failure cannot retain its presented input; raw SwiftUI and
Compose exports because they leak platform branching into features; a calendar-specific wrapper
because mutation rules do not belong in chrome; and a universal custom card because it replaces
the native controls this boundary exists to preserve.

## Consequences

All platform-specific Expo UI imports and alpha-API adaptation stay inside `components/chrome`.
The wrapper submits its current native buffer rather than a delayed React snapshot and exposes
stable selectors and explicit cancel/success dismissal. Jest proves the cross-platform behavior
contract and structural keyboard/focus ownership; device passes remain authoritative for rendering,
input-method, Dynamic Type, and assistive-technology behavior.

## Revisit if

Expo provides one stable cross-platform controlled text-entry dialog with retained asynchronous
failure state, either native implementation can no longer meet the contract, or a second composed
chrome control shows that the exception needs a broader abstraction.
