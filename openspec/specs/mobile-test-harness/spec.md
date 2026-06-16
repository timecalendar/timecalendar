# mobile-test-harness Specification

## Purpose
TBD - created by archiving change add-mobile-test-harness. Update Purpose after archive.
## Requirements
### Requirement: Jest + RNTL unit/component harness

`mobile/` SHALL have a Jest test harness on the `jest-expo` preset with React Native Testing Library, runnable as `npm test`, with tests colocated next to the source they cover (`*.test.ts` / `*.test.tsx`).

#### Scenario: Tests run green with one command

- **WHEN** `npm test` is run in `mobile/`
- **THEN** Jest runs all colocated tests under the `jest-expo` preset and exits 0 with at least one real component test passing

#### Scenario: Component behavior is tested at the mutator seam

- **WHEN** the schools screen component test runs
- **THEN** it mocks `src/api/mutator` (the single designed fetch seam), renders the screen through the real generated hook and a QueryClient, and asserts the seeded-shape school data renders — without any network access

### Requirement: Coverage reporting on, K-3 thresholds deferred

The harness SHALL produce a coverage report in CI, and SHALL NOT yet enforce `coverageThreshold`. The K-3 gate (90% logic paths / 70% global) is recorded as explicit debt whose trigger is the first feature with logic paths (Settings).

#### Scenario: CI reports coverage without gating on it

- **WHEN** the `test-mobile` CI job runs the Jest step
- **THEN** coverage is collected and reported, and the job's pass/fail depends only on test results, not on coverage percentages

#### Scenario: The deferral is recorded where it will be found

- **WHEN** a contributor reads the Architecture Book's testing section
- **THEN** the K-3 deferral, its rationale, and its trigger (first logic-bearing feature) are stated explicitly

### Requirement: CI gate for unit tests

The `test-mobile` CI job SHALL run the unit test suite with the same entrypoint used locally, so local and CI cannot diverge on what "passing" means.

#### Scenario: The CI job fails on a failing test

- **WHEN** any Jest test fails on a pushed commit
- **THEN** the `test-mobile` job fails via the same `npm test` entrypoint a developer runs locally

