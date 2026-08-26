# (HUMAN: Bootstrap the first React Native store preview)

**Status:** pending operator action · **Owner:** TimeCalendar account owner
**Guide:** [`docs/mobile/releases/`](../../mobile/releases/README.md)

This note is the human-only counterpart to the release documentation. It does not block source
development. It becomes a gate only when TimeCalendar is ready to build and distribute the first
React Native preview through TestFlight and Play internal testing.

## Before the build

- [ ] Open the existing Play app's **Play app signing** page and record whether it is enabled plus
      the public app-signing and upload-certificate SHA-256 fingerprints. The Play protection /
      Play Integrity dashboard is not sufficient.
- [ ] If needed, recover the accepted Android upload key or complete Google's upload-key reset.
      If Play App Signing is not enabled and the original app-signing key is unavailable, stop and
      escalate before building.
- [ ] In Vaultwarden, record Expo account recovery/custody, EAS project ownership, Apple team/app
      IDs, Play account/package, public fingerprints and credential rotation owners. Never paste a
      private key or service-account JSON into this note.
- [ ] Confirm the highest live Android version code and iOS build number; initialize EAS remote
      versions from those values.
- [ ] Confirm the reviewed store-distributed preview profile described in
      [release document 3](../../mobile/releases/03-first-preview.md) has landed.
- [ ] Configure EAS-managed iOS signing on the correct Apple team and Android signing with the
      accepted upload key.
- [ ] Configure least-privilege App Store Connect / Play submission authorization outside git.
- [ ] Create or confirm **The team** internal tester group/list in both stores.

## Build, submit and verify

- [ ] Select one green, reviewed SHA and record it before building.
- [ ] Build store-preview iOS and Android artifacts through EAS and record their build IDs,
      versions and runtime fingerprints.
- [ ] Submit those exact build IDs to TestFlight internal and Play internal; do not rebuild during
      submission.
- [ ] Install through the store testing path on a named physical iPhone and Android phone.
- [ ] Record launch, production identity/API, login, migration, notifications, Crashlytics and
      displayed version results appropriate to the current migration phase.
- [ ] When the OTA runtime is ready, verify a compatible `preview` update and one deliberately
      fingerprint-incompatible case.

Store upload, tester distribution and any production rollout are deploy acts. Run them only under
the release approval current at that time.
