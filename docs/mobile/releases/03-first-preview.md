# 3 — First preview release: TestFlight and Play internal

## 3.1 Chosen path

The first preview goes through the existing stores:

- **iOS:** App Store Connect → TestFlight → internal group **The team**;
- **Android:** Play Console → internal testing → **The team** tester list/group.

This rehearses the production identity, signing, upload and install path. It also means an installed
preview replaces the public TimeCalendar app on the same phone; the two builds share the same bundle
ID/package and cannot coexist.

## 3.2 Current config is not yet the chosen path

`mobile/eas.json` currently has:

- `preview`: `distribution: "internal"`, iOS ad hoc `.ipa`, Android `.apk`, OTA channel `preview`;
- `production`: `distribution: "store"`, store `.ipa`/`.aab`, OTA channel `production`;
- Android submit target `internal` under the `production` submit profile.

TestFlight accepts only a store-distribution build, and Play accepts an `.aab`, not the current
preview APK. Reusing the current `production` profile for ordinary preview would bake in the
production OTA channel. Before the first preview, implement the **store-distributed internal
profile** specified by the build-infrastructure
[workflow contract](../build-infrastructure/03-workflow-contracts.md#32-mobile-internal-build).

That contract provisionally names the profile `internal-store` and retains the current `preview`
profile for direct installation. Repurposing or renaming `preview` requires the deliberate,
ADR-backed configuration change described there. This touches `mobile/eas.json` and possibly
`mobile/app.config.ts`, so it is a sensitive native/store-config change and needs its own reviewed
implementation ticket. It must not contain credentials.

## 3.3 One-time owner bootstrap

Complete these in order after that profile exists:

1. **Inventory the live stores.** Record the highest Android version code and iOS build number,
   current Apple team/app IDs, package/bundle ID and Play signing fingerprints.
2. **Resolve Android signing.** Play App Signing is confirmed enabled. Record the public app-signing
   and upload-certificate fingerprints, then follow [document 2](./02-signing-and-credentials.md) to
   recover the accepted upload key or complete an upload-key reset before starting a Play build.
3. **Initialize EAS remote versions.** The repo uses `appVersionSource: "remote"`; initialize each
   platform from the highest live-store value with `eas build:version:set`, then let the store
   preview profile auto-increment. Flutter's repo says `3.1.0+134`, but the live consoles—not that
   historical file—are authoritative.
4. **Configure EAS-managed signing.** For iOS, authenticate to the correct Apple team and let EAS
   create or select a distribution certificate/profile. For Android, import/select the accepted
   upload key; never create an unrelated replacement unless a Play reset is in progress.
5. **Configure submission identities.** Record Apple ID/team/app IDs. Create a least-privilege Play
   service account for EAS Submit and keep its JSON in EAS/Vaultwarden or ephemeral operator
   storage, never in git.
6. **Create tester groups.** TestFlight internal testers must be App Store Connect users; Apple
   supports up to 100 internal testers. Create **The team** and enable the desired distribution
   behavior. Create the Play internal tester list/group with the same human-facing name.
7. **Build both platforms from one recorded, green SHA.** Record SHA, profile, EAS build IDs,
   version/build numbers, fingerprints and artifact URLs.
8. **Submit those exact build IDs.** Do not run a second build during submission.
9. **Install and verify on physical devices.** Confirm launch, API environment, authentication,
   migration behavior available at this phase, push/Crashlytics expectations, displayed version
   and OTA channel/runtime fingerprint.

Actual build and submit commands are intentionally not hard-coded until the store-preview profile
name lands. The operator should select the explicit profile and recorded build IDs, not “latest.”

## 3.4 What Expo needs from the owner

| Need                                                  | Why                                    | Once or recurring?   |
| ----------------------------------------------------- | -------------------------------------- | -------------------- |
| Login to the personal Expo account owning the project | Run/configure EAS                      | Initial + recovery   |
| Authorized Apple Developer access                     | Create/select iOS signing credentials  | Initial/rotation     |
| App Store Connect app/team identifiers                | Target the existing app                | Initial, then stable |
| Accepted Android upload key or completed reset        | Sign an upload Play accepts            | Initial/rotation     |
| Play service-account authorization                    | Let EAS Submit upload                  | Initial/rotation     |
| Live store version counters                           | Avoid duplicate/lower build rejection  | Initial sync         |
| Tester membership                                     | Deliver internal builds                | As team changes      |
| Explicit submit/rollout approval                      | A store upload/release is a deploy act | Every release        |

Expo does **not** need the owner's Apple password stored in git or CI. It does not need the Android
app-signing private key when Google already holds it under Play App Signing. It does not need
production infrastructure or the future Mac runner to create the first manual EAS preview.

## 3.5 Preview acceptance evidence

The first preview is complete only when:

- both stores accepted a build for the existing app identity;
- a named physical iPhone and Android phone installed it through the store testing path;
- the recorded build numbers exceed previous uploads;
- Play-delivered signing fingerprint matches the expected app-signing certificate;
- the build identifies the approved SHA/profile/channel without relying on “latest”;
- a compatible preview OTA and a deliberately incompatible fingerprint case are exercised when
  the OTA service is ready;
- no secret or private key appears in git, build logs or issue comments.

## Official references

- [Expo: TestFlight distribution](https://docs.expo.dev/submit/testflight/)
- [Apple: add TestFlight internal testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/)
- [Expo: submit to Google Play](https://docs.expo.dev/submit/android/)
