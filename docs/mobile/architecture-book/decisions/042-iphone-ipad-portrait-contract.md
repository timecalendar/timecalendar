# 042 — Support iPhone and iPad in resizable portrait and landscape windows

## Status

Accepted. Revised by T07 when the landscape and multitasking revisit condition fired.

## Context

The existing App Store app supports both iPhone and iPad, and store continuity prevents removing a
previously supported device family. The owned Calendar now supports rotation and resized tablet
windows. Native projects remain disposable CNG output rather than source.

## Decision

- Development, preview, and production support iPhone and iPad in portrait, both landscape
  orientations, and resizable iPad windows.
- `mobile/app.config.ts` is authoritative through `orientation: "default"`,
  `ios.supportsTablet: true`, and `ios.requireFullScreen: false`. The iOS 16.4 and Android API 24
  floors remain unchanged. Generated native projects are never hand-edited or committed.
- `mobile/app.config.test.ts` proves every source variant. From `mobile/`,
  `npm run verify:ios-device-contract` performs a disposable clean all-platform preview prebuild
  and proves families `1,2`, portrait plus both landscapes, no effective iPad full-screen
  requirement, an unlocked/resizable Android activity, and both deployment floors.
- This native-affecting change moves preview/production iOS/Android runtime fingerprints. Testing
  requires a fresh compatible binary and cannot use an OTA on the previous native shell.

## Consequences

- iPad device-family continuity and side-by-side multitasking are both preserved.
- Source tests provide a fast gate; disposable prebuild checks Expo's generated semantics without
  making `mobile/ios/` or `mobile/android/` authoritative.
- Removing a family, a landscape orientation, resizing, or either OS floor fails automation.
- This decision authorizes no build, upload, submission, publish, promotion, or rollout.

## Rejected alternatives

- **Ship an iPhone-only update:** violates store device-family continuity.
- **Keep full-screen iPad while enabling phone landscape:** does not satisfy resized windows.
- **Switch Week to Day at compact widths:** mutates the explicit user mode.
- **Patch generated projects:** a clean prebuild discards the change.
- **Exclude native config from fingerprinting:** could deliver incompatible OTA bundles.

## Revisit if

- Product changes its supported device families or window classes.
- Store continuity rules change.
- A later Expo SDK changes the generated orientation or resizing contract.
