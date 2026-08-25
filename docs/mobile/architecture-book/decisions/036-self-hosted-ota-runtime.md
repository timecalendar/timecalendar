# 036 — Self-host OTA updates and apply them at foreground boundaries

## Status

Accepted.

## Context

TimeCalendar needs bundle-level updates without hosted-update pricing, while preserving native
compatibility and avoiding interruptions during active student use. The existing production
platform already operates Postgres, and Crashlytics already provides client crash observability.
The endpoint, xprem identifiers, signing material, and deployment automation are not available
yet, so this record fixes the architecture without inventing those inputs.

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

The concrete update endpoint, request headers, xprem app identifiers, certificate paths, private
keys, deployment resources, and publish workflow remain deferred to their delivery changes.

## Consequences

- Store builds start their cached or embedded bundle immediately while compatible updates are
  checked and downloaded in the background.
- A failed foreground reload is reported once and falls back to a later cold launch instead of
  entering a reload loop.
- xprem depends on production Postgres and R2 availability, but does not add a second analytics
  database. Later delivery work must supply signing and endpoint inputs before publishing.

## Revisit if

- Crashlytics cannot provide the bundle-level diagnostics needed to operate OTA safely.
- The production Postgres or R2 dependency becomes a material availability or cost concern.
- Product requirements call for user-confirmed updates instead of silent boundary application.
