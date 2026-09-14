# 019 — Use calendar-kit for timeline rendering

## Status

Superseded for Calendar timeline rendering by
[owned renderer D04](../../../projects/owned-calendar-renderer/decisions/D04-view-renderer-and-gestures.md)
and [D07](../../../projects/owned-calendar-renderer/decisions/D07-clean-native-cutover.md).
The E01 native ScrollView/PagerView implementation is on main; calendar-kit is absent.
The rationale below is historical.

## Context

A spike showed `@howljs/calendar-kit` v2 could render dense overlapping weeks on the
supported Expo/React Native stack. Owning a complete timeline renderer would add substantial
gesture, layout, and performance work.

## Decision

Use calendar-kit for day/week rendering behind the renderer-neutral feature seam defined
by [ADR 033](./033-calendar-renderer-module-boundary.md). Keep grouping, overlap,
time-grid, formatting, and agenda primitives in app-owned pure code.

## Consequences

Feature code is insulated from the dependency, while Home and agenda remain independent.
The renderer and dense-calendar behavior require device verification.

## Revisit if

The library blocks accessibility, platform behavior, performance, or supported upgrades.
