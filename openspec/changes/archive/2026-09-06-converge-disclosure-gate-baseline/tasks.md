## 0. Precondition

- [x] 0.1 Confirm PR #357 (TIM-468) has merged to `main`, then rebase this branch onto it. Do not
      start section 2 before that: `ci/disclosure-scan.mjs` does not exist on `main` until it lands.
      No content merge conflict is expected — verified that the #357 tree measures the same 46 paths
      / 101 occurrences as `489ede46`, entry-for-entry.

## 1. Commit the generated preflight lane

- [x] 1.1 Regenerate the baseline **at this branch's merge base as it will land** (design Decision
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
- [x] 1.2 Verify the committed `entries` lane end to end: it parses, every entry has exactly `path`, `id`,
      `count`, and no entry names a path whose own text matches (design Decision 5 — the generator
      will not emit one; confirm none was added).
- [x] 1.3 Prove acceptance criterion 4 mechanically — feed the committed baseline back to the scan
      as `text` against the full pattern list and confirm **zero occurrences, exit 0**. Record the
      numbers in the PR body. This is the property that makes the file committable; do not take it
      on faith.

## 2. Close the added-line hole in the CI gate

- [x] 2.1 In `ci/disclosure-scan.mjs`, stop `isCreditPath` suppressing findings on records the
      branch added. A credit path narrows the whole-file layer only (task 3), never an added line,
      an added path, or a commit message.
- [x] 2.2 Add a test to `ci/disclosure-scan.test.mjs` that fails without 2.1: an added-line record
      inside a `creditPaths` entry carrying a derived token MUST produce a finding. Verify the test
      fails against the pre-2.1 code before you keep it — the current behaviour is 0 findings for
      that record and 1 for the identical record outside a credit path, so an untested fix here is
      indistinguishable from no fix.
- [x] 2.3 Confirm the structural rules (address, bare profile URL, home directory, co-author
      trailer) still run on credit paths, unchanged.

## 3. Give the CI gate the whole-file layer

- [x] 3.1 Teach `ci/disclosure-scan.mjs` to generate and read the `ciEntries` lane in
      `ci/disclosure-baseline.json`, leaving the existing `entries` lane byte-for-byte compatible
      with the deployed preflight loader. Generate both lanes from the same tracked tree and
      exclusion. Every item in either lane has exactly `path`, `id`, and positive integer `count`;
      reject duplicate `(path, id)` keys independently per lane. CI layer A reads only `ciEntries`:
      for each file the branch touches, total each finding class's occurrences over the **whole file
      at the head commit** and compare with the pin for that `(path, class)`. Over the pin, unpinned
      at that path, or a touched path with no entry: report. Path-source matches enter neither
      content lane. Keep layer B exactly as it is after task 2.
- [x] 3.2 Keep the two committed-artifact properties intact: no denylist is committed, and no
      finding prints its match. Layer A reports `file`, `line`, class and count only.
- [x] 3.3 Keep the fail-closed behaviour on an unresolvable merge base, and keep a missing baseline
      meaning *every pin is zero* rather than *skip layer A* — the unbaselined behaviour is the same
      rule, not a special case.
- [x] 3.4 Split `creditPaths` in `ci/disclosure-allowlist.json` **by match source**, per the amended
      §4 (`publishedIn` retired for content, kept and extended for paths). Retire its **content**
      narrowing into baseline entries once 3.1 covers those paths, and **keep the key as the CI
      side's path lane**: with a baseline present it narrows `source: "path"` findings only, and a
      content carve-out beside a baseline is an error rather than a judgement call. Do **not** delete
      the key — measured on `pr/357` with the gate's own `scanRecords`, it is the only configuration
      in which a protected path can be exempted at all, and a baseline entry cannot express one
      (Decision 5). Leave `excludedPaths`, the domain lists and `applicationIdLabels` alone —
      verified that no baseline path falls inside `excludedPaths`, so the two scope filters need no
      reconciliation.
- [x] 3.5 Extend that path lane to the two legacy Flutter Android entry-point paths under
      `app/android/app/src/main/{java,kotlin}/…/MainActivity.{java,kt}`, which the out-of-repository
      list carved out on 2026-09-06 and `creditPaths` omits — amended §4 divergence (b). Measured on
      `pr/357`: as shipped, those two path records each report **1 `derived-identity`** finding;
      extending the lane to their directories is the **only** configuration that clears them (0
      findings); retiring the key wholesale leaves them at 1 each with no expressible remedy. Use
      wildcard or prefix segments so the protected literal is never written into the repository, and
      keep task 2.1's rule intact — a path this branch *creates or renames* is judged unnarrowed.
- [x] 3.6 Extend `ci/disclosure-scan.test.mjs` for layer A: at-pin passes, over-pin fails, unpinned
      class at a pinned path fails, unpinned touched path fails, a deleted-only file is skipped,
      malformed lane objects fail, and duplicate `(path, id)` keys fail independently per lane.
