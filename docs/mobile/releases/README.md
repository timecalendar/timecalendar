# Mobile releases — start here

- **Status:** TimeCalendar-specific release guide for React Native v4
- **Written:** 2026-08-26
- **Roadmap:** [Phase 10 — parity, cutover and release](../../react-native-migration/01-roadmap/10-parity-cutover-release.md)
- **Scope:** documentation and readiness audit only; no credential, EAS, store, build or submission action is performed

## The one-minute answer

React Native did not remove Apple and Android signing. **We run the Xcode/Gradle build on our own
macOS host with `eas build --local`, and Expo holds the signing credentials for us.** EAS Submit
then uploads that signed file to App Store Connect or Play Console. Apple and Google still own
testing, review and rollout.

For TimeCalendar, v4 will replace the existing Flutter app, keeping
`fr.samuelprak.timecalendar`. Therefore:

- iOS needs the existing Apple team and app record, but not necessarily the old Mac or the exact
  old distribution certificate. EAS can create a current distribution certificate and provisioning
  profile after an authorized Apple login.
- Android signing continuity is intact. **Play App Signing is enabled**, so Google retains the
  app-signing key, and the owner holds the upload key with three backups. Both halves are
  accounted for; nothing needs resetting.
- the first previews will use **TestFlight internal testing and Play internal testing**, not direct
  EAS install links;
- Expo remains in the owner's personal account for now, with account recovery and credential
  inventory in Vaultwarden;
- the owner performs the one-time account and credential bootstrap; approved automation may run
  repeat builds and submissions later.

This is reassuring overall: the code-side EAS project, production identity, version `4.0.0`, OTA
fingerprint policy and **both store-build profiles** already exist, and the build runs on hardware
we own with no EAS build quota and no paid plan. Android signing is settled. **No repository change
now blocks the first preview** — everything remaining is an operator act with a live console.
[Document 5](./05-readiness-and-gaps.md) turns those facts into a finite checklist.

## Reading order

| #   | Document                                                           | Question answered                                          |
| --- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| 1   | [The release mental model](./01-mental-model.md)                   | What do Expo, Apple and Google each do?                    |
| 2   | [Signing and credential recovery](./02-signing-and-credentials.md) | Which old files matter, and what if they are lost?         |
| 3   | [First preview release](./03-first-preview.md)                     | What is needed for TestFlight and Play internal testing?   |
| 4   | [Production v4 cutover](./04-production-cutover.md)                | How does an internal build become the v4 store update?     |
| 5   | [Readiness and gaps](./05-readiness-and-gaps.md)                   | What exists today, what is unknown, and what happens next? |

## Decisions supplied by the owner

| Decision                 | Answer                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| v4 identity              | Replace the existing Flutter listing                                                                           |
| Apple access             | Apple Developer and App Store Connect access available                                                         |
| Expo ownership           | Keep the current personal Expo account for now                                                                 |
| First preview            | Store-internal first: TestFlight + Play internal                                                               |
| Recovery custody         | Vaultwarden                                                                                                    |
| Operator model           | Owner bootstraps; CI/automation later                                                                          |
| Android Play App Signing | **Confirmed enabled**; Play signs releases, and the owner holds the upload key, backed up in three places |
| Build host               | The owner's macOS host, via `eas build --local` — no EAS build quota, free Expo plan                          |
| Release selection        | Annotated git tags on `main`; no long-lived release branch                                                    |

## Vocabulary

- **Build:** turn source code into a signed `.ipa` (iOS) or `.aab` (Android store).
- **Submit:** upload that already-built file to Apple or Google.
- **Internal testing:** store-hosted preview through TestFlight or Play internal track.
- **Release:** approve a submitted build for public distribution. This remains a separate human
  rollout act.
- **OTA update:** replace compatible JavaScript/assets inside an installed native build. It cannot
  add native libraries or repair signing and store metadata.

**Binding rules** live in the Architecture Book's
[EAS / distribution](../architecture-book/eas.md) page and ADRs
[006](../architecture-book/decisions/006-eas-distribution.md) /
[037](../architecture-book/decisions/037-self-hosted-ota-runtime.md) /
[040](../architecture-book/decisions/040-local-store-builds-and-store-preview.md); the commands
live in the [EAS operator guide](../../../mobile/EAS.md). The [OTA](../ota/README.md) folder is
**exploration** — how that decision was reached — and is not maintained against the config.

See also the
[(HUMAN: first store-preview bootstrap) inbox note](../../react-native-migration/inbox/2026-08-26-mobile-release-bootstrap.md).
