## Why

Notification choices currently persist locally but their remote save lifecycle belongs to whichever hook is mounted: navigating away loses the visible error, duplicate token listeners can issue overlapping PUTs, and a process restart cannot tell whether the latest local intent reached the backend. Students need local choices to remain immediate while one app-lifetime owner durably retries the latest full snapshot until the current backend acknowledges it.

## What Changes

- Replace screen- and trigger-owned subscription mutations with one notification-feature synchronization runtime mounted at the app lifecycle boundary.
- Persist backend-bound dirty and monotonic generation metadata, marking intent dirty before a preference write and rebuilding every request from current preferences, token, locale, effective display zone, and loaded calendars; tokens and payloads are never persisted.
- Serialize PUTs, coalesce intervening changes to the latest snapshot, and accept an acknowledgment only for the current generation and runtime/environment identity.
- Represent shared pending, waiting-for-registration, retryable-error, and acknowledged states across route changes; expose the shared error and manual Retry on the existing notification settings screen.
- Recover durable intent on startup, foreground, prerequisite/input changes, and bounded active retries without adding a generic queue, background service, or connectivity framework.
- Make backend reset cancel notification timers and transport, invalidate old completions, and clear all backend-bound synchronization metadata before the target environment starts.
- Preserve notification permission request timing and behavior. This change does not add permission status, refusal repair, system-settings links, delivery guarantees, or scheduling changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-fcm-subscription`: One app-lifetime runtime becomes the only subscription PUT owner and provides durable latest-state synchronization, readiness-aware DTO assembly, shared status, bounded recovery, and stale-acknowledgment protection.
- `mobile-storage`: Notification synchronization dirty/generation metadata is added to the typed MMKV seam and classified as backend-bound; no token or request payload is persisted.
- `mobile-backend-environments`: Environment reset actively disposes the notification runtime, cancels its work, clears its durable metadata, and prevents old-environment completions from acknowledging new intent.

## Impact

- Notification data ownership changes under `mobile/src/features/notifications/data/`: preference setters mark dirty before mutation, the generated plain PUT function is wrapped by an injectable transport, and registration/screen hooks become inputs and views over the shared runtime rather than independent mutations.
- `mobile/src/app/_layout.tsx` mounts the single runtime beside the existing startup owners; calendar loaded-state/revision, token refresh, locale, effective zone, foreground, and preference changes feed it.
- `mobile/src/storage/index.ts` classifies the new synchronization keys, and the existing environment participant delegates to the live runtime reset/disposal boundary.
- The existing notification settings UI and FR/EN catalogs gain honest remote-save status and Retry copy without a screen redesign.
- Focused unit/integration tests cover controlled request races, crash interleavings, restart replay, prerequisite waiting, retry exhaustion, route remount, foreground recovery, and environment reset.
- The Architecture Book and `mobile-fcm-subscription`, `mobile-storage`, and `mobile-backend-environments` specs document the shared ownership and recovery contract.
- Sensitive surfaces: `openapi/openapi.json`, `mobile/src/api/generated/`, `mobile/firebase/`, native/store configuration, migrations, deploy/CI, and legacy `app/` remain unchanged. The existing generated DTO and API contract are consumed as-is.
