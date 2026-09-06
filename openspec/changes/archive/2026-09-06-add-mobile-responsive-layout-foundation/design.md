## Context

The mobile app supports phones and full-screen portrait tablets under ADR 042. Most screens
currently combine `MaxContentWidth = 800`, `Spacing.four`, and local centering, while a few custom
layouts derive geometry from `useWindowDimensions`. That does not distinguish prose/forms from
lists or width-bearing canvases, and it is wrong for a route whose actual owner is narrower than
the window, including native presentations and nested containers.

The tablet audit fixes the semantic values: compact below 600, tablet at 600 and above, readable
content capped at 640, standard content capped at 800, compact gutters at `Spacing.four`, tablet
gutters at `Spacing.six`, and optional columns eligible only at 834 and above. TIM-500, TIM-501,
and TIM-502 will consume this contract; this change establishes it without adapting those screens.

The Expo SDK 56 documentation and the installed `expo-router` 56.2 declarations were checked
before designing the shell boundary. `NativeTabs` still exposes the trigger compound API through
`expo-router/unstable-native-tabs`; Stack supports `formSheet`, `fullScreenModal`,
`sheetAllowedDetents`, and `sheetGrabberVisible`. The current wrapper and `/changelog-sheet`
configuration already match that contract, and existing static tests pin both, so no shell code
change is justified.

## Goals / Non-Goals

**Goals:**

- Centralize the portrait responsive tokens, types, and pure width calculations.
- Resolve nested and presented layouts from the actual positive width reported by their owner.
- Provide reusable hook and component forms for ordinary views, lists, scroll content, and custom
  geometry consumers without taking ownership of platform chrome or insets.
- Preserve compact behavior before measurement and below 600.
- Make readable, standard, and full-bleed intent explicit for downstream screen work.
- Prove the breakpoint, cap, gutter, nested-owner, and pre-measurement behavior with focused tests.

**Non-Goals:**

- No downstream screen conversion, product-flow change, landscape or multitasking support,
  sidebar/master-detail navigation, device-model detection, or tablet-only navigation.
- No universal maximum width: calendar/camera canvases and other explicitly full-bleed surfaces
  remain width-bearing.
- No custom safe-area, header, tab, list-inset, keyboard, menu, alert, picker, modal, or overlay
  system, and no navigation dependency.
- No native/store configuration, API contract, generated client, server, schema, deployment,
  workflow, or legacy Flutter change.

## Decisions

## Decision 1 — Keep tokens and pure resolution in `src/theme/responsive.ts`

Add typed constants for the two breakpoints and two semantic content caps alongside a pure
`resolveResponsiveLayout(ownerWidth, lane)` function. Re-export the durable tokens, lane/size
types, metrics type, and resolver from `@/theme`. Keep `MaxContentWidth` as the existing standard
cap alias during downstream migration so this foundation is additive rather than a flag-day edit.

The resolver normalizes non-finite and non-positive widths to the unmeasured state. A positive
width below 600 is compact; 600 and above is tablet. Optional columns are eligible only from a
positive measured width of 834. For readable and standard lanes, the usable content width is:

`min(max(ownerWidth - 2 * gutter, 0), laneCap)`

The centered outer inset is `(ownerWidth - usableContentWidth) / 2`. Full bleed uses the normalized
owner width with zero responsive gutter and no cap. Returning numeric metrics makes custom geometry
and table tests consume the same policy as rendered containers.

Alternatives rejected: a styling library adds runtime machinery for numeric policy; scattered
media-query-like helpers recreate local contracts; a device-model check cannot describe a nested
or presented owner.

## Decision 2 — The component seam owns measurement, not the window

Add `src/components/adaptive-content.tsx` with `useAdaptiveLayout(lane)` and
`AdaptiveContent`. The hook starts at width zero, exposes an `onLayout` handler, resolved metrics,
and a memoized lane style. It adopts finite positive widths reported by the attached owner; before
the first such event, it returns compact metrics and a compact-gutter style that still renders at
`width: "100%"` so measurement never hides or collapses children.

