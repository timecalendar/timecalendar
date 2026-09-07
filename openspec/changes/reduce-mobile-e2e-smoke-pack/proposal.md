## Why

The native Maestro suite currently spends device time on seventeen independently discovered flows and detailed UI regressions, making the daily health signal slow and fragile without improving ordinary merge confidence. With the E2E cadence policy established, the suite should now concentrate on three stable journeys that prove the highest-value shipped paths while cheaper tests retain targeted behavior coverage.

## What Changes

- Reduce `mobile/.maestro/` discovery to exactly three top-level business journeys:
  1. a fresh student selects a seeded school, supplies a programme, completes a real server-backed calendar import, sees the synced schedule, and opens seeded event details;
  2. a student creates, edits, persists/reopens, and deletes a personal event through the shipped Home/Calendar entry surface;
  3. a student hides and restores a subscribed calendar from calendar management and observes the rendered schedule update both times.
- Move reusable setup into nested helper flows that are not independently discovered, and remove the remaining top-level native journeys from device execution.
- Keep the static selector-integrity checks and structural retry-classifier/shell fixtures in baseline CI; add only focused server, store/persistence, or component coverage where deleting a device flow would reveal a genuine gap.
- Update the E2E contract, harness documentation, Architecture Book testing guidance and changelog, and Phase 10 roadmap to distinguish the small daily smoke pack from broader human release-candidate exploratory acceptance.
- Record the durable three-journey budget and the boundary between automated smoke health and human release acceptance in an ADR consistent with the existing native E2E cadence decision.
- Require one deliberate exact-head manual dispatch on both Android and iOS after focused static checks pass. A repeat requires a relevant change or recorded evidence of a transient infrastructure failure.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-e2e`: Replace the broad top-level Maestro inventory with the three named smoke journeys, preserve non-device harness protections, and define bounded exact-head evidence and release-candidate acceptance responsibilities.

## Impact

- Affected paths: `mobile/.maestro/`, `mobile/e2e/`, focused mobile/server tests only where a coverage gap is demonstrated, `openspec/specs/mobile-e2e/`, `docs/mobile/architecture-book/`, and the active React Native migration E2E/Phase 10 documentation.
- API contract, generated API client, database migrations, native/store/EAS/Firebase configuration, deployment configuration, workflow files, credentials/certificates, and legacy Flutter remain unchanged.
- Sensitive surface: `docs/mobile/architecture-book/` is expected to change. The implementation must keep ADR 038 process isolation and ADR 055 daily/manual cadence consistent, add the new durable decision record, and route the documentation edits through explicit Reviewer scrutiny.
