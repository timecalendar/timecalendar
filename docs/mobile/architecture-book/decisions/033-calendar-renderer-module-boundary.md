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
current calendar-kit implementation under `renderer/calendar-kit`, with one exact vendor
module as the package's only permitted import site. The screen owns product orchestration,
event loading, routes, and menus; the renderer owns timeline rendering and dependency
adaptation. Pure reusable calendar logic remains in `calendar/data`.

## Consequences

The current dependency can be replaced behind the facade without moving agenda or screen
logic. Calendar-kit workarounds remain visible and removable as one adapter. Renderer
presentation uses the UI coverage floor, while its pure event projection and window logic
remain 90%-gated.

## Revisit if

A second feature consumes the timeline and justifies extracting a shared package, or the
owned renderer needs a materially different product-facing contract.
