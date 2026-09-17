## Why

The owned Day/Week calendar is still bound to a portrait-only, full-screen native policy and does not coordinate complete width/height geometry replacement. Students can therefore lose the clock context they were inspecting, or receive stale pager/header/pinch completion, when a phone rotates or a tablet window is resized.

## What Changes

- Replace the source-owned Expo orientation/full-screen contract with landscape-capable, resizable iPhone/iPad behavior while preserving both device families, iOS 16.4, Android API 24, CNG/disposable prebuild ownership, and the fingerprint runtime policy.
- Replace timed-viewport width and height atomically from one measured geometry revision; snapshot the committed date, mode, scale, and visible clock anchor; then clamp and restore that clock anchor against the new inset-aware viewport.
- Invalidate or settle pager, dated-header, vertical-scroll, and pinch work from the previous geometry before callbacks can mutate the replacement layout.
- Retain one automatic-inset native vertical owner, one native pager with three pages, aligned one/five/seven-column header and grid geometry, and a reachable 24:00 boundary after width-only, height-only, and combined changes.
- Extend deterministic reducer/component/repository-contract proof and record a fresh compatible runtime fingerprint, disposable generated-native contract evidence, shell navigation/chrome smoke results, and the complete revision-bound owner checklist.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-calendar-timeline`: Day/Week gains atomic, stale-safe, clock-anchor-preserving resize behavior across rotation and compact/medium/expanded native windows.
- `mobile-distribution`: iPhone/iPad source and disposable-prebuild requirements change from portrait-only full-screen to the approved landscape-capable resizable contract while retaining device families, OS floors, and fingerprint isolation.
- `mobile-architecture-book`: Current-state documentation and the indexed platform-support decision must describe and enforce the resizable native contract instead of the superseded portrait-only rule.

## Impact

- Affects `mobile/app.config.ts`, `mobile/app.config.test.ts`, the iOS device-contract assertion and disposable-prebuild script, the Calendar screen/controller and owned renderer geometry/cancellation seams, focused tests, `mobile/calendar-owned-shell.contract.test.ts`, and current Architecture Book/ADR records.
- `mobile/app.config.ts` is a sensitive native/store/EAS surface. The change requires compatible fingerprint evidence and a fresh native binary for device testing; it cannot ship to an incompatible installed shell as an OTA update.
- Adds no dependency, second renderer, generated native source, stored-event change, OpenAPI/generated-client change, server migration, deployment/CI workflow change, or legacy Flutter change.
