# 039 — Gate bundled Changelog releases with an integer

## Status

Accepted.

## Context

Returning Flutter users need to see the React Native 4.0 rebuild once, fresh installs must
not see historical release notes, and later bundled release notes may arrive through an OTA
update. Flutter stored the integer `current_version`; Phase 09 will import that preference.
A boolean cannot represent multiple future releases, while the installed native app version
would not advance with a JavaScript-only OTA.

## Decision

Keep `CHANGELOG_VERSION` and a newest-first typed release catalog in the JavaScript bundle.
Persist a non-negative safe integer at MMKV key `changelogSeenVersion` through `@/storage`.
An absent or malformed value is seeded to the current integer without presentation; an older
value presents only greater releases; a current or future value skips. Every sheet dismissal
writes the current integer. Mount the gate only at `(tabs)`, outside onboarding.

Phase 09 validates `flutter.current_version` and calls the Changelog feature's exported
`setChangelogSeenVersion` before `(tabs)` first mounts. This preserves Flutter value 3 so the
4.0 sheet appears once, while a future OTA can add content and bump the bundled integer.

## Consequences

Fresh React Native installs are quiet, migrated users receive one relevant presentation, and
future OTA releases can participate without a native build. Every integer bump must include a
matching bundled release, and migration ordering is load-bearing. Native swipe/back dismissal
needs a lifecycle persistence backstop in addition to explicit controls.

## Revisit if

Release notes become server-authored, the app needs audience-specific changelogs, MMKV is
replaced, or Expo Router no longer provides a reliable tabs-mount or modal-dismiss lifecycle.
