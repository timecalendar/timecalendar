## Why

This repository is public, and two independent mechanisms now try to stop a contributor from
publishing an identifying string into it:

- the **PR preflight**, which every automated contributor runs before creating or editing a pull
  request. It reads the whole of every file the branch touches, plus the branch's paths, commit
  messages, and the text about to be published;
- the **CI gate** (`ci/disclosure-scan.mjs`, TIM-468), which runs in `ci-build-deploy.yml` and
  reads only the lines the branch **added**, plus its paths and commit messages.

They disagree in two ways that matter, and a preflight and a CI gate that disagree is the worst
outcome available: whichever is weaker becomes the real policy, while the stronger one supplies
false confidence.

**1. The CI gate has no whole-file layer.** It is diff-scoped by construction, so a string already
sitting on the base branch is invisible to it — most invisible in exactly the files a team edits
most often. The preflight reads the whole file.

**2. The CI gate's `creditPaths` allowlist excuses lines the branch just added.** Measured against
the gate's own exported functions on PR #357's head: an added line carrying a derived identity
inside a `creditPaths` entry produces **0 findings**, while the identical line one directory away
produces **1**. That is the substitution hole the preflight's layer B exists to close, still open
in CI. A path allowlist excuses a file forever, including a leak added to it tomorrow.

The fix for both is the artifact this change commits: a **count-keyed baseline file** with two
generated content lanes. `entries` records the preflight's `(path, pattern id, count)` pins;
`ciEntries` records CI's `(path, finding class, count)` pins. The lanes share file and verdict rules
without pretending that independently derived detector vocabularies are interchangeable. Both hold
integers and safe labels, never the matched string, so the file is committable to the repository it
protects while a pattern list never is. A pinned count excuses only the footprint that was measured;
the next occurrence fails.

### The live cost, measured rather than assumed

At `489ede46`, with the deployed pattern list and `publishedIn` honoured as the preflight honours
it:

| | |
| --- | --- |
| tracked files scanned | 2580 |
| paths carrying an occurrence | 46 |
| occurrences | 101 |
| of those paths, suppressed today by a `publishedIn` path entry | 13 |
| **paths that hard-stop a branch today** | **33** |
| **of the last 200 non-merge commits, those touching a hard-stop path** | **38 (19%)** |

This corrects the figure the ticket was opened on. TIM-473 cites 63 of 200 commits (31%), which is
the footprint measured with `publishedIn` retired; the deployed preflight honours it, so the live
rate is 19%. The conclusion is unchanged — roughly one PR in five stops with **no remediation
available to its author** — but the cause is not the locale files. `publishedIn` already absorbs
the credit surface. What is left is documentation and planning files carrying a host path or an
internal alias: `owner-personal-name` at 16 paths, `internal-host-alias` at 7, `host-home-directory`
at 6.

That also reframes what this change buys. It is not only unblocking: the 13 suppressed paths are
suppressed by a **permanent path amnesty**, which cannot distinguish the credit that belongs there
from a leak added beside it next month. Replacing those with pinned counts is strictly stronger.

## What Changes

- Commit one generated `ci/disclosure-baseline.json` with backward-compatible `entries` for the
  preflight and separate `ciEntries` for CI. Every item in either lane is exactly
  `{path, id, count}`; each lane independently rejects duplicate `(path, id)` keys.
- Give `ci/disclosure-scan.mjs` the whole-file layer it lacks, so both mechanisms ask the same two
  questions of the same text: *is this file's footprint larger than its pin?* and *does any line
  this branch added carry an occurrence at all?*
- Stop `creditPaths` excusing added lines, and retire its **content** narrowing into baseline
  entries. This is a behavioural fix, not a refactor: the probe above is the bug it closes.
- Keep the key itself as the CI side's **path lane**, narrowing `source: "path"` findings only, and
  extend it to the two protected paths a count-keyed baseline cannot express. A pin and a path
  exemption are disjoint by match source; the CI gate hard-stops those two paths today.
- Add a CI invariant step that re-measures `ciEntries` with CI's available detector sources and
  fails when a committed CI pin **exceeds** what the tree actually carries. The preflight continues
  to enforce `entries` when its out-of-repository pattern input is present; CI does not claim it can
  reconstruct that lane without the input.
- Record the regeneration recipe, the non-increasing invariant, and the exclusion rationale in
  `docs/agent-dev-environment.md`.

## Capabilities

### New Capabilities

- `disclosure-gate`: The mechanical control that stops an identifying string reaching this public
  repository — its two layers, the committed count-keyed baseline, and the requirement that the
  preflight and the CI gate reach the same verdict.

### Modified Capabilities

None.

## Impact

- Affected repository areas: `ci/disclosure-scan.mjs`, `ci/disclosure-allowlist.json`, the new
  `ci/disclosure-baseline.json`, `ci/disclosure-scan.test.mjs`, and `docs/agent-dev-environment.md`.
- **Sensitive surface:** `.github/workflows/ci-build-deploy.yml` gains one narrowly scoped step for
  the baseline invariant. No trigger, deploy, migration, or image-build behaviour changes.
- No production code, API contract, generated client, database schema, native/store config, or
  legacy Flutter code is touched.
- **Depends on PR #357 (TIM-468) merging first**, unchanged, as TIM-473 §4 requires. Verified: the
  #357 tree measures the same 46 paths / 101 occurrences as `main`, so it introduces no footprint of
  its own and the census is stable across that merge.
- **The committed preflight lane is inert until its callers pass it.** The preflight reads it only when
  the caller supplies `baseline`, and that caller configuration lives outside this repository. It is
  named as a task and routed, not assumed.

## Non-Goals

- Scrubbing any occurrence. That is TIM-471 (PR #359), which shrinks this baseline when it merges.
- The committed private key under `ci/certificates/`, excluded here on purpose — TIM-472 owns it,
  and its fix is remove-and-generate.
- Changing the pattern list, or which paths carry a `publishedIn` entry. That list lives outside
  this repository by design; TIM-475 moves its content carve-outs into baseline entries.
- Removing or editing any author credit, licence, or legal notice to satisfy a scan.
