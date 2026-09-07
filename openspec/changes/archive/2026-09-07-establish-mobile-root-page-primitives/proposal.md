## Why

Root Stack destinations currently assemble headers, page spacing, empty states, and primary actions independently, producing duplicated in-content titles, inconsistent button semantics, and form actions that do not share one keyboard-safe placement contract. The shared foundation is needed now so the design-feedback route families can converge on one tested native-first vocabulary while Activity and Hidden events prove it against real loading, error, empty, and list states.

## What Changes

- Add shared root-page and page-intro primitives that compose with the existing measured responsive lanes, native safe-area owners, virtualized lists, and feature-specific content without requiring a second oversized route title.
- Normalize every user-facing non-tab root destination through compact localized Stack defaults with chevron-only back affordances; keep tabs, onboarding, compatibility redirects, and the development import route explicitly headerless, and preserve feature-owned native header actions.
- Add a shared empty-state primitive with centered full-screen and left-aligned section composition, title/caption hierarchy, optional locally bundled artwork, light/dark selection, Dynamic Type, screen-reader semantics, stable test selectors, and no motion.
- Adopt the shared full-screen empty state in Activity and Hidden events without changing Activity loading/error/pagination behavior, Hidden events resolution/list behavior, localized meaning, or existing Maestro anchors.
- Bundle the unDraw “Developer Activity” and “No data” illustrations locally in light/dark primary-token variants, record their official source pages and the unDraw license, and perform no runtime hotlinking.
- Add a semantic primary-action primitive using `primaryStrong` with `onPrimary`, platform minimum targets, disabled and busy semantics, and an API that allows iOS header placement, Android FAB placement, or filled in-content placement to remain feature-owned.
- Add a reusable keyboard-safe form/action owner that keeps a primary action immediately above the keyboard while the form remains independently scrollable, then exercise it through the personal-event editor without changing validation, persistence, deletion, routing, or Maestro selectors.
- Add focused component, route-structure, Activity, Hidden events, and personal-event form tests; update the binding Architecture Book guidance, ADR index/record, and changelog.

## Capabilities

### New Capabilities

- `mobile-root-page-primitives`: Shared root-page framing, page-intro rhythm, illustrated empty-state composition, semantic primary actions, keyboard-safe action ownership, root Stack chrome defaults, and their accessibility and test contracts.

### Modified Capabilities

- `mobile-activity-ui`: Activity uses the shared full-screen illustrated empty state while preserving loading, refresh failure, cached history, pagination, row selection, and selector behavior.
- `mobile-hidden-events`: Hidden-event management uses the shared full-screen illustrated empty state while preserving stale-UID filtering, localized meaning, error reporting, un-hide actions, and list behavior.
- `mobile-personal-events-ui`: The personal-event editor adopts the semantic primary action and shared keyboard-safe form/action owner while preserving CRUD behavior and test selectors.

## Impact

- `mobile/src/components/`: new root-page, empty-state, primary-action, and keyboard-safe form/action modules with focused tests.
- `mobile/src/components/chrome/` and `mobile/src/app/_layout.tsx`: shared compact root Stack defaults plus explicit headerless exceptions; existing feature `Stack.Screen` titles and native actions remain supported.
- `mobile/src/features/activity/ui/`, `mobile/src/features/hidden-events/ui/`, and `mobile/src/features/personal-events/ui/`: representative adoption without data-layer changes.
- `mobile/assets/images/empty-states/`: locally bundled static illustration variants; no new runtime dependency or remote asset request.
- `mobile/src/i18n/locales/`: typed EN/FR title and caption parity for the richer empty-state hierarchy while retaining existing meaning.
- `docs/mobile/architecture-book/`: binding navigation, theming, accessibility, and testing guidance, a load-bearing ADR, and a changelog entry. This is the only sensitive surface touched.
- No OpenAPI/generated-client, server, database/schema, native/store configuration, deployment/workflow, secret, or legacy Flutter change.
