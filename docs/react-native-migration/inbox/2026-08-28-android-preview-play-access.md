# (HUMAN: Play internal tester list + device verification on both platforms)

**Status:** pending operator action · **Owner:** TimeCalendar account owner
**Context:** [release document 3](../../mobile/releases/03-first-preview.md) §3.5 acceptance, §3.6
iOS record, §3.8 Android record

Both halves of the first preview are now uploaded: iOS `4.0.0 (142)` on TestFlight (internal group
**The Team**, §3.6) and Android `4.0.0 (138)` on the Play internal track (§3.8, shipped 2026-09-07).
What remains needs a Play Console click or a phone in a hand.

## 1 — ~~Create the Play service account for EAS Submit~~ — done 2026-09-07

- [x] Service account `eas-submit@timecalendar-samuelprak.iam.gserviceaccount.com` created with no
      Google Cloud role; Play Console grants it *release to testing tracks* + *view app information*
      for `fr.samuelprak.timecalendar` only.
- [x] Key placed at repo-root `ci/keys/eas-android-sa-key.json` on the build host (gitignored, not in
      EAS). `eas submit --platform android` authenticated with it and uploaded versionCode 138.
- [ ] Record its identity (client email, project `timecalendar-samuelprak`) in the password manager —
      identity only, never the JSON.

## 2 — ~~Read the two Play Console values an agent cannot see~~ — done 2026-09-07

- [x] Highest live Android version code: **137** on production (Play API). EAS remote counter set to
      `137`; the preview build took `138`.
- [x] App-signing certificate SHA-256 `4646f746…` / SHA-1 `df64f864…`, read from Play Console → *App
      integrity* and recorded in §3.8. Play's expected upload certificate matches §3.7 (`99f82ae8…`).

## 3 — Create the Play internal tester list

The Play API shows no tester group attached to the internal track, and Play offers no API for email
lists — this is a console click.

- [ ] Play Console → *Test and release* → *Testing* → *Internal testing* → *Testers* tab: create (or
      confirm) the **The team** email list, matching the TestFlight internal group name, add the
      testers, save. Release `4.0.0 (138)` is already on that track; the opt-in link appears once a
      list is attached.

## 4 — Physical-device verification (both platforms, §3.5)

This is the §3.5 line an agent cannot satisfy on any host: it needs a named phone and a human
looking at it. Both platforms can be done now (Android after item 3).

- [ ] **iPhone (named device).** Install `4.0.0 (142)` from TestFlight, internal group **The Team**.
- [ ] **Android phone (named device).** Opt in through the internal-testing link, install
      `4.0.0 (138)` from Play.

For each device record:

- [ ] the device model and OS version, and that install came through the store testing path;
- [ ] the app launches and reaches its first screen;
- [ ] the API environment it talks to matches the profile's `BACKEND_ENVIRONMENT_CAPABILITY`
      (`preview` → preproduction by default);
- [ ] the displayed version/build matches §3.6 / §3.8;
- [ ] the OTA channel reads `preview`.

Android only — this closes the §3.5 "Play-delivered signing fingerprint matches" line, which the
Play API cannot answer: with the phone on `adb`, pull the installed APK and compare its signer
against the app-signing certificate recorded in §3.8 (SHA-256 `4646f746…`). An agent can run this
step once the phone is connected; say so and it will be done.

Note that installing the preview **replaces** the public TimeCalendar app on that phone — same
package/bundle ID, they cannot coexist (§3.1).

## Out of scope here

- OTA fingerprint cases (a compatible `preview` update and a deliberately incompatible one) wait on
  the OTA service; they are tracked with that work, not here.
- Internal/testing tracks only. No external TestFlight Beta App Review, no App Store review, no Play
  production or open-testing release. Nothing was promoted between Play tracks.
- The `expo doctor` warnings seen during the Android build (Hermes V1 regression on `expo@56.0.11`,
  minor dependency drift) are dependency maintenance, tracked separately.

Store upload, tester distribution and any production rollout are deploy acts. Run them only under
the release approval current at that time.
