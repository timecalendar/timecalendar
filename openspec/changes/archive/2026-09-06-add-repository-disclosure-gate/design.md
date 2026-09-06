## Context

The repository is public, so branch content and CI logs are both publication surfaces. The control must run without a private configuration value, accept a private overlay when present, and avoid repeating a detected value in its own output.

## Goals / Non-Goals

**Goals:**

- Inspect added text, published paths, and commit-message lines before merge.
- Detect multiple occurrences at one location and preserve their individual classes.
- Keep derived and structural coverage active when configured patterns are absent.
- Prove that configured regular expressions compile and match their operator-supplied probes.
- Keep benign exemptions narrow and reviewable without committing identifying values.

**Non-Goals:**

- Scan unchanged lines in every touched file.
- Commit or generate a denylist containing the values being protected.
- Prove that an operator-supplied pattern covers every value it is intended to cover.

## Decisions

### Use a dependency-free Node scanner in the existing push workflow

The workflow checks out full history, runs the scanner's Node test suite, and then scans relative to the merge base. Full history supports both author-derived patterns and correct branch attribution. Keeping the scanner dependency-free reduces setup and lets the behavioral suite exercise the same module used by CI.

### Layer derived, structural, and configured patterns independently

Repository-history-derived identities and structural shapes always run. The optional configured layer adds private patterns but cannot gate the other two layers. A source census exposes coverage without exposing pattern values.

### Treat configured patterns as line records with positive controls

Each nonblank line contains a regular expression and may contain a probe after the first ` :: ` delimiter. Expressions compile with global, Unicode, and case-insensitive matching. A compile failure or a probed expression that does not match fails closed by source line number. Pattern-only entries remain usable but are explicitly reported as unverified.

Splitting only on newlines avoids shredding regular-expression quantifiers and character classes. Splitting on the first delimiter leaves probes unconstrained; a pattern that needs the delimiter can express a colon with a character class.

### Report safe metadata and count occurrences

Findings contain source type, repository-relative location, line number, occurrence count, and safe pattern classes. They never contain the source line, match, configured expression, or probe. Counting global matches instead of matching lines preserves multiple findings on one line.

### Exempt only narrowly benign shapes and locations

The committed allowlist contains public-safe domains, reserved routes, role addresses, product identifiers, credit paths, and specific home-directory path prefixes. Home-directory exemptions are prefixes such as a CI runner root or a documented toolchain location, never arbitrary account names, because an account-wide exemption hides every path below that account.

## Risks / Trade-offs

- **Added-line scope cannot detect an occurrence already present on the base branch.** → Keep the initial gate deployable and sequence broader cleanup and full-file coverage separately.
- **A configured entry without a probe can compile while matching nothing useful.** → Report it as unverified and expose self-test coverage separately from parsed and compiled counts.
- **Derived identity patterns can create false positives in deliberate product credits.** → Restrict identity exemptions to explicit credit paths while structural checks continue there.
- **A broad benign exemption can weaken the gate silently.** → Keep exemptions typed and narrowly scoped, with tests for home-directory prefix behavior.
