## ADDED Requirements

### Requirement: Architecture guidance records native notification settings contracts
The Architecture Book SHALL describe the current native notification settings composition through pointers to its executable seams. Navigation guidance SHALL record Router-owned iOS frequency/horizon pushes and the custom form sheet with one native scroll owner. Feature, storage, i18n, accessibility, and testing guidance SHALL record preserved preference values, exact custom-draft commit semantics, shared route-independent synchronization status, truthful fixed-schedule copy, translated/accessibly selected state, deterministic host proof, and the remaining owner-led device evidence. The Book SHALL point to existing ADRs 056 and 060 rather than create a duplicate architectural decision, and its changelog SHALL record the resulting current-state rule update.

#### Scenario: Current-state guidance matches implementation ownership
- **WHEN** the Architecture Book is read after implementation
- **THEN** it identifies notification feature UI as the owner of options, validation, copy, commit policy, and status presentation; chrome as the owner of SwiftUI/Compose primitives and native buffers; Router as the presentation owner; and the existing notification data runtime as the only save owner
- **AND** it contains no claim that the removed universal picker or stepper is current behavior

#### Scenario: Proof boundaries stay honest
- **WHEN** testing and accessibility guidance describe the native notification controls
- **THEN** they point to pure validation, chrome contract, feature behavior, route inventory, localization, and CI proof tests
- **AND** they reserve visual geometry, keyboard and dismissal feel, large text, themes, and VoiceOver/TalkBack quality for owner-led device acceptance

#### Scenario: Architecture change is recorded without a duplicate ADR
- **WHEN** the Architecture Book changelog and decision index are inspected
- **THEN** the changelog records the native notification controls and custom numeric-entry contract
- **AND** ADRs 056 and 060 remain the cited load-bearing decisions with no new duplicate record
