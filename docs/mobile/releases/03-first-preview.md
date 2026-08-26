# 3 — First preview release: TestFlight and Play internal

## 3.1 Chosen path

The first preview goes through the existing stores:

- **iOS:** App Store Connect → TestFlight → internal group **The team**;
- **Android:** Play Console → internal testing → **The team** tester list/group.

This rehearses the production identity, signing, upload and install path. It also means an installed
preview replaces the public TimeCalendar app on the same phone; the two builds share the same bundle
ID/package and cannot coexist.

## 3.2 The config now matches the chosen path

`mobile/eas.json` has:

- `preview`: `distribution: "store"`, store `.ipa` + Android `.aab`, `autoIncrement`, OTA
  channel `preview`, with a matching `submit.preview` targeting Play's internal track;
- `production`: `distribution: "store"`, store `.ipa`/`.aab`, OTA channel `production`.

TestFlight accepts only a store-distribution build and Play internal testing needs an `.aab`, so
`preview` is store-distributed too (ADR [040](../architecture-book/decisions/040-local-store-builds-and-store-preview.md)).
It keeps its own `preview` channel, so it never bakes in the production OTA channel.

An earlier design kept `preview` as a direct-install profile and added a separate `internal-store`
profile beside it. That was dropped: there is no audience for a direct-install `.apk` or ad hoc
`.ipa`, so a second profile was pure bookkeeping. `development` remains the only non-store
profile, and it is a dev-client artifact rather than a release.

## 3.3 One-time owner bootstrap

Complete these in order:

1. **Inventory the live stores.** Record the highest Android version code and iOS build number,
   current Apple team/app IDs, package/bundle ID and Play signing fingerprints.
2. **Wire up Android signing.** Play App Signing is enabled and the upload key is held and backed
   up in three places. Record the public app-signing and upload-certificate fingerprints, then
   import the held upload key into EAS-managed credentials per
   [document 2](./02-signing-and-credentials.md). **Do not request an upload-key reset** — nothing
   is lost.
3. **Initialize EAS remote versions.** The repo uses `appVersionSource: "remote"`; initialize each
   platform from the highest live-store value with `eas build:version:set`, then let `preview`
   auto-increment. Flutter's repo says `3.1.0+134`, but the live consoles—not that historical
   file—are authoritative.
4. **Configure EAS-managed signing.** For iOS, authenticate to the correct Apple team and let EAS
   create or select a distribution certificate/profile. For Android, import/select the accepted
   upload key; never create an unrelated replacement unless a Play reset is in progress.
5. **Configure submission identities.** Record Apple ID/team/app IDs. Create a least-privilege Play
   service account for EAS Submit and keep its JSON in EAS/Vaultwarden or ephemeral operator
   storage, never in git.
6. **Create tester groups.** TestFlight internal testers must be App Store Connect users; Apple
   supports up to 100 internal testers. Create **The team** and enable the desired distribution
   behavior. Create the Play internal tester list/group with the same human-facing name.
7. **Build both platforms from one recorded, green SHA**, locally on the macOS host:
   `eas build --profile preview --platform ios --local` and the same for `android`. Record the
   SHA, profile, version/build numbers, runtime fingerprint, artifact paths **and the host's
   Xcode/Node/JDK/CocoaPods versions** — a local build ignores the toolchain fields in
   `eas.json`, so the host's versions are the only record of what produced the binary.
8. **Submit those exact artifacts** with `eas submit --profile preview --path <artifact>`. Do not
   run a second build during submission.
9. **Install and verify on physical devices.** Confirm launch, API environment, authentication,
   migration behavior available at this phase, push/Crashlytics expectations, displayed version
   and OTA channel/runtime fingerprint.

The operator selects the explicit profile and the recorded artifact path, never “latest.” The
exact commands are in [`mobile/EAS.md`](../../../mobile/EAS.md).

## 3.4 What Expo needs from the owner

| Need                                                  | Why                                    | Once or recurring?   |
| ----------------------------------------------------- | -------------------------------------- | -------------------- |
| Login to the personal Expo account owning the project | Run/configure EAS                      | Initial + recovery   |
| Authorized Apple Developer access                     | Create/select iOS signing credentials  | Initial/rotation     |
| App Store Connect app/team identifiers                | Target the existing app                | Initial, then stable |
| The held Android upload key, imported into EAS        | Sign an upload Play accepts            | Initial/rotation     |
| Play service-account authorization                    | Let EAS Submit upload                  | Initial/rotation     |
| Live store version counters                           | Avoid duplicate/lower build rejection  | Initial sync         |
| Tester membership                                     | Deliver internal builds                | As team changes      |
| Explicit submit/rollout approval                      | A store upload/release is a deploy act | Every release        |

Expo does **not** need the owner's Apple password stored in git or CI. It does not need the Android
app-signing private key when Google already holds it under Play App Signing. It does not need
production infrastructure, a CI pipeline, or a paid plan — the build runs on the owner's own
macOS host and consumes no EAS build quota.

## 3.5 Preview acceptance evidence

The first preview is complete only when:

- both stores accepted a build for the existing app identity;
- a named physical iPhone and Android phone installed it through the store testing path;
- the recorded build numbers exceed previous uploads;
- the recorded host toolchain versions are attached to the release record;
- Play-delivered signing fingerprint matches the expected app-signing certificate;
- the build identifies the approved SHA/profile/channel without relying on “latest”;
- a compatible preview OTA and a deliberately incompatible fingerprint case are exercised when
  the OTA service is ready;
- no secret or private key appears in git, build logs or issue comments.

## Official references

- [Expo: TestFlight distribution](https://docs.expo.dev/submit/testflight/)
- [Apple: add TestFlight internal testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/)
- [Expo: submit to Google Play](https://docs.expo.dev/submit/android/)
