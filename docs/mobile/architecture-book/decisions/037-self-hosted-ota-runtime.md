# 037 — Self-host OTA updates and apply them at foreground boundaries

## Status

Accepted.

## Context

TimeCalendar needs bundle-level updates without hosted-update pricing, while preserving native
compatibility and avoiding interruptions during active student use. The existing production
platform already operates Postgres, and Crashlytics already provides client crash observability.
The client now has a deployed xprem endpoint, app identifier and public signing certificate. The
private signing key remains encrypted in xprem's database-key store.

## Decision

- Self-host xprem in control-plane mode, using the existing production Postgres service for its
  control-plane data and Cloudflare R2 for update assets. Do not deploy ClickHouse; retain
  Crashlytics as the client observability system.
- Sign updates and retain Expo's fingerprint runtime-version policy, so a downloaded bundle can
  run only on a native-compatible build.
- Keep launch non-blocking. Downloaded updates apply silently only after the app has entered the
  background and subsequently returns to the foreground, at most once per JavaScript runtime.
- Operate channel promotion and progressive rollout from xprem during release and incident work:
  channel pointers and rollout percentages are imperative, deliberately. Git records the release
  procedure and resulting history, but reconciliation must not undo an incident-time rollback.
- Release binaries use `https://ota.timecalendar.app/manifest` and send `expo-channel-name` from
  required build input `OTA_CHANNEL`, `expo-app-id: e89170b9-5b32-44f0-8f78-33eadb60ec28`, and an
  empty `xprem-branch`. `eas.json` supplies `preview` / `production` and contains no second
  `channel` authority; development disables automatic updates.
- Release binaries verify every downloaded update with
  `mobile/codesigning/certs/certificate.pem`, key id `main`, algorithm `rsa-v1_5-sha256`. xprem
  alone holds the corresponding private key. `extra.eas.projectId` remains independent public
  metadata for EAS Build/Submit.
- SDK 56 fingerprint resolution intentionally produces separate preview/production versions on
  iOS and Android because the channel header is part of resolved native `expoConfig`. No
  `.fingerprintignore` excludes app config; a scratch `ios.buildNumber` control changed the iOS
  fingerprint, confirming native-affecting changes remain protected. Exact commands and hashes
  live in `eas.md`.

Publishing, channel administration, rollout, rollback and device verification remain separate
delivery/operator work; none is automated by this client-wiring decision.

## Consequences

- Store builds start their cached or embedded bundle immediately while compatible updates are
  checked and downloaded in the background.
- A failed foreground reload is reported once and falls back to a later cold launch instead of
  entering a reload loop.
- xprem depends on production Postgres and R2 availability, but does not add a second analytics
  database.
- Missing or invalid `OTA_CHANNEL` fails release config resolution instead of silently selecting
  production, and preview/production remain separate runtime-compatibility lanes.

## Revisit if

- Crashlytics cannot provide the bundle-level diagnostics needed to operate OTA safely.
- The production Postgres or R2 dependency becomes a material availability or cost concern.
- Product requirements call for user-confirmed updates instead of silent boundary application.
