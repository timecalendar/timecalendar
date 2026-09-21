## ADDED Requirements

### Requirement: Reduction-only baseline convergence is generated
The disclosure scanner SHALL provide a convergence mode that emits a complete canonical version-1
baseline from a committed baseline and a fresh CI census. The mode MUST preserve `entries`
unchanged and MUST reconcile `ciEntries` only across `(path, id)` keys already present in the
committed CI lane.

#### Scenario: A committed count decreases

- **WHEN** a committed CI key is measured at a positive count below its committed count
- **THEN** convergence emits that key with the lower measured count

#### Scenario: A committed count reaches zero

- **WHEN** a committed CI key has no measured occurrences
- **THEN** convergence omits that key from the generated candidate

#### Scenario: A committed count is unchanged

- **WHEN** a committed CI key is measured at its committed count
- **THEN** convergence emits the key with the committed count

#### Scenario: A committed count increases

- **WHEN** a committed CI key is measured above its committed count
- **THEN** convergence retains the lower committed count so enforcement continues to fail closed

#### Scenario: A new key is measured

- **WHEN** the fresh census contains a `(path, id)` key absent from committed `ciEntries`
- **THEN** convergence omits that key rather than converting the new finding into a pin

#### Scenario: The configured source is unavailable

- **WHEN** a committed configured-source key cannot be reproduced because its runtime detector input
  is absent
- **THEN** convergence preserves that committed key and count rather than claiming a measured
  reduction

#### Scenario: The preflight lane is carried through

- **WHEN** convergence emits a candidate
- **THEN** the candidate contains the committed `entries` lane in the same order with the same
  values

#### Scenario: Convergence has no changes

- **WHEN** every reproducible committed CI key is measured at or above its committed count and no
  committed key reaches zero
- **THEN** canonical convergence output is byte-identical to the canonical committed baseline

### Requirement: Convergence does not weaken disclosure enforcement
Baseline convergence SHALL change neither the `--check-baseline` invariant nor whole-file and
baseline-free branch scanning. A converged candidate MUST pass the stale-pin check only when every
reproducible committed pin is at or below its measured count, while new and increased findings
remain subject to the existing enforcement layers.

#### Scenario: A stale baseline converges

- **WHEN** the invariant fails only because a reproducible committed key exceeds its measured count
  and convergence lowers or removes that key
- **THEN** `--check-baseline` passes when run against the generated candidate

#### Scenario: An increased occurrence remains unpinned

- **WHEN** convergence retains a committed count below the measured count
- **THEN** the whole-file layer still reports the over-pin occurrence

#### Scenario: An added occurrence remains baseline-free

- **WHEN** a branch adds an occurrence while also generating a convergence candidate
- **THEN** the added-line, path, rename, or commit-metadata layer reports it without consulting that
  candidate

#### Scenario: Full generation remains explicit

- **WHEN** a deliberate detector or source change requires a complete fresh census
- **THEN** the existing full-generation mode remains separately available and convergence does not
  replace it
