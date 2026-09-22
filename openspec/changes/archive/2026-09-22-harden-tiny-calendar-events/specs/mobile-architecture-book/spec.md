## ADDED Requirements

### Requirement: The Architecture Book records the T10 point, target, color, and validation contracts

Current-state Calendar/data/testing guidance SHALL describe point-event half-open membership, duration-faithful tiny visuals with separate 44pt iOS / 48dp Android interaction geometry, title-first constrained presentation, localized missing-title behavior, deterministic light/dark/increased-contrast event appearance, per-row required/optional validation, and aggregate-only diagnostics. It SHALL identify the focused executable proof and SHALL keep overlap disambiguation, final visual tuning, and native device/accessibility acceptance assigned to their later tickets. `CHANGELOG.md` SHALL record the current-state refinement without adding an ADR or second documentation tree.

#### Scenario: Calendar guidance describes tiny event behavior

- **WHEN** the Calendar Architecture Book page is read after T10
- **THEN** it explains point membership, instant-marker visuals, exact short-event height, separate minimum interaction geometry, title priority, and complete accessible meaning
- **AND** it does not claim overlap-density resolution or physical-device acceptance

#### Scenario: Data and testing guidance describes safe normalization and proof

- **WHEN** the data/testing guidance is read after T10
- **THEN** it records accepted timed equality, reversed/date-only rejection, optional omission, localized presentation fallback, contrast resolver inputs/invariants, and allowlisted aggregate diagnostics
- **AND** it names the pure/component/privacy/local-green proof while distinguishing host evidence from T28 device evidence

#### Scenario: Existing architectural boundaries remain sufficient

- **WHEN** Architecture Book decisions and changelog are inspected
- **THEN** D01/D04/D06/D08 and the existing renderer module boundary remain the governing decisions
- **AND** no new ADR, dependency, renderer, persisted format, or sensitive-surface contract is introduced
