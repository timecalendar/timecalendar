# New feature guide

Use this guide when adding a feature. Existing code is the executable example; the
template under [golden-path-template](./golden-path-template/) is only a starting shape.

## Choose ownership

Create `src/features/<feature>/` when the behavior has a product-domain owner. Add only
the sublayers it needs:

```text
src/features/<feature>/
  data/    API, database, mapping, queries
  store/   persisted client state
  form/    validation and form orchestration
  ui/      screens and feature-specific presentation
  index.ts public feature exports
```

Each sublayer has a small public `index.ts`. A sublayer imports a sibling's barrel, never
the feature barrel that re-exports it. Put reusable primitives in `src/components/`, not
feature-specific screens.

## Keep infrastructure behind seams

- Generated API hooks and `@/db` are accessed only from the feature's `data/` layer.
- MMKV is accessed through `@/storage` and a typed feature store.
- Firebase native packages are accessed through `@/firebase`.
- Native chrome and calendar-kit are accessed through owned component seams.
- Routes in `src/app/` contain routing configuration or re-export feature UI; they do not
  contain feature logic.

ESLint encodes the exact import boundaries. Do not document an exception before checking
whether the dependency direction can be simplified.

## Design logic for testing

Keep parsing, validation, mapping, selection, and formatting pure. Return domain values or
localization keys rather than rendered strings. Keep native and network wiring at narrow
edges so component tests can replace those edges.

Logic sublayers must meet the 90% lines/branches threshold; presentation contributes to
the 70% global floor. Test user-visible behavior rather than implementation details. Add a
Maestro happy path when the feature has a meaningful end-to-end interaction.

## UI contract

- Put all user-facing strings in typed French and English resources.
- Use semantic text variants and accessible roles, labels, state, and live regions.
- Preserve font scaling, reduced motion, platform touch-target minimums, and native idioms.
- Use theme tokens for chrome; event colors and other user data are not theme tokens.
- Surface recoverable failures with an action when retry is possible. Record unexpected
  failures through `@/firebase` without personal data.

## Completion checklist

1. Define the feature owner, sublayers, and dependency directions.
2. Implement pure logic and infrastructure adapters before screen composition.
3. Add sublayer barrels and the smallest useful feature-level public API.
4. Add feature UI and a thin route entrypoint.
5. Add translations, accessibility behavior, and error states.
6. Run TypeScript, lint, formatting, tests with coverage, and applicable Maestro flows.
7. Complete the device checks in [definition-of-done.md](./definition-of-done.md).
8. Update a topical architecture page only when a reusable current contract changed.
9. Add an ADR only when the decision meets [the ADR policy](./decisions/README.md).

Good real examples are `settings` for typed preferences, `personal-events` for local CRUD
and forms, and `school-selection` for server state plus persisted identity.
