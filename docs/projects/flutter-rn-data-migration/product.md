---
kind: product
status: approved
decision: go
---

# Product shaping

## Problem and evidence

The released Flutter app owns calendar access tokens, personal events, checklist items, and hidden
events solely on the device. The React Native replacement uses different persistence engines and
cannot reconstruct those values from the server. An in-place update without an importer therefore
causes permanent student-data loss. Current Flutter and React Native source traces, historical
Sembast migrations, and the migration QA inventory are recorded in the
[research record](../../react-native-migration/00-exploration/data-persistence-migration.md) and
[technical specification](../../react-native-migration/05-tech-specs/data-migration.md).

### P01 — Preserve approved local continuity

**Outcome:** A genuine Flutter installation upgraded in place retains valid calendars and tokens,
personal events, checklist items, hidden events, changelog state, theme, notification-enabled
state, startup tab, and weekend visibility. Imported calendars suppress onboarding. Deliberately
excluded preferences and server-owned caches resolve through React Native defaults or sync.

**Acceptance evidence:** Offline and online QA scenarios prove every allowlisted value exactly
once, excluded data absent, dropped preferences at React Native defaults, and cached data restored
only by sync.

### P02 — Recover safely without blocking the student

**Outcome:** Valid siblings survive malformed records and a truncated tail; React Native state
wins every divergence; retries are idempotent; and a handled terminal outcome opens the app with
no migration warning, recovery UI, or repeat attempt.

**Acceptance evidence:** Synthetic malformed, collision, and process-kill fixtures prove the
approved state machine, no-overwrite semantics, deterministic recovery, and invisible startup.

### P03 — Make outcomes measurable without leaking content

**Outcome:** Success, partial, and failure outcomes reach a durable first-party report store,
including a real denominator and bounded diagnostics, while tokens and user-authored content never
enter reports, logs, metrics, crash breadcrumbs, fixtures, or support exports.

**Acceptance evidence:** Contract tests prove idempotent offline outbox delivery, bounded payloads,
access controls, and explicit absence of forbidden source values from every telemetry surface.

### P04 — Gate rollout on the real upgrade path

**Outcome:** The source stays indefinitely, both signed platform update paths are proved, low-end
resource behavior is measured, and the whole-app rollout widens from a small cohort only when QA
and migration outcome evidence permit it.

**Acceptance evidence:** Internal TestFlight and Play-track passes plus final public-store passes,
Android path/backup evidence, low-end measurements, and documented stop/go results are attached to
the release candidate.

## Appetite and constraints

This is a one-release-critical migration with permanent-loss risk. Product accepts a startup of ten
seconds or longer once, but engineering must bound resource use. Work remains docs-only here; later
implementation may span mobile, server, native configuration, generated contracts, CI, and release
evidence. Production mutations and store rollout remain separately authorized acts.

## In scope

- One-shot discovery, parsing, validation, import, journal, reporting, and bootstrap ordering.
- The explicit durable-data and preference allowlist.
- Backend migration reporting and offline report delivery.
- Automated fixture coverage and signed iOS/Android in-place update evidence.
- Indefinite non-destructive retention of Flutter source data.

## Out of scope and non-goals

- Importing timetable, activity, query, Firebase, FCM, authentication, or environment caches.
- A user migration screen, warning, support export, manual retry, or skip affordance.
- A React-Native-to-Flutter reverse bridge or automatic Flutter-source cleanup.
- Reproducing old group-colour, calendar-view, hour-height, or notification-horizon settings.
- Implementing, deploying, or dispatching any work as part of this planning change.

## Assumptions and unknowns

- Production application identities retain their existing sandbox during a signed update; T08
  proves this on both platforms.
- Code inspection identifies Android's legacy XML backend, but physical path, backup, and survival
  evidence remains outstanding.
- Representative and worst-case files fit the proposed bounded streaming design; T04 and T08
  measure and tune engineering limits without weakening P01–P03.

## Alternatives

- **Do nothing:** rejected because irreplaceable local data would be lost at cutover.
- **All-or-nothing import:** rejected because one corrupt item would discard valid siblings.
- **User-visible recovery flow:** rejected because the approved product contract requires quiet,
  handled continuation.
- **Import every preference and cache:** rejected because it increases scope and carries stale,
  replaceable state into the new app.
- **Reverse bridge:** rejected because indefinite source retention is accepted despite lossy
  downgrade after React Native-only writes.

## Risks and kill criteria

Pause rollout if either platform cannot preserve the production sandbox, the importer overwrites
React Native data, privacy tests find source content outside approved storage, valid data is lost
in a required fixture, reporting lacks a reliable denominator, or low-end measurements exceed safe
resource bounds. Kill the current design and return to planning if resolving one of those failures
would change P01–P04 or D01–D04.

## Recommendation

`go`. The smallest viable intervention is a bounded one-shot importer plus outcome reporting and
signed-upgrade evidence. It protects data that cannot otherwise be recovered while deliberately
excluding caches, broad preference parity, user-facing recovery, and reverse migration.

## Approval

Approved by the TimeCalendar board owner through the human-only TIM-436 decision round answered
2026-09-07 and the same-day continuation clarification. The response explicitly declared the
answers to be the product contract and assigned the required physical QA ownership.
