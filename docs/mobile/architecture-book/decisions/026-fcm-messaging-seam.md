# 026 — Keep FCM behind the Firebase seam

## Status

Accepted.

## Decision

Use native Firebase Messaging through `@/firebase`, including one top-level background
handler. On iOS, obtain APNs permission before requesting an FCM token. Feature code does
not import the native package. Expo Push is not part of the delivery path.

## Consequences

Native setup and listener lifecycle stay centralized. Real receipt in foreground,
background, and terminated states requires release-build device verification.

## Revisit if

The backend delivery provider changes or Expo offers equivalent direct-FCM behavior.
