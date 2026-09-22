## Why

Simultaneous classes currently render in the same full-width lane, so one tile and its expanded minimum-size target can cover another. Students need stable side-by-side classes and an unambiguous way to open every retained class, including in dense or tiny clusters.

## What Changes

- Validate that overlap packing receives only positive-duration intervals, then sort by start instant, end instant, and stable event identity so every input permutation produces the same placement.
- Treat adjacency as non-overlap and assign every connected overlap cluster the minimum number of equal-width, non-covering columns.
- Compute complete day clusters before viewport clipping and retain their column assignments across vertical scrolling and supported zoom changes.
- Render visual tiles within their assigned columns without changing stored event facts, hiding valid events, or introducing an aggregation threshold.
- Detect expanded-target conflicts and expose one explicit, localized, accessible chooser for the affected identities so taps and assistive activation cannot silently open a different class.
- Add permutation/property coverage and identified fabricated density, frame-work, mounted-node, semantic-node, and activation evidence for this first populated overlap workload.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-calendar-timeline`: define deterministic overlap clusters and equal-width placement, pre-clipping layout stability, and explicit dense-target disambiguation.
- `mobile-architecture-book`: record the implemented overlap, target-selection, and bounded evidence contracts without changing the renderer ownership boundary.

## Impact

- Affects `mobile/src/features/calendar/data/overlap-layout.ts`, timeline presentation, the feature-owned Calendar renderer, localized English/French copy, fabricated Calendar test support, focused tests, the Calendar repository contract, and current Calendar/testing Architecture Book guidance.
- The internal tile presentation gains stable overlap placement and target-conflict metadata; original event identity, complete three-page publication, local details routing, and persisted SQLite facts remain unchanged.
- Touches no repository-sensitive surface: no OpenAPI/generated client, database migration, native/store/EAS/Firebase configuration, deploy/CI or infrastructure file, or legacy Flutter code.
- Adds no dependency, compatibility renderer, hidden-event policy, arbitrary event cap, all-day or multi-day/DST rendering, or final supported-density claim. Physical-device accessibility acceptance remains in the planned final-device slice.
