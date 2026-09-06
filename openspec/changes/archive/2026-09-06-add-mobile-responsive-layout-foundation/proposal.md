## Why

The React Native app already supports full-screen portrait tablets, but screens currently repeat an
800-point cap and fixed phone gutter without a shared way to distinguish readable content, standard
content, and width-bearing canvases. The tablet screen work needs one measured, typed responsive
contract first so nested and presented content does not infer its layout from an unrelated window.

## What Changes

- Add typed responsive tokens and a pure resolver for compact/tablet classification, adaptive
  gutters, readable and standard content lanes, full-bleed content, and optional-column eligibility.
- Add a reusable measured content container and hook that resolve from the width reported by the
  actual layout owner, with compact behavior until a positive measurement exists.
- Export the public contract through the existing `@/theme` and shared-component seams so later
  screen changes do not introduce local breakpoints or duplicate width calculations.
- Add table-driven resolver tests at the phone/tablet boundaries and component coverage for
  measurement, nested-owner, lane, and pre-measurement behavior.
- Keep Expo Router Stack, native tabs, safe areas, list insets, keyboard avoidance, overlays, and
  platform presentation in their existing owners. The existing changelog sheet presentation and
  native-tabs wrapper remain unchanged and are covered by the current static regressions.
- Update the tablet implementation matrix and the Architecture Book's theming/layout guidance and
  changelog to describe the implemented current-state contract.

## Capabilities

### New Capabilities

- `mobile-responsive-layout`: Measured portrait-phone/tablet classification, semantic content lanes,
  adaptive gutters, optional-column eligibility, public exports, ownership boundaries, and focused
  automated verification.

### Modified Capabilities

<!-- None. The responsive contract extends the typed theme and shared-component seams without
changing the existing mobile-theming requirements or the native navigation contract. -->

## Impact

- `mobile/src/theme/`: responsive breakpoint, gutter, lane-width, and resolver exports.
- `mobile/src/components/`: measured responsive hook/container and focused tests.
- `docs/mobile/tablet-quick-wins.md`: proposed foundation language becomes the implemented contract;
  downstream screen ownership remains unchanged.
- `docs/mobile/architecture-book/theming.md` and `CHANGELOG.md`: binding current-state layout rule
  and its rule-change record. This is the only expected sensitive surface.
- No dependency, native/store configuration, API contract, generated client, server, schema,
  deployment, workflow, or legacy Flutter change.
