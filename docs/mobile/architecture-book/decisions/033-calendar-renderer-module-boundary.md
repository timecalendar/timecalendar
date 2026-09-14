# 033 — Own the calendar renderer boundary inside the calendar feature

## Status

Accepted.

## Context

The calendar screen composed calendar-kit's containers and event types directly through a
shared chrome wrapper. Library-specific event projection, page buffering, callback timing,
theme conversion, and tiles were consequently mixed with navigation, synchronization, and
agenda orchestration. Replacing the renderer would still require rewriting the screen.

## Decision

Expose a renderer-neutral `features/calendar/renderer` facade in domain terms. Keep the
owned implementation under `renderer`, with native ScrollView/PagerView motion and a
Reanimated dated-header projection. Calendar-kit, its adapter and vendor-only configuration
are absent. The screen owns product orchestration,
event loading, routes, and menus; the renderer owns timeline rendering and dependency
adaptation. Pure reusable calendar logic remains in `calendar/data`.

## Consequences

The renderer evolves behind the facade without moving agenda or screen logic. The current
private props expose week transitions and settled vertical offsets; E02 adds mode and zoom
without promising a public API. Renderer presentation uses the UI coverage floor. Pure owned
calendar semantics follow the coverage requirements in the
[delivery protocol](../../../projects/owned-calendar-renderer/delivery.md).

## Revisit if

A second feature consumes the timeline and justifies extracting a shared package, or the
owned renderer needs a materially different product-facing contract.
