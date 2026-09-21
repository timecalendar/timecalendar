---
kind: ticket
id: T07
epic: E03
status: planned
traces-to: [P03, P04, D01, D03, D04, D05]
depends-on: [T01, T05]
size: L
confidence: medium
---

# T07 — Native notification frequency and days-ahead controls

## Outcome

The notification page uses native switches and choice flows for frequency and days ahead,
including custom whole numbers from 1 through 30, with shared save status.

## Scope

Compose the page with T01's native controls and T05's shared status/retry. Frequency and
horizon open pushed checkmarked lists on iOS and radio dialogs on Android. Choices commit
immediately, with native Back on iOS and dismissal after selection on Android. Days-ahead
choices are 1, 3, 7, 14, 30, and Custom. Custom opens a proper iOS native sheet with numeric
field and Cancel/Done, or an Android native numeric dialog with Cancel/Save. Keep a local
draft until confirmation; numeric keyboard type is not validation.

Retain saved values and frequency/horizon choices while notifications are off. Provide
French/English copy for calendar changes and the fixed Paris schedule. Frequency, presets,
and custom entry belong to one complete notification screen; no intermediate control
migration is required.

## Non-goals

Permission management, expanding the numeric range, reminder semantics, changing the server
schedule, or reproducing the existing custom iOS overlay.

## Definition of done
- iOS uses grouped native sections and single-choice checkmarks; Android uses native list
  rows and a single-choice radio dialog. No select control remains for frequency.
- Opening and cancelling a choice surface causes no write; selection updates local state
  immediately and shared sync status survives leaving the child route.
- The switch represents subscription intent and makes no device-permission claim.
- Daily copy says 19:00 Paris time. Immediate copy does not promise instant delivery; current
  server processing runs every five minutes. Horizon copy describes covered calendar changes.
- Reconcile relevant specs and translations with these semantics.
- Existing integers 1..30 survive. Preset-equivalent values select the preset; other values
  display as Custom with the saved number. Parent summary shows the effective number of days.
- Opening Custom causes no preference write. Cancel, Back, and swipe dismissal discard the
  draft; Done/Save persists locally and submits through the shared runtime exactly once.
- Blank, fractional, nonnumeric, and out-of-range input cannot save; provide understandable
  localized validation without silently clamping invalid input into a valid saved value.
- Preset changes commit immediately. Reopening Custom starts from the effective saved value.
- Labels and plurals work in French/English; update relevant specs with the exact range and
  draft/commit behavior. Shared status remains visible after dismissal.

## Acceptance and verification

Test each existing frequency value, current selection, dismissal without change, preserved
preferences while off, and parent-visible pending/error/retry after child unmount. Confirm
the DTO and server schedule remain unchanged. Owner checks native presentation,
large text, accessible selected state, FR/EN, light/dark, and navigation before release.

Test all presets, existing custom values including boundaries, pasted invalid input, empty
draft, cancel/reopen, and a single commit on Done/Save. Confirm failed sync retains the local
choice and shared retry status. Run edited tests and the
[mobile gates](../../roadmap.md#verification-convention). Owner checks keyboard, explicit
confirmation reachability, swipe/Back, large text, and accessible errors on both platforms.

## Likely work sites and reading

`mobile/src/features/notifications/ui/`, notification preference hooks, settings routes and
layout, native chrome components, and FR/EN catalogs. Add an iOS frequency route as needed.
Read [D01](../../decisions/D01-native-presentation.md),
[D05](../../decisions/D05-schedule-and-acceptance.md), and the T01/T05 contracts.

`mobile/src/features/notifications/ui/`, notification preferences, settings routes, native
chrome numeric-entry boundaries, and FR/EN catalogs. Add native custom-entry composition as
needed; inspect existing text-entry APIs without treating a custom overlay as the iOS target.
Read [D01](../../decisions/D01-native-presentation.md),
[D05](../../decisions/D05-schedule-and-acceptance.md), and the shared navigation/status contract.

## Size and confidence drivers

L: one screen with two bounded choice flows and a custom-number draft. Existing native
composition and sync contracts come from T01/T05. Medium confidence: sheet/keyboard/dismissal
behavior needs device proof, especially the explicit iOS numeric-entry confirmation.

## QA and sensitive surfaces

Server acknowledgment must not appear as permission approval. Native layout requires owner
inspection; component mocks cannot establish pixel accuracy.

Accidental dismissal must never commit a partial number. The horizon describes upcoming
calendar changes, not a promise to send an event reminder a selected number of days early.
