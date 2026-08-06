# 027 — Register notification subscriptions from local state

## Status

Accepted.

## Decision

Notification preferences in MMKV are the source of truth because the backend exposes
PUT but no GET. Registration sends the current preferences, FCM token, and server calendar
IDs. It skips a null token, sends an empty calendar list when appropriate, and repeats after
preference, token, or calendar changes.

## Consequences

The operation is idempotent and self-healing. Foreground failures are accessible and
retryable; background failures are recorded.

## Revisit if

The backend gains a readable subscription resource or server-owned preferences.
