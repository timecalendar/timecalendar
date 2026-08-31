# QR import recovery physical-device pass

> (HUMAN: run on physical iOS and Android development/preview builds after PR #337 reaches a
> device-capable build. This checklist is **non-blocking**: the agent host has no KVM, and Maestro
> cannot inject a camera barcode or reach a parseable iCal import fixture.)

## What I need

Verify the failed-valid-QR recovery controls and lifecycle on physical iOS and Android devices.

## Why

Jest deterministically proves request exclusion, retry, re-arm, navigation, and unmount settlement,
but it cannot prove a native camera session, Back behavior, VoiceOver/TalkBack announcements, or
platform touch-target rendering. The existing Maestro harness cannot drive a scan or make the
backend reject a parseable scanned calendar URL, so a synthetic flow would not test this behavior.

## How to verify

- [ ] On iOS and Android, scan a valid calendar QR while the backend is unavailable. Confirm one
      request runs, the failure is announced, and a QR left in the viewfinder does not auto-retry.
- [ ] Activate **Retry this QR** without aiming again. Confirm success exits the import journey once;
      repeat with the backend still unavailable and confirm the same recovery actions return.
- [ ] Activate **Scan another QR**, aim at a different code, and confirm exactly one new import runs.
- [ ] Enter institution/programme details before scanning. After failure and retry, and after opening
      the manual iCal sibling then returning, confirm the draft remains intact.
- [ ] While an attempt is pending, navigate Back. Confirm late success or failure does not navigate,
      clear the draft, announce a new error, or disturb the previous screen; confirm the camera
      session stops when the QR screen unmounts.
- [ ] With VoiceOver and TalkBack, confirm natural focus order: failure alert → Retry → Scan another
      QR → manual iCal; verify the alert is announced and every control has an unambiguous label.
- [ ] At the largest iOS Dynamic Type and Android font size, confirm text does not clip or overlap and
      controls remain usable. Measure at least 44pt on iOS and 48dp on Android.

## Blocks

Nothing — informational, non-blocking device evidence for PR #337.
