## 1. Specify the convergence seam with focused tests

- [x] 1.1 Add table-driven tests for the pure CI-lane reconciliation helper covering equal and
  decreased counts, zero/removal, measured increases, fresh-only keys, and deterministic
  `(path, id)` ordering; verify every emitted count is at most its committed count and every emitted
  key existed in the committed lane.
- [x] 1.2 Add coverage proving convergence carries the preflight `entries` array through unchanged
  and preserves committed `configured-pattern` keys when the configured detector input is absent;
  verify canonical formatting and its single trailing newline are deterministic.
- [x] 1.3 Add a black-box CLI test that builds a synthetic stale baseline, proves
  `--check-baseline` fails before convergence, captures `--converge-baseline` output, and proves the
  check passes with that candidate supplied through `--baseline`.
- [x] 1.4 Extend the enforcement regression cases so a measured increase remains over its retained
  pin and a newly added occurrence still hard-fails through the baseline-free layer after a
  convergence candidate is generated.
- [x] 1.5 Strengthen the workflow contract test to prove CI still runs
  `--check-baseline` and the ordinary branch scan, never the maintenance-only convergence mode;
  make no `.github/workflows/` edit.

## 2. Implement reduction-only generation

- [x] 2.1 Add and export a small reconciliation helper in `ci/disclosure-scan.mjs` that iterates
  committed `ciEntries` only, lowers reproducibly measured counts, drops reproducibly measured zero
  counts, retains lower committed counts on increases, preserves unmeasurable configured-source
  pins, and returns canonical ordering; run the focused helper tests from section 1.
- [x] 2.2 Add `--converge-baseline` to CLI parsing as a baseline operation mutually exclusive with
  `--generate-baseline` and `--check-baseline`; verify invalid operation combinations fail closed
  without writing candidate output.
- [x] 2.3 Wire convergence through the existing baseline parser, CI census, and canonical formatter,
  preserving the complete version-1 document and `entries` lane; run the black-box tests from
  section 1 and inspect output to confirm it contains only paths, safe ids, and counts.

## 3. Document the maintenance boundary

- [x] 3.1 Update `docs/agent-dev-environment.md` beside the full regeneration recipe with the
  reduction-only command, when to use each mode, the generated-candidate review flow, and the rule
  that new or increased findings remain unpinned.
- [x] 3.2 Re-read `docs/mobile/architecture-book/architecture.md` and `testing.md` after
  implementation. Record in the PR handoff that no Architecture Book file changes because the new
  maintenance command does not alter the mobile architecture or test contract; if that conclusion
  no longer holds, update the topical page and `CHANGELOG.md` in the same commit.

## 4. Prove repository and motivating-revision behavior

- [x] 4.1 Run `node --test ci/disclosure-scan.test.mjs` and record the exact passing test count at
  the implementation commit.
- [x] 4.2 Run `node ci/disclosure-scan.mjs --check-baseline`, then generate a convergence candidate
  from current `main` into run-owned scratch space and use a byte comparison to prove it is
  identical to `ci/disclosure-baseline.json`.
- [x] 4.3 Against immutable revision `f7a3d35624515e5e3baa3880f7a9e28b3e75bb11` in an isolated
  read-only checkout, generate a convergence candidate with the implemented scanner. Prove by
  structured JSON comparison that the only baseline difference is removal of
  `mobile/src/features/about/ui/about-screen.test.tsx` / `derived-identity` at 6→0, and prove
  `--check-baseline --baseline <candidate>` passes. Report only the path, safe id, and counts.
- [x] 4.4 Run the ordinary disclosure scan against the branch merge base and confirm the added-line,
  path, rename, commit-metadata, and whole-file verdict remains green without changing
  `ci/disclosure-baseline.json` or `.github/workflows/`.
- [x] 4.5 Inspect the final diff and status: only the OpenSpec change, scanner, focused tests, and
  repository environment documentation may change. Confirm no detector, allowlist, matched value,
  product file, external tooling, or enumerated sensitive product/deploy surface entered scope.

## 5. Prepare the review handoff

- [x] 5.1 Update the Architecture Book disposition, local-green commands, exact-revision proof,
  unchanged sensitive-surface assessment, and any skipped path-gated jobs in the PR body without
  publishing matched text.
- [x] 5.2 Run the required contributor disclosure preflight over the complete branch and exact PR
  title/body before review handoff; stop on every finding and report only safe ids, paths, and
  occurrence counts.
