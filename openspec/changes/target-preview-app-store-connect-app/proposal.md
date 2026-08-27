## Why

The committed iOS `preview` submit profile currently passes the literal string
`$EXPO_ASC_APP_ID` to EAS, leaving a store upload ambiguously targeted at submission time.
The existing TimeCalendar App Store Connect app has the stable public identifier `1479613630`,
so the profile must encode that destination before the signed preview release operation proceeds.

## What Changes

- Set `submit.preview.ios.ascAppId` to the deterministic string `1479613630` while leaving the
  production submit profile unchanged.
- Keep the Apple account and team values environment-backed; commit no credentials or private
  signing material.
- Strengthen the focused mobile config test so it rejects an unresolved preview app-id placeholder
  and proves the production submit shape did not change.
- Synchronize the directly affected EAS and first-preview release documentation with the committed
  preview target and the boundary between a public app identifier and credential values.
- Require a direct `jq` assertion, focused Jest proof, local-green checks, and exact-head CI before
  implementation is handed onward for human-reviewed merge.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-distribution`: The iOS preview submit profile must deterministically target existing App
  Store Connect app `1479613630`, while Apple authentication/account/team inputs remain outside git.

## Impact

- Sensitive native/store submission configuration: `mobile/eas.json`.
- Regression proof: `mobile/app.config.test.ts`.
- Current-state and operator documentation: `docs/mobile/architecture-book/eas.md`, `mobile/EAS.md`,
  `docs/mobile/releases/03-first-preview.md`, and `docs/mobile/releases/05-readiness-and-gaps.md`.
- Store submission behavior is Tier H and requires human review and merge, but this change performs
  no build, signing, upload, submission, tester assignment, or production distribution action.
- No API contract, generated client, database schema/migration, dependency, Firebase, credential,
  certificate, infrastructure, workflow, generated native project, or legacy Flutter change.
