## Why

The app supports portrait iPads and Android tablets, but its screens currently mix full-window geometry, an undifferentiated 800-point cap, and uncapped content. A shared responsive contract and an explicit route inventory are needed before the parallel tablet workstreams can improve the UI without regressing phones, navigation, or calendar behavior.

## What Changes

- Add a small container-measured responsive layout contract with semantic compact/tablet modes, adaptive gutters, readable/standard/full-bleed content lanes, and reusable alignment primitives.
- Apply the contract screen by screen across Home, Calendar, personal events, onboarding/imports, Settings/management, and utility surfaces; preserve full width where extra canvas carries information.
- Keep native navigation, safe-area ownership, platform modal conventions, accessibility order, keyboard behavior, localization, and all business/data behavior unchanged.
- Commit `docs/mobile/tablet-quick-wins.md` as the implementation and final-regression ledger, including every route, ownership boundaries, responsive rule, and explicit no-change decisions.
- Add focused responsive tests at representative phone, iPad portrait (768/834/1024 points), and Android portrait-tablet (800 dp) widths.

## Capabilities

### New Capabilities

- `mobile-responsive-layout`: Container measurement, semantic width lanes and gutters, screen-level tablet behavior, presentation rules, and responsive verification for every supported route.

### Modified Capabilities

None. The change alters presentation only; existing feature, navigation, storage, and API behavior remains normative.

## Impact

- Shared mobile UI/theme seams: `mobile/src/components/`, `mobile/src/theme/`, and focused component tests.
- Feature UI only under `mobile/src/features/**/ui/`, plus thin route/shell configuration where presentation options already live in `mobile/src/app/`.
- Architecture guidance in `docs/mobile/architecture-book/` and the committed audit at `docs/mobile/tablet-quick-wins.md`.
- No dependency, API/generated-client, database/schema, native configuration, orientation, landscape, multitasking, or legacy Flutter changes.
