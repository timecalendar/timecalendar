## Context

`ci/disclosure-scan.mjs` owns three baseline operations today. It parses the committed version-1
document, fully regenerates `ciEntries` while carrying `entries` through the shared formatter, and
checks committed CI pins against a fresh census. The check intentionally fails when a committed pin
is stale, because a removed occurrence must not leave budget that can later be reoccupied.

The full generator is the wrong repair for that ordinary reduction case. At the product branch that
exposed this gap, the fresh census removes one committed key but also discovers unrelated unpinned
keys. Accepting the full output would convert those findings into baseline debt; editing only the
desired removal by hand would violate the generated-artifact contract.

The repair must stay inside the repository scanner. It cannot change detector semantics, the two
scan layers, workflow wiring, the committed baseline on this branch, or external contributor
tooling. Its output and failures are public, so diagnostics must continue to contain only paths,
safe ids, and counts.

## Goals / Non-Goals

**Goals:**

- Provide one generated, reduction-only path from a stale committed baseline to a converged
  candidate.
- Preserve the complete version-1 document and the preflight-owned `entries` lane unchanged.
- Guarantee that convergence never adds a CI key or raises a committed CI count.
- Keep the full generator available for deliberate detector/source changes.
- Prove the invariant and both disclosure layers retain their current fail-closed behavior.

**Non-Goals:**

- Changing matching, counting, redaction, exclusions, allowlists, or configured-pattern handling in
  ordinary scans.
- Updating `.github/workflows/`, `ci/disclosure-baseline.json`, product files, or legacy Flutter.
- Publishing or changing external pipeline tooling.
- Automatically deciding that a new or increased finding is legitimate baseline debt.

## Decisions

## Decision 1 — Add a distinct convergence command

Add `--converge-baseline` as a third explicit baseline operation beside
`--generate-baseline` and `--check-baseline`. It reads the baseline selected by the existing
`--baseline` option, measures the selected `--head`, writes the complete candidate to stdout, and
does not edit a file itself. Baseline operation flags are mutually exclusive and an invalid
combination fails before generation.

Keeping a separate command makes intent reviewable: full generation may introduce a new census
after a deliberate detector/source change, while convergence is mechanically incapable of doing
so. Overloading `--generate-baseline` with an implicit mode or an environment switch would make the
security-relevant distinction easy to miss in command history and review.

## Decision 2 — Reconcile by iterating committed CI keys only

Build a lookup from the fresh `generateCiEntries` census, then iterate only the committed
`ciEntries` keys:

1. If a reproducibly measured count is zero or absent, omit the committed entry.
2. If the measured count is below the committed count, emit the measured count.
3. If the measured count is equal to or above the committed count, emit the committed count.
4. Never iterate fresh-only keys, so they cannot enter the candidate.

The result is sorted with the same `(path, id)` ordering used by full generation and serialized by
the existing canonical formatter. The `entries` array is passed through without remeasurement,
reordering, or value changes. Because the committed file already uses this formatter, a converged
candidate on a tree with no legitimate reductions is byte-identical to it.

Using `min(committed, measured)` over the union of keys was rejected: union iteration would add
fresh-only keys. Filtering a fully generated document after serialization was also rejected because
it duplicates document logic and makes preservation of the other lane harder to prove.

## Decision 3 — Preserve pins whose detector source is unavailable

The optional configured detector source is not reproducible when its runtime input is absent. In
that degraded state, convergence retains committed `configured-pattern` entries exactly rather than
treating absence from the census as a measured zero. This mirrors `--check-baseline`, which already
excludes those entries from stale-pin judgements when the source is unavailable.

Deleting an unmeasurable pin would claim a reduction the command did not observe. Full generation
keeps its existing deliberate behavior; the stricter rule applies only to convergence.

## Decision 4 — Reuse parsing, census, and formatting seams

The implementation should expose one small pure reconciliation helper for table-driven tests and
reuse `parseBaseline`, `generateCiEntries`, and `formatBaseline` for end-to-end command tests. No
second parser, detector path, or serializer is introduced.

Focused tests cover equal, decreased, zero, increased, fresh-only, and temporarily unmeasurable
configured keys; exact preservation of `entries`; stable ordering and trailing-newline formatting;
and the end-to-end stale-check sequence using `--baseline <candidate>`. A workflow contract test
continues to prove CI invokes `--check-baseline` and the ordinary scan, not the maintenance-only
convergence command.

## Decision 5 — Verify the motivating revision without importing its product changes

The Applier will run the new command against the immutable product-branch revision in an isolated
read-only worktree or equivalent Git view. The candidate must differ from its committed baseline
only by removing the reported `mobile/src/features/about/ui/about-screen.test.tsx` /
`derived-identity` pin from 6 to 0, and `--check-baseline --baseline <candidate>` must pass there.
No product file or generated candidate from that revision is committed on this repair branch.

Current `main` supplies the complementary proof: convergence output must be byte-identical to the
committed baseline. Together these checks prove that the mode accepts the intended reduction while
refusing to absorb the unrelated fresh census.

## Risks / Trade-offs

- **A measured increase remains hidden in convergence output.** → This is intentional: the
  committed lower pin remains, so whole-file or added-surface enforcement continues to fail rather
  than legitimizing the increase.
- **A fresh-only key is absent from the candidate.** → This is also intentional; it remains
  unpinned and must be resolved or deliberately accepted through full generation in a separately
  reviewed detector/source change.
- **Users may choose the wrong generator mode.** → Keep distinct names, document their separate
  purposes beside each other, and reject simultaneous baseline operation flags.
- **A public diagnostic could reveal matched text.** → Reuse the current census and invariant
  reporting paths, add no value-bearing output, and retain focused redaction/self-scan coverage.
- **Exact-revision verification could accidentally widen this branch.** → Use an isolated
  read-only checkout and compare candidate JSON; never copy product files or the candidate into this
  branch.

## Migration Plan

1. Land the scanner, tests, specification delta, and command documentation with no baseline or
   workflow change.
2. On the dependent product branch, rebase onto this repair, generate a convergence candidate,
   review the reduction-only diff, replace the baseline with that generated candidate, and rerun the
   invariant plus ordinary disclosure scan.
3. Rollback is the ordinary revert of this repair; the existing full generator, invariant check,
   committed baseline, and CI workflow remain compatible throughout.

## Open Questions

None. The command boundary, unavailable-source behavior, downstream sequencing, and verification
revisions are fixed by this design.
