## Context

The tablet foundation and three route-polish changes already own the responsive implementation. This final change is an integration and evidence pass: it reconciles the route matrix against those merged changes and retains their existing lane, safe-area, navigation, accessibility, and phone-parity decisions.

The shared Activity native journey is the one narrow executable correction. On iOS, a changed-row selector was visible and targeted after scrolling, but a single tap produced no route transition. Its former location-text wait was also not a route oracle: the same location is rendered in the Activity row, while the row's accessibility label can hide that child text from XCUITest. The resolved details screen already exposes `event-details-responsive-owner`, a stable test ID that is absent from Activity and from loading/not-found outcomes.

## Goals / Non-Goals

**Goals:**

- Make every matrix row describe shipped portrait behavior or an explicit no-change disposition.
- Keep evidence tied to focused tests and actual native outcomes rather than predicted checks.
- Make both actionable Activity row transitions recover from a no-change tap and assert a details-only destination.
- Keep the regression enforceable through a focused static Jest suite and strict OpenSpec validation.

**Non-goals:**

- No new responsive primitive, production component change, route, native configuration, dependency, generated client, migration, or device policy.
- No landscape, multitasking, sidebar, optional-column, or legacy Flutter work.
- No claim of local simulator or physical-device execution where the host cannot provide it.

## Decisions

### D1 — Reconcile the existing matrix in place

The tablet quick-wins matrix remains the single route inventory. Rows are updated from proposed behavior to the actual implementation and focused evidence, rather than duplicating that inventory in a second report.

### D2 — Preserve the three implementation workstreams as the code owners

This final pass does not reopen the responsive production files. It records the scheduling, onboarding/calendar-source, and settings/utility outcomes already delivered and limits executable rework to the shared Activity E2E proof exposed by integrated native regression.

### D3 — Retry only a tap that produced no hierarchy change

Each actionable Activity-row `tapOn` uses Maestro's `retryTapIfNoChange` option. This avoids unconditional double activation: a successful transition is left alone, while the observed iOS no-change outcome gets a second activation attempt.

### D4 — Prove the route before proving its data

After each actionable row tap, the flow waits for `event-details-responsive-owner`. That selector mounts only for resolved event details, so it proves both navigation and successful data resolution. A subsequent location assertion retains the seeded-content round-trip proof. The static test requires this ordered sequence for the new and changed fixture rows.

## Verification

- Focused Activity selector Jest suite, including the red-before-green route-oracle regression.
- Maestro configuration parsing with the pinned local CLI.
- Strict OpenSpec validation for all active and archived packages.
- TypeScript/lint checks scoped to the touched mobile test file, plus diff and disclosure hygiene.
- Exact-head native iOS E2E is required before review acceptance; this host does not claim local simulator execution.
