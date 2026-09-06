## Context

The disclosure control has two implementations with intentionally different pattern inputs: the
repository CI gate derives identities from public repository history and may load a configured
overlay, while the contributor preflight receives the full runtime pattern list. They already
converge on branch scope, two-layer file scanning, path treatment, occurrence counting, and
redacted findings. Both currently collect commit messages from the merge-base-to-head range but
discard the author and committer identities stored beside each message.

Commit headers have no repository path. They therefore cannot use a `(path, id, count)` baseline
entry, and a path-based published-identity rule cannot describe them. Existing history also has a
large, accepted authorship footprint, so the lane must never expand from branch commits to all
reachable commits.

This is repository and contributor-tooling infrastructure, not a mobile architecture change. No
Architecture Book rule or ADR is needed; the operational contract belongs in
`docs/agent-dev-environment.md` and the executable scanners.

## Goals / Non-Goals

**Goals:**

- Inspect author and committer name/email headers on every commit added over the resolved merge
  base.
- Give header findings an explicit, stable source and a safe field-level location.
- Preserve the existing no-match-in-output guarantee and layer-B enforcement.
- Prove matching and healthy behavior end to end in both scanner implementations.
- Keep the existing workflow invocation sufficient and the healthy lane silent.

**Non-Goals:**

- Inspecting, rewriting, or baselining historical commit headers.
- Changing identity derivation, configured patterns, allowlists, or baseline files.
- Enforcing which identity Git uses when creating a commit.
- Checking pull-request or comment actor metadata.
- Changing any mobile, server, web, API, database, native, deploy, or legacy-app behavior.

## Decisions

### Decision 1 — Enumerate the branch range and structurally parse commit objects

The repository scanner obtains every commit hash, including merge commits, with one `git rev-list`
over `mergeBase..head`, then reads and structurally parses each raw commit object. Identity headers
are newline-delimited and the message begins after the header block's blank line; unlike arbitrary
control-character framing, those boundaries cannot occur inside a Git identity header. The existing
commit-message records and new header records are produced from those same commit objects and the
single authoritative range.

For each commit, create four logical header records: `author-name`, `author-email`,
`committer-name`, and `committer-email`. This keeps locations precise without constructing a
synthetic identity line that could double-count matches spanning display and address formatting.

Alternatives considered:

- A formatted `git log` stream with control-character field or record delimiters is unsafe because
  Git permits those bytes inside identity headers.
- A second branch-range query only for headers duplicates range resolution and can drift from the
  commit-message lane.
- Parsing human-readable `Author:` output is locale- and formatting-dependent.
- Combining name and email into one record makes the location less actionable and changes
  occurrence behavior through artificial punctuation.

### Decision 2 — Use `source: "commit-header"` with safe locations

Both implementations will expose `commit-header` as the source. A location contains only the
abbreviated commit hash and the fixed field label, for example `commit <short-sha> author-email`.
The header value is passed only to the matcher and is never used in the location, excerpt, error
annotation, or summary.

The contributor preflight may retain its existing redacted excerpt property because the matcher
replaces each match before returning a finding. The CI implementation continues its stricter
location/class/count-only output. Tests inspect serialized findings and captured end-to-end output
to prove the synthetic matched value is absent.

Alternative considered: reuse `commit-message`. Rejected because callers and regression tests
could not distinguish message coverage from header coverage, recreating the blind spot under an
apparently green aggregate.

### Decision 3 — Commit headers are permanently layer B

The lane scans exactly the commits in `mergeBase..head`. Every record is marked introduced by the
branch and is matched with no baseline and no published-path narrowing. It does not read either
baseline lane and does not add a new baseline schema field.

This is permanent policy, not a rollout shortcut. A history walk would turn accepted authorship
into recurring failures; a baseline cannot key a header without inventing a new public identity
index; and path narrowing has no defined path to test.

Alternative considered: scan all identities reachable from head and suppress known history.
Rejected because it is noisy by construction and would require publishing or maintaining the
identity footprint this control exists to avoid.

### Decision 4 — Preserve each implementation's detector inputs

The new records flow through the same matchers already used for branch commit messages. CI uses
its derived, structural, and optional configured sources. The contributor preflight uses the
runtime-supplied pattern list. No new pattern or header-specific allowlist is introduced.

The repository derivation step may continue reading public commit identities to build its detector
vocabulary; that does not change the header scan target. Only header records from the branch range
are judged. Platform and role identities already excluded by existing detector policy remain
healthy.

Alternative considered: hard-code an approved identity list for headers. Rejected because it
duplicates existing policy, risks divergence, and would make this change commit identity strings
for policy rather than consume runtime detectors.

### Decision 5 — Prove parity through black-box branch fixtures

Tests create temporary repositories with a clean base and branch-only commits. Matching fixture
values are assembled at runtime and supplied through environment/configuration rather than written
as protected literals.

Both implementations need tests for:

- each of the four header fields producing `source: "commit-header"` and a non-zero exit/verdict;
- a matching header on a branch-added merge commit producing the same redacted failure;
- serialized findings and command output omitting the matched value;
- a base-only matching header producing no finding, proving the merge-base boundary;
- the healthy automation set producing no header findings and no failure;
- commit messages continuing to report as `commit-message`, proving source separation.

The repository suite remains the CI proof because the existing workflow runs it before invoking
the scanner. The contributor preflight's canonical package must receive equivalent focused tests
and be materialized before the change is considered complete; changing only the repository copy
would re-open implementation drift.

## Risks / Trade-offs

- **Delimiter or empty-field parsing loses a header** → Use fixed field positions, retain empty
  fields, and cover all four fields plus multi-commit ranges in parser/end-to-end tests.
- **A finding republishes the identity in a public log** → Keep values out of labels and locations;
  assert their absence from serialized findings and captured output.
- **The lane accidentally scans base history** → Build the log from the already resolved
  `mergeBase..head` range and include a base-only matching fixture.
- **Preflight and CI diverge again** → Define the same source/location/range contract, test both
  black boxes, and require materialization verification for the external preflight package.
- **Healthy automation begins producing noise** → Exercise the existing healthy set explicitly;
  do not add a new allowlist as part of this change.
- **CI gate changes stop unrelated work** → Keep workflow wiring unchanged unless a failing proof
  demonstrates it is necessary; run the focused scanner suite and a clean scan on the final branch.

## Migration Plan

1. Add failing black-box fixtures to both scanner suites for the missing header source and the
   branch-only boundary.
2. Extend each existing commit-log parser and route the four fields through its current matcher.
3. Run matching, redaction, source-separation, healthy-set, and base-only proofs.
4. Update the operating documentation and confirm the existing CI workflow still executes both
   the tests and the gate with full history available.
5. Materialize and verify the canonical contributor preflight update, then run it against the exact
   publication text for this change.

Rollback is a code revert in the affected scanner implementation. There is no data migration,
baseline migration, or live deploy act.

## Open Questions

None. The branch boundary, layer semantics, source name, healthy set, and redaction requirements
are fixed by the issue acceptance criteria.
