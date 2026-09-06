# disclosure-gate Specification

## Purpose
TBD - created by archiving change converge-disclosure-gate-baseline. Update Purpose after archive.
## Requirements
### Requirement: Committed count-keyed disclosure baseline
The repository SHALL commit one version-1 baseline at `ci/disclosure-baseline.json` with separate generated `entries` and `ciEntries` content lanes. The preflight SHALL read only `entries`, CI layer A SHALL read only `ciEntries`, and every item in either lane MUST contain exactly a repository-relative `path`, a safe `id`, and a positive integer `count`. Each lane MUST independently reject duplicate `(path, id)` keys, and the complete file MUST contain no protected string.

#### Scenario: The baseline is itself clean

- **WHEN** the committed baseline document is read end to end as scan input against the full pattern list
- **THEN** the scan reports zero occurrences and exits zero

#### Scenario: The baseline is generated, not hand-written

- **WHEN** the baseline is produced
- **THEN** both lanes are generator output against the same tracked tree at the commit the branch will land on, with `ci/certificates/` excluded, and no entry is added or amended by hand

#### Scenario: Detector vocabularies remain independent

- **WHEN** the preflight and CI assign different safe ids to findings on the same path
- **THEN** each mechanism compares only its own lane by `(path, id, count)` and no per-path aggregate is used

#### Scenario: A raised count is visible in review

- **WHEN** a branch increases any committed entry's `count`, or adds an entry for a path the scrubbing removed
- **THEN** that diff is a review finding, and the branch does not merge on the strength of a green gate alone

### Requirement: Two-layer scanning in both mechanisms
The PR preflight and the CI gate SHALL each judge a branch by the same two layers, so that the two mechanisms reach the same verdict on the same text.

#### Scenario: Whole-file layer against the pin

- **WHEN** a branch touches a file and that file's occurrences of a pattern are totalled across the whole file
- **THEN** a total at or under the pin for that `(path, id)` passes, and a total over the pin, a pattern not pinned at that path, or a touched path with no entry at all reports every occurrence of that pattern in the file

#### Scenario: Added-line layer against nothing

- **WHEN** a branch adds a line carrying an occurrence
- **THEN** the branch fails regardless of the baseline, of any path allowlist, and of any published-identity narrowing

#### Scenario: Substitution cannot pass

- **WHEN** a branch deletes one pre-existing occurrence from a baselined file and adds a different one elsewhere in that same file, leaving the count unchanged
- **THEN** the branch fails on the line it added

#### Scenario: Absent baseline is the unbaselined rule

- **WHEN** no baseline is supplied
- **THEN** every pin is treated as zero and the mechanism behaves exactly as it did before a baseline existed

### Requirement: A published-identity path never excuses a line the branch wrote
A path allowlist that marks a location as the product's own published identity SHALL narrow the whole-file layer only, and MUST NOT suppress an occurrence on a line or a path the branch added or renamed.

#### Scenario: A new identity on the credit surface fails

- **WHEN** a branch adds a line carrying an identifying string inside a path listed as a credit or published-identity location
- **THEN** the gate reports it, exactly as it would one directory away

#### Scenario: Editing around a pinned credit still passes

- **WHEN** a branch touches a credit file without changing the number of occurrences it carries
- **THEN** the whole-file layer absorbs that footprint against the pin and the branch passes

### Requirement: A matching path is never baselined
A path whose own text matches a pattern SHALL NOT be given a baseline entry, and its permanent exemption MUST live in a path list instead — one in each mechanism, expressed with wildcard or prefix segments so the protected string is never written down.

#### Scenario: Pinning a matching path is refused

- **WHEN** a path matches a pattern on a directory or file-name segment
- **THEN** the generator emits no entry for it, because an entry is keyed on the path and would write the protected string into the file whose property is that it holds none

#### Scenario: The path lane survives the baseline

- **WHEN** a baseline is supplied and the content carve-outs retire into pinned counts
- **THEN** the path list is kept and narrows `source: "path"` findings only, because a pinned count cannot express a path exemption and the two mechanisms are disjoint by match source

#### Scenario: A content carve-out beside a baseline is an error

- **WHEN** a carve-out narrowing a content match is presented alongside a baseline
- **THEN** that is an error the tooling raises, not a judgement call left to the reviewer

#### Scenario: Both mechanisms agree on a protected path

- **WHEN** a branch touches a file whose path segment carries the shipped application identifier
- **THEN** the PR preflight and the CI gate both narrow it, and both fail a branch that creates or renames a path at that shape

### Requirement: Mechanical non-increasing invariant
CI SHALL re-measure `ciEntries` at the commit under test and fail when any committed CI entry exceeds the measured occurrence count for that `(path, id)`. CI MUST NOT claim to remeasure `entries` without the out-of-repository preflight pattern input; when that input is present, the preflight SHALL enforce its own lane.

#### Scenario: A stale pin fails

- **WHEN** scrubbing removes occurrences from a baselined path and the committed entry is not regenerated
- **THEN** the invariant step fails and names the path and id, without printing the match

#### Scenario: Always-on classes remeasure without configured input

- **WHEN** the invariant step runs without the optional configured source
- **THEN** it records degraded coverage and remeasures the always-on CI classes against `ciEntries`

#### Scenario: A configured source appears after generation

- **WHEN** the configured source was absent during generation and later produces an unpinned `configured-pattern` finding
- **THEN** CI fails closed until a deliberate regenerated `ciEntries` lane is reviewed

### Requirement: Findings never publish what they matched
Every disclosure finding, log line, and report emitted by either mechanism SHALL carry a location, a pattern id or class, and an occurrence count, and MUST NOT reproduce the matched string.

#### Scenario: A public CI log stays clean

- **WHEN** the CI gate reports findings in a public Actions log
- **THEN** each line names the file, the line number and the class only, and the match itself appears nowhere in the output

#### Scenario: No denylist is committed

- **WHEN** either mechanism is configured
- **THEN** its patterns come from run-time derivation, an injected secret, or out-of-repository configuration, and no file in this repository lists the strings that must not be published
