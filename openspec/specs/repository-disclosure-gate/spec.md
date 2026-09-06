# repository-disclosure-gate Specification

## Purpose
TBD - created by archiving change add-repository-disclosure-gate. Update Purpose after archive.
## Requirements
### Requirement: CI scans branch publication surfaces
The repository SHALL run a disclosure scan on every push over added text lines since the merge base, published file paths, and branch commit-message lines.

#### Scenario: Added content matches a pattern
- **WHEN** an added line contains a supplied, derived, or structural pattern
- **THEN** the scan exits non-zero and reports the repository-relative file, line, occurrence count, and pattern class

#### Scenario: Published path matches a pattern
- **WHEN** a branch adds or renames a path that contains a pattern
- **THEN** the scan exits non-zero and reports the path location and pattern class

#### Scenario: Commit message matches a pattern
- **WHEN** a branch commit-message line contains a pattern
- **THEN** the scan exits non-zero and reports the commit-message location and pattern class

#### Scenario: Branch has no findings
- **WHEN** no scanned publication surface contains a pattern
- **THEN** the scan exits successfully

### Requirement: Findings count occurrences without republishing matches
The scan MUST count every pattern occurrence at a location and MUST NOT print the matched value, source line, configured expression, or probe.

#### Scenario: Two patterns occur on one line
- **WHEN** one scanned line contains one occurrence of each of two synthetic patterns
- **THEN** the finding reports two occurrences and both safe pattern classes without printing either match

### Requirement: Pattern layers remain independent
The scan SHALL always enable repository-history-derived and structural patterns, and SHALL treat the configured pattern layer as an optional overlay.

#### Scenario: Configured secret is absent
- **WHEN** no configured pattern value is supplied
- **THEN** derived and structural scanning continue and the source census reports that configured coverage is absent

#### Scenario: Platform identity is in history
- **WHEN** a commit author belongs to an allowlisted platform email domain
- **THEN** the scan excludes that author from derived identity patterns

### Requirement: Configured expressions fail closed
The configured layer SHALL parse one entry per line as a regular expression optionally followed by the first ` :: ` delimiter and a probe, and SHALL fail before scanning if an entry cannot compile or does not match its supplied probe.

#### Scenario: Regular expression contains a comma
- **WHEN** a configured expression contains a quantifier or character-class comma
- **THEN** the parser preserves it as one entry

#### Scenario: Probe contains the delimiter
- **WHEN** a configured entry's probe contains ` :: `
- **THEN** the parser retains the complete probe after splitting on the first delimiter

#### Scenario: Configured expression is invalid
- **WHEN** a configured expression fails to compile
- **THEN** the scan exits non-zero and reports only the configured source line number

#### Scenario: Configured probe does not match
- **WHEN** a configured expression compiles but does not match its probe
- **THEN** the scan exits non-zero and reports only the configured source line number

#### Scenario: Configured entry has no probe
- **WHEN** a configured expression has no probe column
- **THEN** the expression remains active and the census reports it as unverified

#### Scenario: Configured entries are fully verified
- **WHEN** every configured entry compiles and matches its probe
- **THEN** the census separately reports the entry count, compiled count, and full self-test coverage

### Requirement: Benign exemptions remain narrow
The committed allowlist MUST contain only public-safe values and SHALL express home-directory exemptions as narrow path prefixes rather than arbitrary account names.

#### Scenario: Documented toolchain path is scanned
- **WHEN** a home-directory path begins with an allowlisted benign path prefix
- **THEN** the structural home-directory rule exempts that path

#### Scenario: Other path under the same account is scanned
- **WHEN** a home-directory path shares only the account component with an allowlisted nested path prefix
- **THEN** the structural home-directory rule still reports the path
