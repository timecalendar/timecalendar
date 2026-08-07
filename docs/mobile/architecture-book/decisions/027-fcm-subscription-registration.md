# 027 — Register notification subscriptions from local state

## Status

Accepted.

## Decision

Notification preferences in MMKV are the source of truth because the backend exposes
PUT but no GET. Registration sends the current preferences, FCM token, server calendar
IDs, and the localization pair read through two effective accessors: `locale` is the app's
effective language (explicit settings preference, else device detection) and `timezone` is
the device IANA zone with `Europe/Paris` as fallback — a future timezone preference
overrides only the accessor body, never the assembly. It skips a null token, sends an
empty calendar list when appropriate, and repeats after preference, token, calendar,
language, or device-timezone changes (every cold start re-PUTs as backstop).

## Consequences

The operation is idempotent and self-healing. Foreground failures are accessible and
retryable; background failures are recorded.

## Revisit if

The backend gains a readable subscription resource or server-owned preferences.
