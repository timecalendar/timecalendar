# OTA runtime — release-device verification

**Date:** 2026-08-25
**Change:** `add-safe-mobile-ota-runtime`
**ADR:** [037](../../mobile/architecture-book/decisions/037-self-hosted-ota-runtime.md)
**For:** Samuel `(HUMAN: physical iOS and Android release-device pass after endpoint and signing work)`

## What I need

After the self-hosted endpoint, channel headers, and signing inputs land, publish a compatible test
update and verify the OTA runtime on a physical iPhone and Android phone using release
configuration:

1. Launch the installed build and allow the update to download while the app remains foregrounded.
2. Confirm the foreground session is not interrupted and shows no progress, prompt, or dialog.
3. Background the app, then return to it and confirm exactly one silent reload applies the update.
4. In Crashlytics, confirm an embedded launch and a downloaded launch carry `otaUpdateId`,
   `otaChannel`, `otaRuntimeVersion`, `otaCreatedAt`, and `otaIsEmbedded` with the expected values.
5. Repeat the complete flow on both platforms and the release profile/configuration intended for
   rollout.

## Why

Jest proves the AppState state machine and Firebase wiring, and Expo config resolution proves the
native configuration shape. This workspace has no emulator/simulator, and only signed published
updates on physical release devices can prove native download, process-boundary reload, and
Crashlytics console arrival.

## How to verify

Record the build/profile, channel, update id, platform/OS, observed reload count, and Crashlytics
key values. A pass requires no foreground interruption, one reload only after a real
background-to-active transition, and correct embedded/downloaded keys on both platforms.

## Blocks

Nothing in this change. This proof is deliberately deferred until endpoint and signing delivery;
it must not block the runtime/config/documentation merge.
