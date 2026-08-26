# About screen device pass

The machine-verifiable About work is covered by TypeScript, lint, Jest coverage, route
structure tests, and `.maestro/about.yaml`. A fresh native build is required because this
change adds `expo-application` and updates the application version to `4.0.0`.

## Human device checks

- iOS: verify light/dark rendering, native header/back behavior, safe-area insets, 44pt minimum
  targets, large accessibility text without clipping, and VoiceOver traversal/one link
  announcement per outbound row.
- Android: verify light/dark rendering, native back behavior, ripple feedback, 48dp minimum
  targets, large font/display scaling, and TalkBack traversal/one link announcement per row.
- Both: verify privacy and both developer rows open their exact URL in the in-app browser;
  Contact opens a draft to `hello@timecalendar.app`; installed version and build match the
  binary; the version row is announced as information rather than an action; and About is
  reachable by cold `/about` deep link and through Settings.

This device-only evidence is non-blocking on the current no-KVM host and remains for the
post-merge human pass on fresh iOS and Android builds.
