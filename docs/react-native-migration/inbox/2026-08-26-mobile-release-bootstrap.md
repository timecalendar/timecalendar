# (HUMAN: Bootstrap the first React Native store preview)

**Status:** pending operator action · **Owner:** TimeCalendar account owner
**Guide:** [`docs/mobile/releases/`](../../mobile/releases/README.md)

This note is the human-only counterpart to the release documentation. It does not block source
development. It becomes a gate only when TimeCalendar is ready to build and distribute the first
React Native preview through TestFlight and Play internal testing.

## Before the build

- [x] Confirm Play App Signing is enabled: Play signs releases, the app-signing key is in use and
      an upload-key certificate exists.
- [ ] Record the public app-signing and upload-certificate SHA-256 fingerprints. *(Upload
      certificate done — recorded in [release document 3](../../mobile/releases/03-first-preview.md)
      §3.7. The app-signing certificate is still a Play Console read.)*
- [x] Recover the accepted Android upload key or complete Google's upload-key reset. *(Nothing was
      lost and no reset was requested: the held upload key is imported into EAS-managed
      credentials, §3.7.)*
- [ ] In Vaultwarden, record Expo account recovery/custody, EAS project ownership, Apple team/app
      IDs, Play account/package, public fingerprints and credential rotation owners. Never paste a
      private key or service-account JSON into this note.
- [ ] Confirm the highest live Android version code and iOS build number; initialize EAS remote
      versions from those values.
- [ ] Confirm the reviewed store-distributed preview profile described in
      [release document 3](../../mobile/releases/03-first-preview.md) has landed.
- [x] Configure EAS-managed iOS signing on the correct Apple team and Android signing with the
      accepted upload key. *(iOS via the shipped preview, §3.6; Android via the upload-key import,
      §3.7.)*
- [ ] Configure least-privilege App Store Connect / Play submission authorization outside git.
      *(App Store Connect done — EAS holds the API key and it submitted build 142. The Play service
      account is still missing and is the item that gates the whole Android half; see
      [`2026-08-28-android-preview-play-access.md`](./2026-08-28-android-preview-play-access.md).)*
- [ ] Create or confirm **The team** internal tester group/list in both stores.
- [ ] While authenticated to the public EAS project, validate both release profiles on both
      platforms with `npx eas-cli@20.1.0 config --platform <ios|android> --profile
    <preview|production> --json`. The source-side config test and clean prebuild proof are green;
      this CLI command is recorded here because it requires `eas login` or an `EXPO_TOKEN`, neither
      of which belongs in git or unauthenticated CI.

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
