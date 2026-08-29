## ADDED Requirements

### Requirement: Round 3 answers are recorded with row-level fidelity

The discovery record SHALL map each product-owner Round 3 answer to every questionnaire row it
directly settles, SHALL split compound answers where they settle multiple rows, and SHALL retain an
unresolved or research status where the owner did not make a product choice. Recommendation text
SHALL NOT override an explicit owner correction or structured follow-up answer.

#### Scenario: Compound answer settles several rows

- **WHEN** one owner answer directly determines several questionnaire keys
- **THEN** every supported row records the same scoped meaning using the appropriate decision status
- **AND** no adjacent unsupported row is changed merely because it appeared in the same question

#### Scenario: Owner corrects a recommendation

- **WHEN** the accepted answer rejects part of the published recommendation
- **THEN** the row-level answer and all summaries preserve the correction
- **AND** the superseded recommendation remains identifiable only as historical question context

### Requirement: Narrowed paging and event choices are exact

The answer record SHALL preserve `keep_until_settle`, `instant_marker`, `skip_bad_only`,
`show_cue`, `not_overlap`, `equal_columns`, `stable_order`, and `keep_last_complete` as the exact
answered choices for their keyed rows. It SHALL keep the numeric crowding threshold as agent-owned
research rather than infer a value.

#### Scenario: Structured interaction is transcribed

- **WHEN** the Round 3 interaction answers are copied into the discovery documents
- **THEN** all eight choice identifiers and their product meanings agree with the answered
  interaction
- **AND** no alternative choice is described as accepted

### Requirement: Owner corrections remain bounded to the first delivery

The discovery record SHALL state that the first delivery is an internal reusable TimeCalendar
module, editing/direct manipulation is excluded without making future support infeasible, cancelled
events are hidden, Calendar has no refresh or haptics, initial loading uses an indicator rather than
a skeleton, and no pre-production rollback/fallback/dual renderer exists. It SHALL also preserve
unbounded date navigation when synchronized data exists and defer eventual production rollout policy
to later release planning.

#### Scenario: Reader reviews the Round 3 summary

- **WHEN** a reader uses the answer record to understand first-delivery scope
- **THEN** every accepted correction is visible without consulting the original comment
- **AND** future possibilities are not misstated as permanent exclusions or current commitments

### Requirement: Accessibility and technical uncertainty are not weakened

The record SHALL keep complete accessibility operation first-class, identify chronological order as
navigation on the same Calendar screen, require time in event accessibility labels, and permit
source-color adjustment for acceptable contrast. It SHALL NOT turn exact contrast algorithms,
allowed color ranges, measured zoom bounds, density limits, or native landscape enablement into
owner-approved technical choices.

#### Scenario: Product outcome has unresolved technical realization

- **WHEN** the owner confirms an outcome but leaves its algorithm or measured bound to engineering
- **THEN** the outcome is recorded as product meaning
- **AND** the technical detail remains explicitly deferred or assigned to bounded research

### Requirement: Questionnaire summaries are mechanically consistent

Every discovery summary SHALL report status totals and remaining-key lists derived from the
questionnaire's 280 unique row keys. The Round 3 answer record, questionnaire introduction, README,
and evidence summary SHALL agree exactly and SHALL continue to state that functional specification,
architecture, and implementation remain unauthorized.

#### Scenario: Consistency proof runs after documentation edits

- **WHEN** the completed questionnaire is parsed by the focused consistency check
- **THEN** it finds exactly 280 unique keys with recognized statuses
- **AND** every reported total and remaining-key list matches the parsed rows
- **AND** the discovery posture says Round 3 is answered rather than merely proposed

### Requirement: Sensitive and implementation surfaces remain unchanged

The applied change SHALL be confined to the owned-renderer discovery artifacts. It SHALL NOT modify
the Architecture Book or ADRs, application code, API contract/generated client, migrations,
native/store/EAS configuration, CI/deploy configuration, legacy Flutter application, Terraform, or
Kubernetes manifests.

#### Scenario: Reviewer inspects the applied diff

- **WHEN** the documentation change is ready for review
- **THEN** only the four owned-renderer discovery documents and OpenSpec lifecycle artifacts differ
- **AND** renderer behavior and sensitive surfaces are unchanged
