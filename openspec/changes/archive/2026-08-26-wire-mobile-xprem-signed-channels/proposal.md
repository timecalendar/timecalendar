## Why

Preview and production binaries still poll Expo's hosted update endpoint, and locally built
binaries do not carry a reliable channel. With the pinned xprem app and public trust root now
available, TimeCalendar can move both release lanes to its self-hosted server while making forged
or unsigned updates fail closed.

## What Changes

- Initialize the existing Expo app with the pinned `eoas` v3.1.2 client, review its generated
  configuration, and normalize it to the repository's dynamic-config and environment conventions.
- Point release builds at `https://ota.timecalendar.app/manifest` and send the xprem app id,
  build-time channel, and empty branch override through `updates.requestHeaders`.
- Make `OTA_CHANNEL` the single declarative source for `preview` and `production` builds, remove
  the duplicate `channel` keys from `mobile/eas.json`, and keep development on Metro with automatic
  OTA disabled.
- Embed `mobile/codesigning/certs/certificate.pem` with xprem/Expo's exact `main` /
  `rsa-v1_5-sha256` verification metadata, while retaining the public EAS project id solely for
  EAS Build/Submit linkage.
- Add focused config validation and reproducible fingerprint experiments proving whether channel
  header values affect runtime compatibility and that a native-affecting input still changes the
  fingerprint.
- Update the operator guide, Architecture Book, ADR 037, rule changelog, and Phase 10 roadmap with
  the final endpoint/header/certificate/fingerprint contract and recorded evidence.
- Keep publishing, channel administration, rollout/rollback, store submission, infrastructure,
  Flutter maintenance, and real-device verification out of scope.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-distribution`: Replace hosted EAS Update delivery and profile-owned channels with signed
  xprem delivery, build-time request-header channels, and explicit development disablement.
- `mobile-architecture-book`: Bind current guidance and ADR 037 to the concrete client endpoint,
  headers, certificate verification, and empirical fingerprint result.

## Impact

- Sensitive native/store configuration: `mobile/app.config.ts`, `mobile/eas.json`, the public
  certificate path, private-key ignore rules, and `.fingerprintignore` only if empirical evidence
  proves a narrow correction is necessary.
- Validation/tooling: focused config proof, project-local Expo Updates fingerprint commands, Expo
  config/prebuild rendering, TypeScript, lint/format, CI-equivalent mobile checks, and an explicit
  `APP_VARIANT=development` declaration on the existing generic Expo type-generation CI step.
- Documentation: `mobile/EAS.md`, `docs/mobile/architecture-book/eas.md`, ADR 037,
  `CHANGELOG.md`, and the Phase 10 roadmap.
- No OpenAPI/generated-client, database migration, server, Terraform/Kubernetes, EAS/GitHub build
  or publish workflow, Firebase configuration, store credential, publish/channel/rollback
  automation, or legacy Flutter change. The existing mobile CI workflow changes only to identify
  its generic config render as development/Metro mode; it supplies no release channel.
