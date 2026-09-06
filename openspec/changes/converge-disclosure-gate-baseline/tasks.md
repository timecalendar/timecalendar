## 0. Precondition

- [ ] 0.1 Confirm PR #357 (TIM-468) has merged to `main`, then rebase this branch onto it. Do not
      start section 2 before that: `ci/disclosure-scan.mjs` does not exist on `main` until it lands.
      No content merge conflict is expected — verified that the #357 tree measures the same 46 paths
      / 101 occurrences as `489ede46`, entry-for-entry.

## 1. Commit the generated baseline

- [ ] 1.1 Regenerate the baseline **at this branch's merge base as it will land** (design Decision
      2), never at a frozen SHA, with the pattern list from the out-of-repository configuration and
      `exclude: ["^ci/certificates/"]`:

      ```
      node <skill-dir>/scripts/workspace-safety.mjs disclosure-baseline request.json \
        | jq '.baseline' > ci/disclosure-baseline.json
      ```

      Expected at `489ede46`, for comparison: **45 paths, 50 entries, 100 occurrences** (raw census
      before the exclusion: 46 / 51 / 101). If TIM-471 (PR #359) has merged first, the numbers will
      be **smaller** — that is correct and expected; record what you actually measure, and never
      reconcile a smaller measurement upward.
- [ ] 1.2 Verify the committed file end to end: it parses, every entry has exactly `path`, `id`,
      `count`, and no entry names a path whose own text matches (design Decision 5 — the generator
      will not emit one; confirm none was added).
- [ ] 1.3 Prove acceptance criterion 4 mechanically — feed the committed baseline back to the scan
      as `text` against the full pattern list and confirm **zero occurrences, exit 0**. Record the
      numbers in the PR body. This is the property that makes the file committable; do not take it
      on faith.

## 2. Close the added-line hole in the CI gate

- [ ] 2.1 In `ci/disclosure-scan.mjs`, stop `isCreditPath` suppressing findings on records the
      branch added. A credit path narrows the whole-file layer only (task 3), never an added line,
      an added path, or a commit message.
- [ ] 2.2 Add a test to `ci/disclosure-scan.test.mjs` that fails without 2.1: an added-line record
      inside a `creditPaths` entry carrying a derived token MUST produce a finding. Verify the test
      fails against the pre-2.1 code before you keep it — the current behaviour is 0 findings for
      that record and 1 for the identical record outside a credit path, so an untested fix here is
      indistinguishable from no fix.
- [ ] 2.3 Confirm the structural rules (address, bare profile URL, home directory, co-author
      trailer) still run on credit paths, unchanged.

## 3. Give the CI gate the whole-file layer

- [ ] 3.1 Teach `ci/disclosure-scan.mjs` to read `ci/disclosure-baseline.json` and add layer A: for
      each file the branch touches, total each finding class's occurrences over the **whole file at
      the head commit** and compare with the pin for that `(path, class)`. Over the pin, unpinned at
      that path, or a touched path with no entry: report. Keep layer B exactly as it is after task 2.
- [ ] 3.2 Keep the two committed-artifact properties intact: no denylist is committed, and no
      finding prints its match. Layer A reports `file`, `line`, class and count only.
- [ ] 3.3 Keep the fail-closed behaviour on an unresolvable merge base, and keep a missing baseline
      meaning *every pin is zero* rather than *skip layer A* — the unbaselined behaviour is the same
      rule, not a special case.
- [ ] 3.4 Retire `creditPaths` from `ci/disclosure-allowlist.json` into baseline entries, and delete
      the key once 3.1 covers those paths. Leave `excludedPaths`, the domain lists and
      `applicationIdLabels` alone — verified that no baseline path falls inside `excludedPaths`, so
      the two scope filters need no reconciliation.
- [ ] 3.5 Extend `ci/disclosure-scan.test.mjs` for layer A: at-pin passes, over-pin fails, unpinned
      class at a pinned path fails, unpinned touched path fails, and a deleted-only file is skipped.

## 4. Make the invariant mechanical

- [ ] 4.1 Add a baseline-invariant mode (a flag on `ci/disclosure-scan.mjs`, or a sibling script) that
      re-measures the census at the commit under test and exits non-zero when any committed entry
      **exceeds** the measured count, naming path and id and printing no match.
- [ ] 4.2 Wire it into the existing `Scan branch for disclosures` job in
      `.github/workflows/ci-build-deploy.yml` as one clearly named step. **Sensitive surface** —
      change no trigger, no deploy behaviour, no image build, and no unrelated step.
- [ ] 4.3 Confirm it passes with no `DISCLOSURE_PATTERNS` secret and on a fork, so it degrades the
      way the rest of the gate does.

## 5. Re-run the calibration the ticket asks for (§4)

- [ ] 5.1 Re-run PR #357's "zero false positives" calibration **using the gate's own code**, not an
      ad-hoc grep. Note before starting: `compileLiteralPattern` already compiles `giu`, so the
      matcher is case-insensitive today — the risk is that the *calibration harness* was not, which
      is what §4 is pointing at. State which was measured.
- [ ] 5.2 Calibrate whole-tree rather than by replaying commits: bucket every occurrence of a
      literal by the character either side of the match. That enumerates the published shapes
      exhaustively and proves an exemption holds by construction rather than by sampling.
- [ ] 5.3 Measure whether the two mechanisms agree on the two path-only matches under
      `app/android/app/src/main/{java,kotlin}/…/MainActivity.{java,kt}` (design Decision 5). This is
      a **measurement, not a fix** — the preflight side is TIM-475's. Report the verdict of each.
      Free head start already banked: on the owner-login class the two mechanisms produce an
      identical 4-line hit set at `489ede46`, differing only in how the credit is exempted.

## 6. Documentation

- [ ] 6.1 Add a baseline section to `docs/agent-dev-environment.md` next to the existing
      disclosure-gate material: what the file is, why a count is committable where a string is not,
      the regeneration command, the non-increasing invariant, and why `ci/certificates/` is excluded.
- [ ] 6.2 State the accepted cost from design Decision 4 — a branch that rewrites a credit line
      itself is a hard stop in both mechanisms, and the escape is procedural, never a new flag.
- [ ] 6.3 No Architecture Book change: this is repository and CI infrastructure, not `mobile/`.
      Confirm this holds after implementation rather than assuming it.

## 7. The caller dependency (design Decision 7)

- [ ] 7.1 The committed baseline is inert on the preflight side until callers pass
      `baseline: "ci/disclosure-baseline.json"`. That configuration lives outside this repository.
      Report on TIM-473, mentioning the Founding Engineer, that the file has landed and the caller
      change is the remaining step — this is TIM-473 acceptance criterion 1 in production and it is
      not satisfied by the merge alone.
- [ ] 7.2 Post to TIM-472 that its fix is **remove-and-generate**, not regenerate-and-recommit:
      delete the committed pair and generate at test time (`ci/generate-dummy-firebase-key.sh` is
      the precedent). A branch that only deletes a file is skipped by the scanner, so that fix has a
      clean path through the gate; replacing the key in place does not.

## 8. Verification before handoff

- [ ] 8.1 `node --test ci/disclosure-scan.test.mjs` green, including every test added above.
- [ ] 8.2 Reproduce TIM-473's acceptance table and put the numbers in the PR body: (1) a branch
      touching only `mobile/src/i18n/locales/en.json` passes with the baseline and fails without it
      **once the content `publishedIn` carve-outs are retired** — with them in place it passes
      either way, which is why the row must state which list was used; (2) the substitution case
      fails on layer B with the count unchanged; (3) an unpinned dirty path fails, a raised count
      fails, a new id at a pinned path fails; (4) the baseline scans clean.
- [ ] 8.3 Run the disclosure preflight on the exact PR title, body and every comment before
      publishing them. Report paths, ids and counts only — never a matched string, in the PR or on
      the ticket.
