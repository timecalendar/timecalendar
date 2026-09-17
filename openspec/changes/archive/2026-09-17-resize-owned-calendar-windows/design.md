## Context

T06 leaves the real Calendar route with one automatic-inset native `ScrollView`, one three-page native `PagerView`, a Reanimated dated-header projection, and UI-thread zoom geometry. The screen owns the committed date, Day/Week/Agenda mode, persisted scale, and last settled raw vertical offset. Width is currently measured independently by the header and cancels only horizontal progress; viewport height and insets are overwritten in shared values without a geometry revision. A rotation or resized tablet window can therefore combine old and new measurements, accept callbacks from motion started under the old geometry, or restore a raw pixel offset that no longer represents the same visible clock position.

The native source contract is also intentionally incompatible with T07: `orientation: "portrait"` and `ios.requireFullScreen: true` disable landscape and iPad multitasking. ADR 042, source tests, and the disposable iOS prebuild assertion enforce that old decision. The approved owned-renderer design now requires source-owned landscape/resizing, preserves iPhone+iPad support and the iOS 16.4/Android API 24 floors, and keeps generated native projects disposable. Because this is native-affecting, the fingerprint policy must isolate the change from older binaries.

## Goals / Non-Goals

**Goals:**

- Enable supported portrait and landscape orientations and resizable iPad windows from Expo source configuration while retaining both iOS device families and the established OS floors.
- Replace timed-viewport width and height as one geometry revision, preserving a coherent committed date/mode/scale/clock-anchor snapshot.
- Cancel or settle all work begun under the previous geometry and reject every late pager, header, scroll, or pinch completion from that revision.
- Keep the visible clock coordinate stable when possible, clamp deterministically at 00:00/24:00 when necessary, and preserve automatic native inset behavior.
- Keep one vertical owner, one three-page pager, and aligned one/five/seven-column header/grid presentation at compact, medium, and expanded widths.
- Produce deterministic host proof plus exact generated-native, fingerprint, build, device, and owner-checklist evidence without overstating unavailable hardware results.

**Non-Goals:**

- Redesigning Calendar or other screens for landscape, introducing a width-driven Day/Week mode switch, or adding a second renderer.
- Persisting the selected date or raw vertical offset, changing the shared Day/Week zoom preference, or changing stored event facts.
- Hand-editing or committing generated iOS/Android projects, excluding native configuration from fingerprinting, or delivering this native policy through OTA to an incompatible binary.
- Changing OpenAPI/generated clients, server schema/migrations, deployment/CI workflows, or the legacy Flutter app.

## Decisions

## Decision: Make Expo source explicitly landscape-capable and resizable

`mobile/app.config.ts` will use the Expo all-orientation policy for every variant, retain `ios.supportsTablet: true`, and stop requiring iOS full-screen presentation. The existing `expo-build-properties` values remain the source for iOS 16.4 and Android API 24. Source tests will assert the complete policy for development, preview, and production rather than merely checking one field.

The generated-device verifier will continue to work from a clean disposable preview prebuild. It will require application target families `1,2`, supported portrait plus both landscape orientations, no effective full-screen requirement that disables iPad resizing, and the unchanged deployment floor. If Android generated output is added to this proof, it will assert that the main activity is not locked to portrait or made non-resizable; it will not make generated projects source authority.

ADR 042 is revisited in place because its explicit revisit condition has fired. Current Architecture Book pages, the decision index, migration roadmap wording, tests, and changelog will describe the new contract; historical implementation records remain historical.

Alternatives considered: retaining full-screen iPad while only enabling phone landscape fails split/resized windows; editing Xcode or Android manifests is discarded by clean prebuild; a platform-specific orientation API would duplicate the declarative Expo contract.

## Decision: Treat one timed-viewport layout as the atomic geometry source

The renderer will introduce a feature-private pure resize model. One timed-viewport measurement supplies width and height together and advances a monotonic `geometryRevision` only when the normalized pair changes. Header lane width, pager width, and clock viewport height derive from that committed geometry rather than becoming independently authoritative. Native top/bottom insets remain live inputs from the automatic-inset scroll event and are included in the committed geometry used for vertical bounds.

Before replacement, the coordinator captures one presentation snapshot: committed anchor identity, mode, renderer generation, current bounded pixels-per-hour, current raw offset, old usable viewport center, and the clock hour beneath that center. The reducer returns a new snapshot with the same date/mode/scale/clock anchor and a raw offset solved against the new usable center and inset-aware bounds. Width and height never update through separate React states, and a resize does not itself request a date or mode transition.

The pure model belongs under the existing feature-private renderer boundary because it coordinates native presentation lifecycle rather than reusable calendar domain facts. It remains hook-free and receives all geometry explicitly so reducer snapshots and boundary/property tables are deterministic.

Alternatives considered: storing only raw pixels makes the visible time drift when height/insets change; separate width and height effects permit mixed layouts; `useWindowDimensions` alone describes the window rather than the actual timed viewport beneath native chrome.

## Decision: Preserve the clock coordinate at the usable viewport center

Resize uses the same clock-coordinate equation established by T06. The old clock anchor is `(rawOffset + oldUsableCenterY) / pixelsPerHour`; the new raw offset is `clockAnchor * pixelsPerHour - newUsableCenterY`, clamped to the automatic-inset native range. Scale is unchanged. This preserves the visible clock position for width-only, height-only, and combined changes unless the new viewport makes that position impossible, in which case the nearest 00:00/24:00 bound wins deterministically.

The closing boundary keeps its extra presentation hairline, but scroll bounds derive from the full-day content height and live bottom inset. Tests will specifically cover a height-only replacement at the lower bound so 24:00 remains reachable above native tab chrome.

