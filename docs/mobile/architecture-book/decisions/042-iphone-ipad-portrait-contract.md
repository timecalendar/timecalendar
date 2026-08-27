# 042 — Support iPhone and iPad in portrait-only full-screen mode

## Status

Accepted.

## Context

The existing App Store app supports both iPhone and iPad. App Store Connect does not allow an
update to remove a device family supported by the previous version, but the Expo app omitted
`ios.supportsTablet` and generated an iPhone-only target. The resulting 4.0.0 preview upload was
rejected before review.

TimeCalendar remains portrait-only. Under Expo SDK 56, a tablet app that supports iPad
multitasking must also declare both landscape orientations, which conflicts with that behavior.
The native projects are CNG output and are not source-controlled.

## Decision

- TimeCalendar supports iPhone and iPad in development, preview, and production.
- Both device families remain portrait-only and full-screen. iPad Slide Over and Split View are
  deliberately disabled.
- `mobile/app.config.ts` is the source of truth through `orientation: "portrait"`,
  `ios.supportsTablet: true`, and `ios.requireFullScreen: true`. Generated Xcode projects and
  plists are never hand-edited or committed.
- `mobile/app.config.test.ts` proves the source contract for every variant. From `mobile/`,
  `npm run verify:ios-device-contract` performs a disposable clean preview prebuild and proves
  the application target resolves device families `1,2`, requires full screen, and exposes only
  portrait iPad orientations.
- This native-affecting change moves the fingerprint runtime version. A corrected preview needs
  a fresh signed iOS binary and cannot be delivered to the rejected or previous native shell by
  OTA update.

## Consequences

- iPad remains supported for App Store continuity, but side-by-side multitasking is unavailable.
- Source-config tests provide a fast CI gate; the disposable prebuild command separately guards
  Expo-to-Xcode/plist generation without making `mobile/ios/` source.
- Removing tablet support, full-screen mode, or portrait orientation fails an automated gate.
- This decision authorizes no build, upload, or App Store Connect submission. Those remain
  separate release operations.

## Rejected alternatives

- **Ship an iPhone-only update:** violates the existing App Store device-family contract.
- **Keep iPad multitasking:** Expo SDK 56 would require landscape orientations.
- **Patch Xcode or Info.plist output:** `expo prebuild --clean` would discard the change.
- **Exclude the config from fingerprinting:** could deliver native-incompatible OTA bundles.

## Revisit if

- Product deliberately adopts landscape layouts and iPad multitasking.
- Apple changes the update continuity rule for previously supported device families.
- A later Expo SDK can support portrait-only iPad multitasking without the current orientation
  requirement.
