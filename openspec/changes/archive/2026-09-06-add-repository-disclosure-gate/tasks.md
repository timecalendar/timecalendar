## 1. Scanner Core

- [x] 1.1 Scan added lines, published paths, and branch commit-message lines relative to the merge base
- [x] 1.2 Layer repository-derived, structural, and optional configured patterns independently
- [x] 1.3 Count every occurrence at a location and report only safe location and pattern-class metadata

## 2. Configured Pattern Contract

- [x] 2.1 Parse one regular-expression record per line with an optional first-delimiter probe column
- [x] 2.2 Fail closed on invalid expressions and failed probes without printing configured values
- [x] 2.3 Report entry, compilation, self-test, and unverified coverage separately

## 3. Exemptions and Workflow

- [x] 3.1 Commit only public-safe, narrowly typed allowlist entries, including home-path prefixes rather than account-wide exemptions
- [x] 3.2 Run the behavioral test suite and disclosure scan in the push workflow with full git history

## 4. Proof and Documentation

- [x] 4.1 Cover matching and clean branches, two occurrences on one line, pattern compilation, probes, and exemption boundaries with synthetic tests
- [x] 4.2 Document the layered scanner, safe reporting, configured pattern format, positive controls, unverified entries, and remediation contract
