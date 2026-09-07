## Why

The portrait-tablet quick-wins epic needs one final integrated record after its foundation, scheduling, onboarding, calendar-source, settings, and utility changes land. Without that reconciliation, several matrix rows still describe future work even though the shipped implementation and focused regression suites already establish their disposition.

## What Changes

- Reconcile every route in the tablet quick-wins matrix with the implementation that shipped through the three tablet-polish workstreams.
- Replace future-tense verification plans with the focused phone/tablet evidence that now protects each route, while recording device-only evidence accurately.
- Preserve the integrated application implementation, responsive ownership, portrait-only product boundary, native configuration, dependencies, generated clients, migrations, and legacy application unchanged.
- Strengthen the existing Activity Maestro journey so actionable rows retry a tap only when it produced no hierarchy change and prove navigation with a resolved-event-details-only selector before checking seeded content.
- Add a focused static regression that locks the Activity row-to-details oracle for both new and changed rows.
- Let the first iOS About deep-link confirmation transition settle before its existing optional replay tap, preventing a delayed system prompt from masking the route regression suite.

## Capabilities

### New Capabilities

- `mobile-tablet-regression`: final matrix reconciliation and route-specific integrated regression requirements for the supported phone and full-screen portrait-tablet surfaces.

### Modified Capabilities

<!-- none; this final pass records and proves the behavior delivered by the preceding tablet changes -->

## Impact

- **Documentation:** `docs/mobile/tablet-quick-wins.md` records implemented dispositions and evidence for all audited routes.
- **E2E proof:** the shared Activity flow gains a deterministic route-transition oracle, and the About flow handles the observed delayed iOS system-prompt replay; no production UI or data behavior changes.
- **Contracts and configuration:** no API, generated client, database migration, dependency, native/store/EAS/Firebase configuration, deployment workflow, or legacy Flutter change.
- **Risk:** a content-only assertion can pass on the Activity list or disappear from the iOS accessibility tree, so the flow must anchor the resolved details screen itself before asserting seeded details content.
