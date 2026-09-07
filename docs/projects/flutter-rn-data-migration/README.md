---
kind: project
id: flutter-rn-data-migration
status: implementable
decision: go
---

# Flutter-to-React-Native on-device data migration

## Intent

Preserve the student's locally owned Flutter data during the first in-place React Native update,
without overwriting newer React Native state or exposing private content. The migration is quiet,
one-shot, best effort, observable to developers, and proved through the real signed update path.

The normative implementation contract is the
[data-migration technical specification](../../react-native-migration/05-tech-specs/data-migration.md).
This directory provides the approved product, decision, and delivery decomposition around it.

## State

- Product: `approved`
- Technical design: `approved`
- Roadmap: `approved`
- Readiness: `implementable`
- Implementation dispatch: ready only after this planning change merges

## Approval log

- 2026-09-07 — the TimeCalendar board owner answered the human-only decision round on TIM-436,
  declared the responses to be the product contract, assigned human QA ownership, and directed the
  docs-only technical specification to continue. The same issue comment clarified that personal
  event colours are copied exactly. This explicitly approves P01–P04 and D01–D04.
- 2026-09-07 — the canonical planning package was reconciled with `origin/main`; the shared
  project-readiness validator passed in `ready` mode.

## Residual risks and caveats

- Representative released-install file sizes, line counts, and preference evidence have not yet
  been captured. T04 keeps its limits testable and T08 captures real measurements before rollout.
- Android source paths, XML presence, backup/restore, and update survival are code-confirmed but
  not signed-device-confirmed. T03 provides the bridge and T08 owns physical proof.
- iOS and Android store sandboxes can only be proven by signed in-place updates. Automated tests
  cannot replace T08's internal and final public-store gates.
- A downgrade after React Native-only writes can lose those writes. Indefinite Flutter-source
  retention is a safety copy, not a reverse bridge.
- Migration-report endpoint retention and parser caps may be tuned from bounded, privacy-safe
  implementation evidence without changing the approved outcomes or decisions. Any change to
  imported data, collision precedence, visibility, retention promise, or privacy boundary requires
  renewed board approval.