- [x] 3.7 Regenerate `ciEntries` immediately before landing. At the current merge base, the
      always-on sources measure **55 paths / 56 entries / 134 occurrences**:
      `derived-identity` 47/111, `home-directory-path` 6/12, and `email-address` 3/11
      (entries/occurrences). Smaller is valid; larger is a review finding. Confirm the complete JSON
      scans clean.

## 4. Make the invariant mechanical

- [x] 4.1 Add a baseline-invariant mode (a flag on `ci/disclosure-scan.mjs`, or a sibling script) that
      re-measures `ciEntries` at the commit under test and exits non-zero when any committed CI
      entry **exceeds** the measured count, naming path and id and printing no match. It MUST NOT
      claim to remeasure `entries` without the out-of-repository preflight pattern input; when that
      input is present, the preflight enforces its own lane.
- [x] 4.2 Wire it into the existing `Scan branch for disclosures` job in
      `.github/workflows/ci-build-deploy.yml` as one clearly named step. **Sensitive surface** —
      change no trigger, no deploy behaviour, no image build, and no unrelated step.
- [x] 4.3 When the optional configured source is absent, record the documented degraded coverage and
      remeasure the always-on classes. When it later appears, verify an unpinned
      `configured-pattern` finding fails closed until a deliberate regenerated `ciEntries` lane is
      reviewed.

## 5. Re-run the calibration the ticket asks for (§4)

- [x] 5.1 Re-run PR #357's "zero false positives" calibration **using the gate's own code**, not an
      ad-hoc grep. Note before starting: `compileLiteralPattern` already compiles `giu`, so the
      matcher is case-insensitive today — the risk is that the *calibration harness* was not, which
      is what §4 is pointing at. State which was measured.
- [x] 5.2 Calibrate whole-tree rather than by replaying commits: bucket every occurrence of a
      literal by the character either side of the match. That enumerates the published shapes
      exhaustively and proves an exemption holds by construction rather than by sampling.
- [x] 5.3 Confirm the two mechanisms now **agree** on the two path-only matches under
      `app/android/app/src/main/{java,kotlin}/…/MainActivity.{java,kt}` (design Decision 5): both
      narrow them where they already exist, and both fail a branch that creates or renames a path at
      that shape. The preflight side landed out-of-repository on 2026-09-06; the CI side is task 3.5.
      *(Amended: this was written as "a measurement, not a fix" before the ruling made the CI-side
      path lane TIM-473's own scope. Measure both directions and report the verdict of each.)*
      Free head start already banked: on the owner-login class the two mechanisms produce an
      identical 4-line hit set at `489ede46`, differing only in how the credit is exempted.

## 6. Documentation

- [x] 6.1 Add a baseline section to `docs/agent-dev-environment.md` next to the existing
      disclosure-gate material: what the file is, why a count is committable where a string is not,
      the regeneration command, the non-increasing invariant, and why `ci/certificates/` is excluded.
- [x] 6.2 State the accepted cost from design Decision 4 — a branch that rewrites a credit line
      itself is a hard stop in both mechanisms, and the escape is procedural, never a new flag.
- [x] 6.3 No Architecture Book change: this is repository and CI infrastructure, not `mobile/`.
      Confirm this holds after implementation rather than assuming it.

## 7. The caller dependency (design Decision 7)

- [x] 7.1 The committed baseline is inert on the preflight side until callers pass
      `baseline: "ci/disclosure-baseline.json"`. That configuration lives outside this repository.
      Report on TIM-473, mentioning the Founding Engineer, that the file has landed and the caller
      change is the remaining step — this is TIM-473 acceptance criterion 1 in production and it is
      not satisfied by the merge alone.
- [x] 7.2 Post to TIM-472 that its fix is **remove-and-generate**, not regenerate-and-recommit:
      delete the committed pair and generate at test time (`ci/generate-dummy-firebase-key.sh` is
      the precedent). A branch that only deletes a file is skipped by the scanner, so that fix has a
      clean path through the gate; replacing the key in place does not. **Done early, on purpose:**
      TIM-472 went `in_progress` while this change was still blocked, and the two approaches diverge
      at its first commit. Noted there that TIM-476 states the same fix directly and is `blocked`;
      the two want resolving against each other.

## 8. Verification before handoff

- [x] 8.1 `node --test ci/disclosure-scan.test.mjs` green, including every test added above.
- [x] 8.2 Reproduce TIM-473's acceptance table and put the numbers in the PR body: (1) a branch
      touching only `mobile/src/i18n/locales/en.json` passes with the baseline and fails without it
      **once the content `publishedIn` carve-outs are retired** — with them in place it passes
      either way, which is why the row must state which list was used; (2) the substitution case
      fails on layer B with the count unchanged; (3) an unpinned dirty path fails, a raised count
      fails, a new id at a pinned path fails; (4) the complete two-lane baseline scans clean; (5)
      `entries` retains the accepted 45 / 50 / 100 census and `ciEntries` records the current
      always-on 55 / 56 / 134 census or a reviewed smaller result after regeneration.
- [x] 8.3 Run the disclosure preflight on the exact PR title, body and every comment before
      publishing them. Report paths, ids and counts only — never a matched string, in the PR or on
      the ticket.
