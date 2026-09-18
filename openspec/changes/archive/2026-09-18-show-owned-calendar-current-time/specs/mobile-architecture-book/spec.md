## ADDED Requirements

### Requirement: The Architecture Book records the Calendar current-time clock contract

Current-state Architecture Book guidance SHALL describe the owned Calendar timeline's single controller-owned, focus- and foreground-aware minute clock, the fresh-open positioning rule and its named viewport fraction, the non-color current-time presentation, and the renderer's timer-free ownership. It SHALL stop stating that the owned shell has no now indicator and that initial current-time positioning is pending. It SHALL name the repository contract and focused suites as the executable proof of timer scoping and cleanup, and SHALL keep the recorded ban on continuous idle animation. The Book changelog SHALL record the change. No ADR is required unless the implementation displaces an indexed decision's rule, in which case that decision SHALL be revised in place.

#### Scenario: Calendar guidance describes the clock seam

- **WHEN** the Architecture Book Calendar page is read after implementation
- **THEN** it identifies the single calendar clock module as the only displayed-precision timer owner, shared by the Today cue, the Today action, and the current-time indicator
- **AND** it states the fresh-open 30% positioning rule, the explicit full-day clamp, the preserved 07:00–21:00 shared-helper defaults, and that the renderer arms no timer

#### Scenario: Superseded pending-state wording is removed

- **WHEN** the Calendar page's pre-launch limitation wording is inspected
- **THEN** it no longer claims the shell has no now indicator or that initial current-time positioning is a later slice
- **AND** it still distinguishes the capabilities that genuinely remain pending, including event tiles, the all-day lane, and the complete Today/direct-date intent

#### Scenario: Proof layers and the animation ban are named

- **WHEN** Calendar and testing guidance is read
- **THEN** it points to the repository contract and focused clock/renderer suites for timer scoping, minute alignment, and cleanup
- **AND** it retains the ban on continuous idle animation and distinguishes deterministic host proof from device presentation, appearance, and assistive-technology evidence

#### Scenario: The Book changelog records the update

- **WHEN** Architecture Book history for this slice is inspected
- **THEN** `CHANGELOG.md` records the current-time clock, positioning, and contract change with its date
- **AND** no duplicate Architecture Book tree or parallel current-state document is created
