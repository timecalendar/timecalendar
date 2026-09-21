---
kind: product
status: approved
decision: go
---

# Product contract

## Problem and evidence

The owner reports that settings do not match native platform patterns. Source inspection
confirms that appearance, language, time zone, and notification frequency all use the
universal menu picker. Detail pages use labels above controls while the hub uses custom
grouped rows. Android inherits rounded groups and disclosure decoration from that shared
composition. The days-ahead control consists of custom plus/minus buttons.

The same inspection identifies fixed time-zone offsets in translated labels, a ten-zone
manual-selection limit, and notification mutation state owned by individual hook instances.
The latter cannot reliably communicate a failed save after a selection page unmounts.
Evidence is dated and linked in [research/evidence.md](research/evidence.md).

## Users and desired outcomes

### P01 — Settings behave like the user's platform

**Outcome:** iOS users encounter grouped native forms and checkmarked choices; Android users
encounter Material settings rows and radio dialogs. Theme and language changes apply live.

**Acceptance evidence:** Native settings hub plus appearance/language destinations; iOS
inline theme choices and a pushed language selection page; Android radio dialogs for both.
Language choices are Use device language, Français, English. Current values, selected states,
Back, cancellation, French/English copy, both themes, and accessible activation are verified.
The owner performs visual acceptance without a separate QA ticket.

### P02 — Choose a worldwide display zone without understanding zone identifiers

**Outcome:** Use device time zone is a switch. Its dependent row shows the effective zone
and is read-only while automatic mode is on. Manual selection opens offline search over
standard zone names and the chosen library's common cities, including Lyon → Europe/Paris.

**Acceptance evidence:** A tall native iPhone sheet has a close action and native bottom
search on iOS 26; older iOS and iPad adapt natively. Android uses a full-screen search page.
Search handles case, accents, representative French/English names, country names, and zone
identifiers. Empty results are clear. Closing without selecting changes nothing. Selection
persists a named zone, remembers the manual choice, and displays a calculated current offset.
Existing named zones and custom choices survive updates. Displayed event times and push
formatting share the effective zone; all-day dates remain floating.

### P03 — Notification preferences are clear and resilient

**Outcome:** Frequency and event horizon are settings rows. Android uses radio dialogs;
iOS uses checkmarked selection pages. Days-ahead presets are 1, 3, 7, 14, 30, and Custom.
Custom values remain whole numbers from 1 through 30, entered in a native numeric editor
with explicit Cancel/Save or Cancel/Done. The iOS editor is a native sheet.

Preferences persist locally immediately after a selection or custom-value confirmation.
All destinations show the same pending/error status, and unsent intent survives closing
the screen and restarting the app. Retry sends the current desired settings.

**Acceptance evidence:** Existing values such as 12 remain 12; cancellation never writes;
invalid numeric drafts never reach persistence. Offline changes remain visible, can be
retried, and converge to the latest preferences after recovery. A successful earlier request
cannot clear a newer pending edit. Enabling/disabling the subscription retains its frequency
and horizon. The row describes calendar-change notifications, not reminder alarms or device
authorization. Daily scheduling remains 19:00 Paris time for every user.

### P04 — Native polish stays within a bounded project

**Outcome:** Retain existing routes, preference defaults, event storage, and server scheduling.
Use established libraries for time zones. Refresh automatic language only through a small
existing-API listener. Keep permission lifecycle work separate.

**Acceptance evidence:** No new permission prompt flow, denied/provisional state UI, category
management, OS app-language migration, custom time-zone rules, or server scheduling feature.
Device visual verification remains owned by the project owner and is not a standalone ticket.
If automatic language refresh requires a native bridge or larger lifecycle redesign, omit
that optional improvement and document the startup/manual-selection fallback.

## Appetite and constraints

This is a settings project with preference reliability, not a notification-platform rewrite.
No elapsed-time budget was supplied. Scope is controlled through the P04 exclusions and
small independently demonstrable changes. The native minimums remain iOS 16.4 and Android
API 24; both phone and tablet layouts remain supported. Every component retains the existing
feature/data boundaries and the components/chrome boundary for platform-specific Expo UI.

## In scope

Settings hub surfaces; appearance and language; offline worldwide zone search; notification
selection and custom numeric entry; durable subscription synchronization; concise truthful
copy; preference compatibility; a small automatic-language refresh; relevant tests and
architecture/spec reconciliation. New helper routes preserve existing destination URLs.

## Out of scope and non-goals

- Notification permission state machine, changing when permission is requested, Android
  runtime-permission repair, provisional/denied UX, category creation, and system-settings links.
- Notification delivery guarantees, a local reminder feature, or per-user daily delivery times.
- OS app-language synchronization, supported-locale config migration, and new native locale APIs.
- Every city/town in the world, online geocoding, location permission, and handwritten zone data.
- General redesign of calendar management, About, or other non-preference destinations.
- A separate visual QA ticket, tracker operations, branches, commits, PRs, or implementation.

Permission deferral is approved in D04. Its known limitations remain documented.

## Assumptions and unknowns

The selected library covers common-city discovery but not every settlement or translated
spelling. Runtime databases must accept selected names and aliases. Native forms, toolbar
search, and sheet geometry require early device validation. Reliable local intent does not
mean a push can be received without OS permission. Source inspection supports a small
locale listener; device behavior decides whether it stays within the quick-win boundary.

## Alternatives

- Do nothing: lowest cost, leaves the owner's identified native-pattern mismatch unresolved.
- Replace only picker styling: smaller, but leaves hub/detail inconsistency, limited zone
  discovery, custom numeric entry, and disappearing save failures.
- One custom cross-platform settings kit: shares more rendering code but works against the
  approved native-first target and requires hand-maintained platform fidelity.
- Full permission/localization rewrite: broader correctness benefits, but exceeds appetite.

## Risks and kill criteria

Revisit the affected outcome if native APIs cannot deliver the accepted interactions on
supported devices without a large bridge project; if the zone catalog requires maintaining
our own geographic rules; or if reliable preference writes require a broader backend protocol
than the approved appetite allows. Do not silently substitute custom overlays for the native
target or remove custom values to make implementation easier.

## Recommendation

**Go.** The owner has approved the consolidated scope and D01–D05. Permission deferral and bounded language refresh keep the
project coherent while addressing the visible settings problem and the save-recovery gap.

## Approval

Project owner, conversation with Codex, 2026-09-21: native fidelity, the single language
list, common-city zone search, standard libraries, custom day values, manual-zone memory,
resilient saves, fixed Paris delivery, and owner-led visual verification are explicit inputs.
See [README approval log](README.md#approval-log) and decision records for excerpts.
The owner explicitly approved the consolidated scope and D02–D04 on 2026-09-21 by replying
“Approve these choices and continue to roadmap/tickets” to the decision-bearing review
question. This document records that human approval.
