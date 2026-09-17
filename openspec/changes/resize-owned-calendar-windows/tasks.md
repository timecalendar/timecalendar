## 1. Replace the source-owned native window contract

- [ ] 1.1 Update `mobile/app.config.ts` to declare the Expo all-orientation/resizable policy for every variant while retaining `ios.supportsTablet: true`, iOS 16.4, Android API 24, existing app identities, Firebase files, EAS/OTA authorities, and fingerprint runtime policy; verify the complete development/preview/production shape in `app.config.test.ts`.
- [ ] 1.2 Update the device-contract parser self-test and disposable clean-preview prebuild verification to prove iPhone+iPad families `1,2`, portrait plus both landscape orientations, no effective iPad full-screen requirement, and the unchanged deployment floor; include applicable Android unlocked/resizable generated-output proof without committing `mobile/ios/` or `mobile/android/`.
- [ ] 1.3 Recompute the repository-prescribed SDK 56 preview/production runtime fingerprints for affected iOS/Android lanes, compare them with the accepted T06 predecessor, prove native config remains fingerprinted, and record the exact hashes and fresh-binary consequence without publishing an OTA, submitting, or promoting a build.

## 2. Define coherent resize geometry

- [ ] 2.1 Add a hook-free feature-private resize model that normalizes one timed-viewport width/height/inset geometry, advances a monotonic geometry revision, snapshots date identity/mode/renderer generation/scale/raw offset/usable-center clock anchor coherently, and returns an unchanged object for an identical normalized measurement.
- [ ] 2.2 Reuse the T06 inset-aware clock-coordinate helpers to solve and clamp the replacement raw offset at the new usable viewport center while preserving scale; add 100% statement/branch coverage and deterministic tables/properties for width-only, height-only, combined, compact/medium/expanded, zero/non-zero inset, finite recovery, 00:00, and reachable 24:00 cases.

## 3. Make geometry replacement a motion boundary

- [ ] 3.1 Wire one complete timed-viewport layout measurement through the shell/canvas/coordinator so header lane width, pager width, viewport height, and vertical bounds consume the same geometry revision; keep one automatic-inset native `ScrollView`, one native `PagerView`, and exactly three pages.
- [ ] 3.2 On geometry replacement, cancel queued vertical settlement, pending transition work, old native-owner epochs, pager/header progress, and active pinch work before applying the replacement offset without animation; tag/gate pager selection/idle, header progress, scroll settlement, zoom settlement, and delayed frame callbacks by renderer generation plus geometry revision.
- [ ] 3.3 Preserve the screen/controller's selected date, explicit Day/Week mode, shared zoom, and clock anchor through replacement without persisting raw offset or issuing a resize-driven date/mode/accessibility announcement; verify rapid repeated resize and stale completion orderings with reducer snapshots and focused renderer tests.

## 4. Preserve responsive Calendar and shell behavior

- [ ] 4.1 Extend renderer tests for complete aligned one-, five-, and seven-column header/grid geometry across representative compact, medium, and expanded widths, including width-only and height-only changes, while rejecting partial columns, a column scroller, a width-driven mode switch, or a second renderer.
- [ ] 4.2 Extend Calendar screen/controller and repository-contract suites to retain automatic insets, three pages, one vertical owner, synchronized dated headers, weekend preference behavior, Agenda/details access, zoom controls, 24:00 reachability, and stale pager/scroll/pinch rejection after resize.
- [ ] 4.3 Add deterministic shared root/tab/navigation/chrome smoke coverage appropriate to the app-wide native policy, reusing existing Maestro journeys and lower-level selectors rather than adding a fourth top-level flow.

## 5. Reconcile the Architecture Book and decision record

- [ ] 5.1 Revise ADR 042 in place because its landscape/resizing revisit fired; update the decision index, `runtime.md`, `eas.md`, `calendar.md`, `testing.md`, Architecture Book `CHANGELOG.md`, and affected migration-roadmap current-state wording to describe source/CNG ownership, device-family and OS-floor preservation, compatible fingerprints/binaries, automatic insets, and the host/device evidence boundary.
- [ ] 5.2 Update the canonical T07 execution-evidence section only with results actually produced, and create a dated `docs/react-native-migration/inbox/` note tagged `(HUMAN: ...)` for any credential-bound binary install, signing-console, or unavailable device step; do not turn a human-only step into an implementation blocker or claim it passed.

## 6. Verify locally and prepare the exact-build acceptance gate

- [ ] 6.1 From `mobile/`, run `npm test -- --runTestsByPath` for every edited suite plus the app-config, device-contract self-test, focused resize/renderer/screen, route/chrome, and `calendar-owned-shell.contract.test.ts` suites; run the applicable pure resize coverage command and record exact commands/results.
- [ ] 6.2 Run `npm run verify:ios-device-contract`, any added disposable Android contract command, `npx tsc --noEmit`, `npm run lint`, scoped Prettier checks, `npm run react-doctor:changed`, and the device-free Maestro selector/harness proof; treat the repository contract and generated-device assertions as the CI proof tests and keep the three-journey inventory unchanged.
- [ ] 6.3 Produce or identify a fresh compatible fingerprinted native test binary through the authorized build path, then record revision, fingerprint, build, fabricated setup, device/OS/type, and actual phone rotation plus compact/medium/expanded window results; where execution is unavailable, record only the canonical explicit intermediate deferral to T28.
- [ ] 6.4 Supply the complete owner checklist for both-way rotation, repeated tablet resizing, drag/pinch interruption, other-tab navigation/chrome, height-only 24:00 reachability, and touched T05/T06 regressions against that exact build; pause on this same ticket for explicit owner acceptance and address feedback before Reviewer merge.
