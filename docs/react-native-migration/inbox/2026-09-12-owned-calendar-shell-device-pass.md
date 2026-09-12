# (HUMAN: owner device verification) T01 owned Calendar shell

**For:** the human owner (physical-device rendering and assistive-technology verification).

## What I need

Verify the T01 Calendar shell and retained Agenda/details journey on a fresh development install,
then record the device model, OS version, platform, build kind, tested revision, and each checklist
result in this note.

## Why

The development host has no Android emulator or iOS simulator. Jest proves component semantics,
routing, and repository wiring, but cannot prove physical-device mounting, native tab return,
screen-reader output, target sizing, or platform presentation.

## Build and fabricated fixture

- Tested revision: `TESTED_REVISION_PENDING_FINAL_COMMIT`.
- Build kind: local development build; no native dependency or configuration changed in T01.
- Install/launch from the tested revision: run `npm ci` in `mobile/`, then `npm run ios` or
  `npm run android` with a supported device attached.
- Fixture version: `t01-server-import-v1`, the repository's deterministic server-backed import
  fixture used by `mobile/.maestro/01-fresh-user-import.yaml`.
- Setup: start the repository E2E server lifecycle, run the fresh-user import journey once, then
  open Calendar. The fixture event is labelled `E2E Imported Lecture` and is visible in Agenda.
- Reset: uninstall the development app or clear its app data, stop the E2E server lifecycle, and
  repeat from a fresh install. Do not use a personal calendar or production export.

## How to verify

- [ ] Open Calendar: a localized date heading is announced as a heading and the owned canvas
      appears without a crash.
- [ ] Switch to Agenda, open `E2E Imported Lecture`, then return; Agenda and Calendar remain usable.
- [ ] Leave Calendar for another tab and return several times without stale or duplicate content.
- [ ] Confirm Week and Agenda are the only view choices and Add/Today produce visible results.
- [ ] Check light/dark presentation, large text, VoiceOver or TalkBack focus order, and 44pt iOS /
      48dp Android interactive targets.
- [ ] Confirm the stated T01 limits: no event tiles, current-time indicator, paging, vertical hour
      scrolling, hour labels, weekday columns, weekend filtering, day/week switching, gestures, or zoom.

## Results

- Device / OS / platform: pending owner entry.
- Build kind / revision: pending owner entry.
- Checklist results and observations: pending owner entry.
- Acceptance source and date: pending explicit owner acceptance.

## Blocks

The T01 PR remains unmerged pending this checklist and human review. Later renderer tickets remain
paused until T01 is explicitly accepted and merged.
