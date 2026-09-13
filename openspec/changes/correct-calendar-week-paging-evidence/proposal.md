## Why

The T02 owner-device handoff on `main` still attributes its automated evidence and build target to
a superseded source revision and says the delivery PR is unmerged, even though PR #410 has merged.
The record must identify the corrected implementation head while keeping the still-pending physical
device acceptance gate explicit.

## What Changes

- Retarget every build, revision, and automated-check attribution in the T02 device-pass note to
  implementation revision `a14333a9feb0fe47f62fb7270178542f2b21359f` and its verified test totals.
- Replace the stale unmerged-PR footer with the current delivery state: PR #410 merged as
  `ffc2bd88cedaeaa9d2d2e9a0739d9305f22d1a6d`, but the owner checklist and explicit acceptance are
  still pending, so the next renderer slice remains paused for acceptance.
- Preserve every unchecked owner step and every pending environment/result field. Do not infer or
  claim native, Android, refresh-rate, VoiceOver, or TalkBack evidence.
- Keep the implementation documentation-only and confined to the T02 evidence note plus this
  OpenSpec change.

## Capabilities

### New Capabilities

- `calendar-week-paging-evidence-record`: An internally consistent T02 device-pass record that
  separates merged delivery state, immutable automated evidence, and pending owner acceptance.

### Modified Capabilities

None.

## Impact

- Implementation surface: only
  `docs/react-native-migration/inbox/2026-09-12-calendar-week-paging-device-pass.md`.
- No runtime behavior, tests, dependencies, API contract or generated client, database schema or
  migration, mobile native/store configuration, deployment or CI configuration, legacy Flutter
  code, Terraform, Kubernetes, roadmap sequencing, or Architecture Book rule changes.
- Sensitive surfaces touched: none.
- QA is not required for this correction. Physical-device and assistive-technology acceptance
  remains pending in the existing owner checklist and is not performed or resolved here.
