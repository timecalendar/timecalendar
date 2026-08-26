# 4 — Production v4 cutover

## 4.1 v4 is an update, not a new app

The React Native app keeps `fr.samuelprak.timecalendar` and version `4.0.0`. Apple and Google will
treat it as the next build of the existing Flutter listing only if identity, signing and build
numbers are continuous. Existing users then receive it as a normal store update.

The framework migration is invisible to the stores; data migration and behavior are not invisible
to users. The cutover therefore needs a production-candidate rehearsal, not merely a successful
EAS build.

## 4.2 Candidate flow

1. Select an exact protected release SHA after parity, migration and release CI are green.
2. Set the user-facing version deliberately (`4.0.0` for the initial cutover).
3. Build a **production-channel** iOS and Android candidate with remote build-number incrementing.
4. Submit those exact production build IDs to TestFlight/Play internal first.
5. Exercise upgrade-from-Flutter on physical devices, migration success, login, calendars,
   notifications, OTA identity and Crashlytics.
6. On iOS, select that processed TestFlight build for App Review. On Android, promote the same AAB
   release from internal testing toward production. Do not rebuild an “equivalent” artifact.
7. Complete metadata, privacy declarations, review notes and release notes in the stores.
8. After approval, start a small staged rollout and watch crash-free rate, migration success and
   support signals before widening.

Preview builds listen to the `preview` OTA channel, and a future `beta` build would listen to
`beta`. **A candidate for the store is built with the `production` channel from the start** and
rehearsed as itself. Promoting a `preview` or `beta` binary to the production track would leave
customers permanently on a non-production update channel — and Play's console offers exactly that
promotion, one click from the closed-testing release you were just testing. Do not use it.

“Build once” means one production-channel artifact is tested and then promoted **within the
production lane** — internal track, then production track, same binary. It never means a preview
or beta artifact becomes production.

## 4.3 What changes between preview and production

| Concern           | Store preview                 | Production candidate                                    |
| ----------------- | ----------------------------- | ------------------------------------------------------- |
| App identity      | Existing production identity  | Same                                                    |
| Native signing    | Real store-compatible signing | Same accepted signing chain                             |
| OTA channel       | `preview`                     | `production`                                            |
| Audience          | The team                      | Internal rehearsal, then reviewed staged public rollout |
| Build source      | Recorded green SHA            | Annotated release tag on a commit reachable from `main` |
| Rollout authority | Internal group/track          | Human-owned store release act                           |

## 4.4 Rollback is containment plus a forward fix

Stores do not provide an instant binary downgrade to every user. Before release, rehearse:

- **Before broad rollout:** pause/halt the staged release and investigate.
- **JavaScript-only compatible defect:** roll back or publish a corrected signed OTA to the
  production channel, following the OTA runbook.
- **Native or migration defect:** stop rollout and submit a new higher-numbered native build.
- **Flutter fallback:** retain the legacy signing/release assets and prove the current Flutter
  source can still satisfy store requirements. A fallback is another higher-numbered store
  release, not restoration of the old listing state.

Never use OTA to reverse an irreversible database migration or to load code incompatible with the
installed native fingerprint.

## 4.5 Production go/no-go record

The release record should contain:

- approved SHA/tag, EAS build IDs and store build numbers;
- bundle/package identity and signing fingerprints;
- CI/Reviewer evidence on the exact SHA;
- physical-device upgrade-from-v3 evidence on both platforms;
- migration success and crash-free thresholds with named observers;
- OTA channel/runtime fingerprint and rollback target;
- metadata/privacy/export-compliance completion;
- rollout percentages, observation windows, stop thresholds and the human operator.

The build and PR may be autonomous under repository policy. Uploading, store submission and
starting/widening production rollout remain separate human-owned deploy acts.

## Official references

- [Expo: EAS Submit behavior](https://docs.expo.dev/deploy/submit-to-app-stores/)
- [Apple: TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)
- [Expo: remote build-version management](https://docs.expo.dev/build-reference/app-versions/)
