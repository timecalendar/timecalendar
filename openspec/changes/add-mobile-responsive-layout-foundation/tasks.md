## 1. Typed responsive policy

- [x] 1.1 Add `mobile/src/theme/responsive.ts` with typed compact/tablet and optional-column
  breakpoints, readable/standard caps, semantic lane and metrics types, and the pure
  `resolveResponsiveLayout(ownerWidth, lane)` calculation from Decision 1.
- [x] 1.2 Re-export the durable responsive constants, types, and resolver from `@/theme`; retain
  `MaxContentWidth` as the standard-cap compatibility alias and verify `npx tsc --noEmit` accepts
  representative typed consumers.

## 2. Measured shared-component seam

- [x] 2.1 Add `useAdaptiveLayout(lane)` in `mobile/src/components/adaptive-content.tsx`: start in
  compact/unmeasured state, accept finite positive `onLayout` widths from the attached owner, and
  derive metrics plus capped/full-bleed lane styles from the pure resolver.
- [x] 2.2 Add `AdaptiveContent` in the same module as the owner-plus-inner-view convenience form;
  keep caller styles/handlers composable and confirm the component adds no safe-area, navigation,
  list-inset, keyboard, modal, or overlay behavior.

## 3. CI proof and regression tests

- [x] 3.1 Add a table-driven pure resolver suite covering readable, standard, and full-bleed
  results at 390, 599, 600, 768, 800, 834, and 1024, including exact class, gutter, usable width,
  centering, cap, and eligibility assertions plus invalid/non-positive inputs.
- [x] 3.2 Add focused hook/component behavior coverage for visible compact pre-measurement output,
  a positive measurement update, and a nested owner below 600 while the mocked global window is
  tablet-width; assert the rendered lane style is built from the resolver.
- [x] 3.3 Run the existing `settings-route-structure.test.ts` and `app-tabs.test.tsx` regressions
  and confirm the changelog sheet presentation, full-height detent/grabber, native-tabs wrapper,
  trigger order, and platform tab behavior remain unchanged; do not edit shell source unless this
  proof exposes a foundation-caused regression.

## 4. Current-state documentation

- [x] 4.1 Update `docs/mobile/tablet-quick-wins.md` so the foundation section describes the landed
  API and actual measurement/lane decisions while preserving the downstream ownership matrix and
  deferred scope.
- [x] 4.2 Add the responsive token/component contract and chrome/inset ownership boundary to
  `docs/mobile/architecture-book/theming.md`, then append the matching rule-change entry to
  `docs/mobile/architecture-book/CHANGELOG.md`; keep ADR 042 as the portrait device contract and
  do not add a new ADR for the reversible additive primitives.

## 5. Local-green verification and scope proof

- [x] 5.1 From `mobile/`, run the focused responsive, route-structure, and app-tabs Jest suites and
  record the passing commands/results in the PR handoff.
- [x] 5.2 From `mobile/`, run `npx tsc --noEmit` and `npm run lint`; fix every error or warning
  without weakening the existing gates.
- [x] 5.3 From `mobile/`, run the full `npm test` suite and record the result; this is the CI proof
  path for the responsive behavior on the proposal's exact implementation head.
- [x] 5.4 Review the final diff and confirm it contains no downstream screen conversions, new
  dependency, native/store configuration, API/generated-client, server/schema, deploy/workflow,
  or legacy Flutter change, and that the only sensitive surface is the documented Architecture
  Book update.