For capped lanes, the rendered inner container is centered with `width: "100%"`, a maximum outer
width of `laneCap + 2 * gutter`, and the resolved horizontal padding. This makes the cap apply to
usable content after both gutters. For full bleed it uses the whole owner with no responsive
padding or maximum. `AdaptiveContent` is the convenient owner-plus-inner-view form; the hook is the
escape hatch for `ScrollView`/list content containers and custom geometry. Both are imported from
the explicit shared module path; the repository has no general components barrel to expand.

Alternatives rejected: `useWindowDimensions` gives the wrong answer inside a native sheet or
narrow parent; measuring each feature separately duplicates state and fallback behavior; rendering
a zero-width first frame would satisfy the numeric resolver but violate compact visual fallback.

## Decision 3 — Eligibility is policy, not automatic composition

The resolver reports `isColumnEligible` at 834 and above but never creates columns. Screen owners
must still prove independent scan groups, stable source/focus order, and a one-column fallback under
large-text or width stress. Widths 768 and 800 remain single-column even though both are tablets.

Alternative rejected: automatically switching the shared component to columns would redesign
screens, reorder accessibility traversal, and force one composition on unrelated content.

## Decision 4 — Responsive content never owns chrome or environmental insets

The hook/component applies only centering, semantic maximum width, and horizontal responsive
gutter. It does not read safe-area insets, render a `SafeAreaView`, alter Stack/native-tabs options,
set list automatic inset behavior, move keyboard avoidance, or anchor full-window overlays. A
feature places the adaptive lane inside its existing owner; full-bleed features can measure the
same owner without receiving a gutter.

The current iOS `formSheet` versus Android `fullScreenModal` route choice and the native-tabs
wrapper remain byte-for-byte unchanged. The current route-structure and tab tests are the static
regression proof. This follows the platform's existing ownership rather than adding a parallel
shell.

Alternative rejected: a responsive root wrapper would double-apply insets on some routes, cap
information canvases, and interfere with native presentation.

## Decision 5 — Document the reusable rule without a new ADR

Update `theming.md` with the implemented responsive API and ownership rule, append the required
Architecture Book changelog entry, and convert the foundation section of
`tablet-quick-wins.md` from proposed to actual. No new ADR is added: the expensive native device
and orientation contract is already ADR 042, while these centralized numeric tokens and additive
view primitives are reversible implementation policy. The load-bearing rationale remains explicit
in these Decision blocks and in current-state guidance.

## Risks / Trade-offs

- [A measured child can briefly render with fallback gutters] → The fallback is intentionally the
  current phone composition, and the first positive layout event atomically resolves the owner.
- [A consumer can attach the hook to the wrong node] → Name the API around owner measurement,
  document placement inside existing safe-area/presentation owners, and test a nested owner whose
  width disagrees with the window.
- [A cap can accidentally include gutters] → Encode the calculation in one resolver and assert
  usable widths for all three lanes at every representative width.
- [Column eligibility can be mistaken for a layout instruction] → Return an explicitly named
  eligibility boolean, keep the component single-column, and document the downstream proof burden.
- [Two public paths can drift] → Build hook styles from the pure resolver and test representative
  component behavior in addition to the resolver table.

## Migration Plan

1. Add responsive tokens/types and the pure resolver; keep the existing 800-point alias.
2. Add the measured hook/component using the resolver and export the public theme surface.
3. Add the resolver table and component behavior tests, including nested and unmeasured cases.
4. Re-run the existing navigation/tab regressions without changing shell source.
5. Update the tablet matrix, Architecture Book guidance, and changelog.
6. Run focused tests, then the mobile TypeScript, lint, and full Jest gates.

Rollback is a normal revert: the change is additive and no downstream screen consumes it until the
dependent tablet tickets rebase after it lands.

## Open Questions

None blocking. Screen-specific column composition and large-text thresholds remain deliberate
decisions for the downstream owners; this foundation exposes eligibility but does not pre-decide
their layouts.