Alternatives considered: retaining the top raw offset does not preserve the viewed region after height changes; anchoring an arbitrary fixed hour resets student context; disabling automatic insets would regress the accepted native tab-bar contract.

## Decision: A geometry revision is a cancellation boundary for every motion owner

On geometry replacement the coordinator will synchronously invalidate the active interaction revision before applying the replacement snapshot. It will cancel pending request-animation-frame offset settlement, block old vertical and horizontal callbacks, cancel or finalize active pinch state without persisting a stale completion, cancel any pending transition revision, reset the header progress, and recenter the existing pager on its committed middle page. The replacement offset is then applied without animation.

Every discrete completion that can cross the boundary carries or checks the renderer generation plus geometry revision. Pager selection/idle, header progress, scroll settlement, zoom settlement, delayed frame work, and native-owner reopening from an earlier revision are ignored. Fresh drag/pager/pinch ownership begins only in the new revision. App inactivity, generation replacement, preference replacement, and unmount continue to converge on the same cancellation primitives rather than growing separate state machines.

Alternatives considered: waiting for gestures to finish can publish mixed geometry; React batching cannot invalidate UI-thread native callbacks; remounting the entire Calendar screen would reset state and violate the outcome.

## Decision: Keep responsive presentation inside the existing singular renderer

The same three pages and shared ordered column records render at every supported width. Day remains one column; Week remains five or seven according to the stored weekend preference. Header cells and clock columns consume the same committed content lane, so no partial column, independent horizontal column scroller, second header pager, or automatic Week-to-Day switch appears at compact widths. The single native vertical owner retains `contentInsetAdjustmentBehavior="automatic"`, and the native pager remains the only horizontal owner.

Repository-contract coverage will inventory any new resize module by explicit identity and continue to fail alternate renderers, extra native owners, per-frame React state, or generated-project source. Component tests will exercise width-only, height-only, combined, rapid repeated, and gesture-interrupted replacement at one/five/seven columns.

Alternatives considered: changing Week to Day based on width mutates user mode; horizontally scrolling columns creates another motion owner; a tablet-only renderer contradicts the clean native cutover.

## Decision: Bind native and owner evidence to the exact compatible build

Host verification will cover the source config, device-contract parser self-test, clean disposable prebuild, pure resize model, renderer/screen/repository contracts, TypeScript, lint, scoped formatting, and changed-code diagnostics. Runtime fingerprints will be generated with the repository-prescribed SDK 56 commands for affected preview/production lanes and compared with the accepted predecessor without weakening inputs.

Device evidence must name revision, runtime fingerprint, binary/build, device model, OS, physical/simulator status, and compact/medium/expanded dimensions. A compatible fresh native binary—not a JS reload on the prior shell—is required for the canonical rotation/resize checklist. Shared navigation/chrome outside Calendar is smoke-tested because the policy is app-wide. Device installation, signing-console access, or other credential-bound human work is recorded in a dated `(HUMAN: ...)` inbox note; missing device execution is reported honestly and may be deferred only by the explicit T28 path allowed by the canonical ticket.

Alternatives considered: host snapshots cannot establish native multitasking or gesture cancellation; an unversioned video cannot prove the tested code; OTA delivery would bypass the compatibility boundary this change intentionally moves.

## Risks / Trade-offs

- [Expo-generated orientation keys differ between device families or SDK patch versions] → assert semantic support for both landscapes and non-full-screen resizing using the effective iPad key with a generic fallback, while pinning device families and deployment target.
- [Rotation emits several transient layout values] → normalize each complete width/height pair, advance monotonic revisions, and make every replacement idempotent and stale-safe.
- [Insets arrive after layout] → treat inset changes as geometry input, recompute from the preserved clock anchor, and never assume zero inset.
- [A pinch or page callback races the layout event] → bump the geometry revision before recenter/restore and gate every completion on the captured revision.
- [Compact seven-column labels become dense] → retain complete equal columns and existing adaptive label fitting; visual density tuning remains T25 rather than silently changing mode.
- [The native policy affects screens outside Calendar] → include root/tab/navigation/chrome smoke coverage on both platforms and record defects in this slice.
- [The current host cannot run emulator/simulator acceptance] → record deterministic host proof only, prepare exact compatible-build instructions and checklist, and never convert unavailable native evidence into a pass.

## Migration Plan

1. Revisit ADR 042 and update the Expo source contract plus source/generated-device assertions without touching generated projects.
2. Add and exhaustively test the pure geometry snapshot/reducer before wiring it to native lifecycle callbacks.
3. Integrate geometry revisions with the existing coordinator/zoom/header/canvas and then extend screen and repository-contract regressions.
4. Update Architecture Book current state/changelog and migration wording, then run all edited suites and canonical native-contract checks.
5. Generate and record compatible fingerprints, produce the fresh test binary through the authorized release path, and supply fabricated-data device instructions plus the complete owner checklist.
6. Pause on this ticket for explicit owner acceptance of the exact tested build. Address feedback on this branch before Reviewer merge.

Rollback is a coherent source/build rollback to the accepted T06 revision. No persisted data migration is involved; the shared zoom preference and stored events remain readable. A rollback binary uses its own matching runtime fingerprint, and no orientation-only OTA is attempted across incompatible native shells.

## Open Questions

- Exact physical phone/tablet models and OS versions are recorded when device evidence runs; they do not alter the source contract.
- If a supported platform cannot expose a required representative window size on available hardware, only the canonical explicit intermediate deferral to T28 may carry that unexecuted matrix cell. Executed failures remain T07 rework.
