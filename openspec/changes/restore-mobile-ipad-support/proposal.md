## Why

The React Native preview currently resolves to an iPhone-only native target, while the existing App Store app supports both iPhone and iPad. App Store Connect therefore rejected the signed 4.0.0 preview because an update may not drop a previously supported device family; TimeCalendar's product contract remains iPhone and iPad support.

## What Changes

- Explicitly enable tablet support in the Expo iOS source configuration while retaining portrait-only, full-screen behavior on both iPhone and iPad; iPad multitasking is intentionally disabled because Expo otherwise requires landscape orientations.
- Extend the development, preview, and production config tests so device-family and orientation intent cannot regress.
- Add a repeatable clean-preview-prebuild check that inspects generated iOS output for `TARGETED_DEVICE_FAMILY = "1,2"` and portrait-only iPad orientations without committing generated native projects.
- Record the iPhone+iPad platform contract as an ADR and synchronize the Architecture Book, operator guide, roadmap pointer, and rule changelog.
- Recompute the authoritative iOS preview and production runtime fingerprints and document that this native configuration change requires a fresh signed binary rather than an OTA update.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-distribution`: Release and development iOS configuration must preserve the existing iPhone+iPad device-family contract, keep both device families portrait-only/full-screen, provide source and generated-native regression proof, and record the resulting fingerprint/fresh-binary consequence.
- `mobile-architecture-book`: The durable iPhone+iPad support and portrait-orientation rule must be recorded in the Architecture Book and ADR index with pointers to its automated enforcement.

## Impact

- Sensitive native/store source configuration: `mobile/app.config.ts`.
- Verification: `mobile/app.config.test.ts` plus a repository-owned generated-native check that operates on clean, disposable prebuild output.
- Binding/operator documentation: `docs/mobile/architecture-book/`, `mobile/EAS.md`, and the Phase 01 roadmap step.
- No API, database schema, dependency, credential, Firebase, EAS profile, workflow, infrastructure, store-submission, generated-native, or legacy Flutter change.
