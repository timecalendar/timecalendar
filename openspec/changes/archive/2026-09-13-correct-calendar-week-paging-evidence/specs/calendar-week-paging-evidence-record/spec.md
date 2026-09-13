## ADDED Requirements

### Requirement: Evidence attribution identifies the corrected implementation

The T02 device-pass record SHALL attribute its testable build target, automated checks, build kind,
and pending installed-build field to implementation revision
`a14333a9feb0fe47f62fb7270178542f2b21359f`. It SHALL record the verified focused result as 5 suites
and 72 tests passed and the verified full-coverage result as 177 suites and 1,659 tests passed, with
97.64% statement coverage and 92.12% branch coverage.

#### Scenario: Reader resolves the immutable evidence target

- **WHEN** a reader follows any build, revision, or automated-check attribution in the T02 note
- **THEN** every attribution identifies the corrected implementation revision and consistent
  verified totals

### Requirement: Delivery state remains distinct from owner acceptance

The T02 device-pass record SHALL state that PR #410 was human-merged as
`ffc2bd88cedaeaa9d2d2e9a0739d9305f22d1a6d`. It SHALL separately state that the owner checklist and
explicit acceptance remain pending and that the next renderer slice remains paused for that
acceptance.

#### Scenario: Merged delivery has pending owner acceptance

- **WHEN** a reader reviews the Results and gate section after PR #410 has merged
- **THEN** the record reports the completed merge without representing the pending owner checklist
  or explicit acceptance as complete
- **AND** the record keeps the next renderer slice paused for explicit owner acceptance

### Requirement: Unperformed device evidence stays unclaimed

The correction MUST preserve the unchecked owner checklist and pending environment/result fields.
It MUST NOT claim an unperformed native, Android, active-refresh-rate, VoiceOver, or TalkBack result.

#### Scenario: Documentation correction is applied without a device pass

- **WHEN** the revision and delivery-state text is corrected without performing new device checks
- **THEN** every owner checklist item remains unchecked and every unrecorded device or
  assistive-technology result remains pending

### Requirement: Correction remains documentation-only

The implementation SHALL change only the T02 inbox evidence note outside its OpenSpec artifacts and
SHALL NOT alter runtime behavior, tests, contracts, roadmap scope, Architecture Book rules, native
configuration, deployment configuration, or legacy Flutter code.

#### Scenario: Final implementation scope is reviewed

- **WHEN** the branch diff is compared with `origin/main`
- **THEN** the only non-OpenSpec changed path is
  `docs/react-native-migration/inbox/2026-09-12-calendar-week-paging-device-pass.md`
