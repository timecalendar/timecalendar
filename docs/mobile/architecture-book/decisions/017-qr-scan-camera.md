# 017 — Scan calendar sources with Expo Camera

## Status

Completed implementation record.

The calendar-source feature uses `expo-camera` for QR URLs, requests camera-only permission,
and disables Android audio recording permission. A pure parser validates scanned values
before the normal calendar-import path handles them. Real scanning remains a device check.
