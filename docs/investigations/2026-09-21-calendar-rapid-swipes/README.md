# Rapid calendar swipes on iPhone

Date: 2026-09-21. Status: **diagnosed, paging fix deferred**.

## Owner intent

The React Native calendar on iPhone must accept repeated quick horizontal swipes
without waiting for each preceding animation to finish. Increasing a fixed page
count only postpones the boundary and does not satisfy this requirement.

The owner requests a durable investigation record and removal of the temporary
logs. No pager rebuild, prototype, library replacement, or broader implementation
is authorized by this documentation task. Revisit implementation only when the
owner asks to resume it.

## Diagnosis

The second swipe reaches the native pager while it is still settling onto the
last of three available pages. There is no further page to enter. Only after
`idle` does the calendar accept the week, increment its generation, and replace
the pager around the new week. Two quick swipes therefore produce one advance
in the captured sequence.

## Contents

- [Findings and limits](01-findings.md): established cause, timing evidence,
  warning diagnosis, and distinction between facts and hypotheses.
- [Investigation trail](02-investigation-trail.md): initial report, reasoning,
  exact instrumentation, evidence interpretation, validation, and cleanup.
- [Durable design direction](03-design-direction.md): requirements, coupling in
  the current implementation, options, unresolved questions, and future checks.
- [Owner trace excerpt](evidence/iphone-generation-3.jsonl): original JSON
  payloads for the decisive two-swipe sequence, without console prefixes.

## Current source state

- Paging still uses the three-page, idle-settlement design. The bug is open.
- Temporary paging diagnostics and touch observers are absent from application
  source. The former debug environment flag has no effect.
- The pinch baseline initializes from the resolved input scale, avoiding a
  shared-value read during React rendering. This addresses an identified source
  of Reanimated warnings, not the paging boundary.
- No package changes, native dependency patches, or pager replacement are part
  of this investigation.

## Provenance

The inspected workspace is branch `TIM-559-t09-read-and-open-a-local-timed-class`
with HEAD `43775f4469a44cba78b4f2aae4c3da6d38868342`. It contains pre-existing
uncommitted calendar work. That commit alone does **not** reproduce the exact
instrumented source or identify the owner's installed binary.

The owner confirms the React Native iPhone app and supplies development console
logs. Device model, iOS version, refresh rate, and immutable installed build ID
are unrecorded. There is no Android reproduction or production performance
measurement in this investigation.

Relevant declared versions in `mobile/package.json`: Expo `~56.0.11`, React Native
`0.85.3`, PagerView `8.0.1`, Reanimated `4.3.1`, Gesture Handler `~2.31.1`, and
Worklets `0.8.3`.
