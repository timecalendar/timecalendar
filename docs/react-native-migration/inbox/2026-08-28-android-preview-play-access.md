# (HUMAN: Play Console access for the Android preview + device verification on both platforms)

**Status:** pending operator action · **Owner:** TimeCalendar account owner
**Context:** [release document 3](../../mobile/releases/03-first-preview.md) §3.5 acceptance, §3.7
Android prerequisite record

The iOS half of the first preview shipped (§3.6: `4.0.0 (142)`, internal TestFlight group **The
Team**). The Android half stopped before building, and §3.5 acceptance stays open on the items
below. Everything an agent could do has been done — the held Android upload key is now imported
into EAS-managed credentials and its fingerprint is recorded in §3.7. What remains needs Play
Console / Google Cloud access, or a phone in a hand.

## 1 — Create the Play service account for EAS Submit (unblocks the whole Android half)

This is the single item that gates the rest. Without it EAS cannot authenticate to Play, cannot
read the live version counter, cannot upload, and cannot read back what Play delivered.

- [ ] In Google Cloud Console, create a **least-privilege service account** for the Play developer
      account and download its JSON key.
- [ ] In Play Console → *Users and permissions*, invite that service account and grant it only what
      internal-track submission needs (release to testing tracks for `fr.samuelprak.timecalendar`).
      Do not grant production release or account-admin rights.
- [ ] Register the key with EAS (`eas credentials --platform android` → *Google Service Account*),
      or place it at the path `mobile/eas.json` expects on the build host only. That field reads
      `../ci/keys/eas-android-sa-key.json` — relative to `mobile/`, so the file belongs at
      **`ci/keys/eas-android-sa-key.json` at the repository root**, not under `mobile/`.
      **Never commit it**; the root `.gitignore` entry `ci/keys/` is anchored and covers the
      root directory only — a key dropped at `mobile/ci/keys/` would be both invisible to EAS
      and committable.
- [ ] Record its identity (client email, project) in Vaultwarden — identity only, never the JSON.

Tell the Founding Engineer when this is done. From there the build, the submit and the Play-side
read-back are agent work.

## 2 — Read the two Play Console values an agent cannot see

- [ ] The **highest live Android version code** on the production track. EAS's remote counter is
      still `1`; it must be initialized from the live value before any Android build
      (`eas build:version:set`), or the upload is rejected as a duplicate/lower code. The Flutter
      repo's `3.1.0+134` is historical, not authoritative.
- [ ] The public **app-signing certificate SHA-256** from Play Console → *App integrity*. §3.5
      requires the Play-delivered fingerprint to match it. (The **upload** certificate fingerprint
      is already recorded in §3.7 — `99f82ae8…` / `1a04470a…`. If Play's expected upload certificate
      disagrees with that value, stop and report it: per document 2 §2.3 that means investigating,
      not resetting the upload key.)

Item 1 also satisfies this one — the Play Developer API returns both — so do 1 first if you would
rather not read them by hand.

## 3 — Create the Play internal tester list

- [ ] Confirm or create the **The team** internal testing list/group in Play Console, matching the
      TestFlight internal group name.

## 4 — Physical-device verification (both platforms, §3.5)

This is the §3.5 line an agent cannot satisfy on any host: it needs a named phone and a human
looking at it. iOS can be done now; Android waits on items 1–3.

- [ ] **iPhone (named device).** Install `4.0.0 (142)` from TestFlight, internal group **The Team**.
- [ ] **Android phone (named device).** Install the Play internal-track build once it exists.

For each device record:

- [ ] the device model and OS version, and that install came through the store testing path;
- [ ] the app launches and reaches its first screen;
- [ ] the API environment it talks to matches the profile's `BACKEND_ENVIRONMENT_CAPABILITY`;
- [ ] authentication works (including Google Sign-In on Android — this is the first Android build
      signed through EAS, so it is the first real check that Play's re-signing still matches the
      certificate hashes registered in Firebase);
- [ ] the displayed version/build matches the record in §3.6 / §3.7;
- [ ] the OTA channel reads `preview`.

Note that installing the preview **replaces** the public TimeCalendar app on that phone — same
package/bundle ID, they cannot coexist (§3.1).

## Out of scope here

- OTA fingerprint cases (a compatible `preview` update and a deliberately incompatible one) wait on
  the OTA service; they are tracked with that work, not here.
- Internal/testing tracks only. No external TestFlight Beta App Review, no App Store review, no Play
  production or open-testing release.

Store upload, tester distribution and any production rollout are deploy acts. Run them only under
the release approval current at that time.
