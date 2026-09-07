## Why

The shared compact-header and root-page primitives now exist, but most non-tab destinations still assemble safe areas, measured lanes, top spacing, captions, and empty states independently. Applying the contract across the complete root and onboarding route inventory will remove duplicated route headings and make every ordinary push destination feel intentional without disturbing its list, keyboard, refresh, pagination, deep-link, or platform-presentation behavior.

## What Changes

- Inventory every root and nested-onboarding route discovered under `mobile/src/app/`, and make each route's visible-header or explicit-exception posture test-enforced.
- Give every ordinary root and onboarding push destination a localized compact native title with a minimal chevron-only back affordance; preserve the headerless tab shell, redirects, branded onboarding landing, development transition route, and deliberate sheet/platform presentation differences.
- Adopt `RootPage` and caption-only `PageIntro` across settings destinations, activity/history and management collections, personal-event routes, event details, About, Feedback, changelog, and applicable onboarding/import steps while retaining each screen's existing scroll, list, safe-area, keyboard, refresh, pagination, overlay, and native-header-action owners.
- Remove oversized in-content copies of route titles. Keep only supporting captions or content-level section headings, using the shared spacing, typography, and color contract.
- Normalize loading, empty, and error placement below native chrome, reusing `EmptyState` where a full-screen collection state fits while preserving localized meaning, accessibility order, stable selectors, and all feature behavior.
- Extend focused route-structure and screen tests, update the binding Architecture Book guidance and changelog, and record native rendering checks in a non-blocking device-pass inbox note.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-root-page-primitives`: Expand the compact-header, page-frame, intro, empty-state, and route-inventory contract from representative consumers to every user-visible non-tab root and nested-onboarding destination.
- `mobile-onboarding-flow`: Make the welcome surface an explicit headerless brand exception while ordinary school/import journey pushes use localized compact native headers and shared page rhythm.
- `mobile-feedback`: Move the route heading exclusively into native chrome and retain the explanatory copy as a caption within the shared readable page frame.
- `mobile-personal-events-ui`: Adopt the shared root-page and empty-state composition for the standalone list while preserving form/list behavior, keyboard ownership, CRUD actions, and selectors.

## Impact

- `mobile/src/app/_layout.tsx`, `mobile/src/app/onboarding/_layout.tsx`, and route-structure tests: complete root and nested-route classification.
- `mobile/src/features/**/ui/`: presentation-only adoption across the named settings, activity, management, personal-event, details, About, Feedback, changelog, and onboarding/import screens, plus focused tests and EN/FR title wiring where missing.
- `docs/mobile/architecture-book/`: update the binding navigation/page-adoption guidance, testing evidence, changelog, and device-pass inbox record. This is the only sensitive surface touched.
- No API or generated-client changes, server or database changes, native/store/EAS configuration, dependency changes, deployment/CI configuration, secrets, new routes, or legacy Flutter work.
