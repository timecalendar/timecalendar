## Why

The owned timeline currently rejects zero-duration rows, collapses very short events into impractical press targets, and assumes imported colors and titles are presentation-ready. One malformed or incomplete event must not erase valid classes, and every retained event must remain identifiable, readable, and openable.

## What Changes

- Admit zero-duration timed events as valid point facts, use point-at-boundary range membership, and project them as instant markers without changing persisted rows.
- Separate duration-faithful visual geometry from platform-minimum interactive geometry for zero-duration and very short single-column events, while preserving native press cancellation and original-identity routing.
- Normalize missing or malformed presentation fields per row: use the localized `(No title)` / `(Sans titre)` fallback, omit invalid optional content, and keep full time/title/location in details and accessible names even when visual text is constrained.
- Replace the alpha-only imported-color treatment with a deterministic light/dark/increased-contrast policy that validates source colors, preserves a recognizable source-color cue, and emits a contrast-safe foreground/background pair.
- Keep required-date and reversed-range failures isolated to their rows and emit only allowlisted rejection reason/count diagnostics, never raw rows, values, identifiers, exceptions, or query inputs.
- Add fabricated noon-point, two-minute, missing/long-content, arbitrary-color, invalid-row, and valid Maths fixtures with focused data, presentation, renderer, details, accessibility, privacy, and CI proof.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-calendar-timeline`: admit point events, render tiny events with independent visual and interactive geometry, resolve deterministic readable colors, prioritize title content, and preserve complete accessible meaning.
- `mobile-calendar-sync`: refine the validated local read contract so zero-duration timed rows are accepted, reversed ranges remain rejected per row, malformed optional content is omitted, and diagnostics remain aggregate-only.
- `mobile-calendar-agenda`: apply the same localized missing-title normalization to retained Calendar event rows without changing Agenda grouping or interaction ownership.
- `mobile-event-details`: show the localized missing-title fallback and safely omit malformed optional rich content while retaining original event identity and editability.
- `mobile-architecture-book`: record the implemented point-event, tiny-target, contrast, localization, and row-isolation contracts without introducing a new architectural boundary.

## Impact

- Affects `mobile/src/features/calendar/data/` decoders, range predicates, color/presentation helpers and tests; `mobile/src/features/calendar/renderer/owned-calendar-canvas.tsx` and shell tests; Calendar/Agenda/details presentation; typed English/French catalogs; fabricated fixtures; and focused Architecture Book Calendar/testing guidance.
- The internal V1 timed presentation model gains explicit point/visual/color semantics, but original source identity, complete immutable page publication, details routing, and persisted SQLite rows remain unchanged.
- Touches no repository-sensitive surface: no OpenAPI or generated client, database migration, native/store/EAS/Firebase configuration, deploy/CI or infrastructure file, or legacy Flutter code.
- Adds no dependency, compatibility renderer, provider/recurrence rewrite, overlap-density policy, spanning/all-day behavior, stored-fact mutation, new top-level Maestro journey, or product-wide device certification. Final native accessibility/device acceptance remains with T28.
