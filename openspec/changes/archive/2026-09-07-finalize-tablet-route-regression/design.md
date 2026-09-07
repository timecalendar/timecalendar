## Context

The tablet foundation and three route-polish changes already own the responsive implementation. This final change is an integration and evidence pass: it reconciles the route matrix against those merged changes and retains their existing lane, safe-area, navigation, accessibility, and phone-parity decisions.

The shared Activity native journey is the one narrow executable correction. On iOS, a changed-row selector was visible and targeted after scrolling, but a single tap produced no route transition. Its former location-text wait was also not a route oracle: the same location is rendered in the Activity row, while the row's accessibility label can hide that child text from XCUITest. The resolved details screen already exposes `event-details-responsive-owner`, a stable test ID that is absent from Activity and from loading/not-found outcomes.

Exact-head regression also exposed iOS system transitions before Activity could run. One artifact showed the About deep link's first confirmation dismissed before the operating system re-presented it, so the existing replay tap needed a settle boundary. A later exact-head artifact showed both optional confirmation taps complete while SpringBoard remained foregrounded and the About UI arrived only after the destination wait expired. The flow therefore also needs one destination-gated replay of the acknowledged link.

## Goals / Non-Goals

**Goals:**

- Make every matrix row describe shipped portrait behavior or an explicit no-change disposition.
- Keep evidence tied to focused tests and actual native outcomes rather than predicted checks.
- Make both actionable Activity row transitions recover from a no-change tap and assert a details-only destination.
- Keep the existing About deep-link replay tap late enough to dismiss a delayed iOS confirmation, then replay the link once only while the stable About destination remains absent.
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

### D5 — Settle the iOS system transition and gate one About link replay

The About flow retains two optional `Open` taps and `waitForAnimationToEnd` between them. The first handles the ordinary custom-scheme confirmation. The settle boundary allows a delayed SpringBoard replay to appear before the second optional tap is evaluated; when no replay occurs, the optional tap remains inert. If `about-responsive-content` is still absent after both taps, the flow reissues the same link once and handles its optional confirmation. The stable destination owner is then observed before content assertions, and static coverage locks the ordering and gate.

### D6 — Replay an acknowledged iOS onboarding link only while its destination is absent

The iCal import flow uses the established destination-gated replay pattern after its first iOS onboarding deep link. Once the initial transition settles, it reissues the same link only when the stable Welcome title is still absent, then handles the optional confirmation again. This covers an acknowledged `openLink` that leaves SpringBoard foregrounded without replaying a link that already reached onboarding.

### D7 — Let calendar-add reconciliation finish before stopping the Activity fixture

The Activity journey keeps the application process alive when it returns from the newer-calendar import and immediately routes to Settings. Adding that calendar reopens a pagination chain that the one-row baseline legitimately completed. Stopping the process as soon as the Calendar destination appeared could interrupt that asynchronous ownership reconciliation; the next launch then treated the expanded calendar set as its initial observation and retained the stale completed-chain state. Keeping the root lifecycle mounted preserves the production ownership path without adding a test-only reset or weakening the page-two assertion.

### D8 — Dismiss the Android keyboard permission after the action that triggers it

The clean AOSP emulator does not present its keyboard contacts dialog immediately after text input. It presents the dialog only after the institution Continue action is activated. The Android-only optional dismissal therefore runs between the primary Continue tap and the existing optional same-id retry. This keeps the shared journey semantic, leaves devices that have already answered the keyboard prompt unchanged, and lets the retry perform the application action after the system modal has closed.

### D9 — Budget the iOS health job for the complete shared flow set

The exact-head iOS job completed its cold build and executed shared flows for more than 42 minutes before the existing 75-minute job ceiling cancelled it without a failing Maestro command. The health job receives a 120-minute ceiling, with a workflow-contract assertion locking that budget. This changes only the diagnostic CI controller; it does not change native configuration, dependencies, application behavior, or the manual/scheduled health-signal policy.

## Verification

- Focused Activity selector Jest suite, including the red-before-green route-oracle regression.
- Maestro configuration parsing with the pinned local CLI.
- Strict OpenSpec validation for all active and archived packages.
- TypeScript/lint checks scoped to the touched mobile test file, plus diff and disclosure hygiene.
- Exact-head native iOS E2E is required before review acceptance; this host does not claim local simulator execution.
