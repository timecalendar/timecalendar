## Context

Two scanners guard this public repository, written independently, days apart, from different
starting points.

**The PR preflight** runs in every automated contributor's workspace before `gh pr create`,
`gh pr edit`, and every PR comment or review. It takes an explicit pattern list — safe `id` labels
paired with regexes — from configuration held **outside this repository**, because a denylist is a
list of the exact strings that must not be published, so a committed copy publishes them. It reads
the whole of every file the branch touches, the branch's file paths, its commit messages, and the
title/body/comment text passed to it. It reports occurrence counts per `(file, pattern id)` and
never prints the match.

**The CI gate**, `ci/disclosure-scan.mjs`, shipped under TIM-468 on PR #357. It derives its patterns
at run time from the repository's own commit authors (15 tokens at `489ede46`), adds structural
rules for shapes rather than values (address, bare profile URL, home directory, co-author trailer),
and optionally accepts an injected secret. It commits an **allowlist** — the inverse of a denylist —
at `ci/disclosure-allowlist.json`. It reads only the lines the branch added, its paths, and its
commit messages, and it prints a location and a class, never the match.

Both properties they share are correct and must survive this change: **no denylist is committed**,
and **no finding ever prints what it matched**.

### What was measured, and how

Every figure below was produced with the tools themselves at `489ede46`, patterns compiled
case-insensitively, and is reproducible with the commands in `tasks.md`. Nothing here was reasoned
from the shape of the code.

**The footprint.** 2580 tracked files, 2480 readable; **46 paths carry 101 occurrences** across 51
`(path, id)` entries. Excluding `ci/certificates/`, the generated baseline is **45 paths, 50
entries, 100 occurrences**. This reproduces the Founding Engineer's census exactly, from a separate
invocation, and reconciles with TIM-471's independent count of 48 paths / 103 once the two
path-only matches (which a contents census cannot see) are added.

**What actually blocks a branch today.** Of the 46 paths, 13 are fully covered by a `publishedIn`
path entry and report nothing; **33 hard-stop**, and **38 of the last 200 non-merge commits touch
one (19%)**. By pattern id across those 33: `owner-personal-name` 16 paths, `internal-host-alias` 7,
`host-home-directory` 6, `owner-github-login` 4, and one each of `agent-mention-uri`,
`control-plane-actor-id`, `credential-material`.

**The acceptance case, in this repository.** A branch whose only change is an added key in
`mobile/src/i18n/locales/en.json`:

| Pattern list | Baseline | Result |
| --- | --- | --- |
| as deployed | absent | exit 0 — `publishedIn` suppresses it |
| as deployed | present | exit 0 |
| `publishedIn` retired | absent | **exit 2**, 1 finding, 3 pre-existing occurrences |
| `publishedIn` retired | present | exit 0, absorbed by the pin |

The third row is the failure this change exists to end, and the fourth is it ending. It also shows
the sequencing: the baseline is the precondition for retiring the content carve-outs, which is
TIM-475's scope and is blocked on this change.

**The CI gate's added-line hole.** Driving the gate's own exported `scanRecords` with a synthetic
added-line record carrying a derived token (never printed):

| Added line in | `isCreditPath` | Findings |
| --- | --- | --- |
| `mobile/src/features/about/` | true | **0** |
| `mobile/src/features/home/` | false | 1 (`derived-identity`) |
| `openspec/changes/archive/2026-08-25-add-mobile-about-screen/` | true | **0** |

The gate excuses a fresh disclosure because of where it was written. That is Decision 4.

**Two things that turned out to be non-problems**, checked rather than assumed:

- PR #357's tree measures the same 46 paths / 101 occurrences as `main` — entry-for-entry identical.
  It introduces no footprint, so the census is stable across its merge.
- No baseline path falls inside the CI gate's `excludedPaths` (lockfiles, `node_modules`, generated
  API clients, `openapi/javascript`, `openapi/dart`, `app/ios/Pods`). The two scope filters are
  compatible today, so `excludedPaths` needs no reconciliation — it is a scope filter over generated
  and vendored trees, not an exemption.

## Goals / Non-Goals

**Goals:**

- Commit one generated, string-free baseline that both mechanisms consult.
- Make the CI gate ask the same two questions as the preflight, so the two reach the same verdict.
- Close the added-line hole `creditPaths` opens, and retire `creditPaths` into pinned counts.
- Make the non-increasing invariant mechanical rather than a review convention.

**Non-Goals:**

- Scrubbing anything (TIM-471), the committed key (TIM-472), or the pattern list and its
  `publishedIn` entries (TIM-470, TIM-475).
- Sharing pattern **ids** between the two mechanisms. Decision 3 explains why that is not
  achievable, and what replaces it.
- Vendoring the preflight scanner into this repository, or making CI depend on out-of-repo tooling.

## Decisions

## Decision 1 — Commit the baseline at `ci/disclosure-baseline.json`, generated, never hand-written

An entry is `{"path": …, "id": …, "count": …}`: a repository-relative path, a safe label, an
integer. That is the whole property — it records *how much* of a pattern a path carries, never
*what* it carries — and it is why this one artifact of the scan is safe to commit while the pattern
list is not.

**Verified, not asserted:** the generated document, read end to end as scan input against all 16
patterns, reports **0 occurrences** (TIM-473 acceptance criterion 4).

It is generated by the tool's `disclosure-baseline` command and **never edited to turn a job
green**. Raising a count to cover a finding is the one move the format is designed to make visible
in review.

`ci/certificates/` is excluded. Almost nothing touches that path, so leaving it un-baselined costs
approximately zero commits, and a committed private key in a public repository is exactly what a
`credential-material` pattern should refuse to normalise. It keeps failing, which is the intent, and
TIM-472 owns the fix: remove-and-generate, not regenerate-and-recommit.

## Decision 2 — Generate at the branch's merge base when it lands, not at a frozen SHA

TIM-473 §2 says to pin the footprint measured at `489ede46`. Take that as the *scope* — the whole
footprint, not only the excluded surface — rather than as a literal commit to re-measure against
forever, because TIM-471 (PR #359) is open and scrubs 30 of these paths down to a residue of 5 paths
/ 7 occurrences.

If TIM-471 merges first and this change still carries a baseline measured at `489ede46`, every
scrubbed path keeps a pin larger than its real footprint. Layer B still catches any line a branch
adds, so it is not a hole for new content — but layer A would then permit a scrubbed file to
silently regain occurrences up to the stale pin, quietly undoing the scrub, and "non-increasing"
becomes unverifiable because the committed numbers no longer describe the tree.

So: regenerate immediately before the branch lands, and record the resulting totals in the PR body.
Decision 6 makes a stale pin fail rather than rot.

## Decision 3 — Converge on the two layers and on the baseline, not on pattern ids

TIM-473 §4 asks for "shared pattern ids". That is not achievable, and the reason is a property of
the design rather than an implementation shortfall: the CI gate never receives the pattern list. It
derives tokens from commit authors and accepts an unlabelled secret, precisely so that no denylist
is committed. There are no ids to share, and inventing them would mean committing the mapping.

What converges instead is everything that determines the verdict:

- **the two layers.** Layer A: for each touched file, total each pattern's occurrences across the
  whole file and compare with the pin for that `(path, id)`; over the pin, unpinned at that path, or
  an unpinned dirty path, report every occurrence. Layer B: any occurrence on a line the branch
  added is reported whatever the baseline says. With no baseline every pin is zero, which is the
  unbaselined behaviour — the same rule, not a special case.
- **the baseline file**, consulted by both, keyed on each mechanism's own id vocabulary. A path may
  legitimately hold an entry under a preflight `id` and under a CI finding class; they are separate
  keys over the same paths and do not conflict.

Layer B is what makes layer A safe to have. A count-keyed baseline alone has a substitution hole —
delete one pre-existing occurrence, add a fresh disclosure elsewhere in the same file, count
unchanged, gate green — and layer B fails that branch on the line it wrote. It is also why
regenerating the baseline cannot launder a disclosure, and therefore why this change needs no rule
about who may regenerate it.

## Decision 4 — `creditPaths` stops excusing added lines, and retires into baseline entries

Measured above: the CI gate currently returns **0 findings** for a fresh identity written into a
`creditPaths` directory. Two changes, in this order:

1. **`creditPaths` narrows the whole-file layer only.** A line the branch added is judged with no
   path narrowing at all, matching the preflight. This is the bug fix and it stands on its own.
2. **The entries then retire into pinned counts.** Once layer A exists, a credit file's footprint is
   pinned, so re-indenting or reordering the credit block keeps the count and passes, while adding a
   *new* identity beside it raises the count and fails. A path amnesty cannot make that distinction;
   a count can.

The structural rules already run on credit paths today and continue to.

**Accepted cost, stated rather than engineered around.** Layer B is unnarrowed by ruling, so a
branch that rewrites the credit *line itself* — a genuine product change to the About screen — is a
hard stop in both mechanisms, with no in-tool remediation. This change does not invent an exemption
for it: doing so would reopen exactly the hole Decision 4 closes. The escape is procedural and
belongs to whoever owns that product change. If it becomes common, it is a ruling to seek, not a
flag to add.

## Decision 5 — A matching **path** is never baselined; that stays with `publishedIn`

A baseline entry is *keyed on* the path, so pinning a path whose own text matches would write the
protected string into the one file whose entire value is that it holds none. This is not a policy
preference and not something to engineer around — it is the reason the file is committable.

Two paths in this repository match on a directory segment while their contents are clean: the legacy
Flutter Android entry points under `app/android/app/src/main/{java,kotlin}/…/MainActivity.{java,kt}`.
That segment is the published Android `applicationId`, so renaming it renames the shipped app.
Their permanent home is a `publishedIn` entry in the out-of-repo pattern list, which is TIM-475's
scope, not this change's — this change must not try to pin them, and the generator will not emit
them.

On the CI side the same two paths are reachable through the gate's path records and are not covered
by an `applicationIdLabels` shape exemption, because a slash-separated path is not a reverse-DNS
identifier. `tasks.md` carries a measurement task for this rather than a fix, so the two mechanisms
are at least *known* to agree on it.

## Decision 6 — Make the non-increasing invariant mechanical

Add one CI step that re-measures the census at the commit under test and fails when any committed
entry **exceeds** the measured count. This catches the two ways a baseline rots that review does not
reliably catch: a pin left behind after a scrub (Decision 2), and a pin quietly raised to cover a
finding. Under-pinning needs no check — the scan itself already fails on it.

The check is on the committed file against the real tree, so it needs no history and no secret, and
it stays green for a fork.

## Decision 7 — Name the caller dependency instead of assuming it

Committing the baseline changes nothing on the preflight side until callers pass
`baseline: "ci/disclosure-baseline.json"` in their scan request. That configuration lives outside
this repository and is not this change's to make. It is a task with a named owner, and the change is
not complete — nor is TIM-473's acceptance criterion 1 satisfied in production — until it lands.

## Risks / Trade-offs

- **The baseline legitimises 100 occurrences.** That is the point and the cost: it converts an
  unenforceable rule into an enforceable one plus a visible, shrinking debt. Every entry is a debt;
  a baseline that grows is a review finding; one that shrinks is the scrubbing landing.
- **Two scanners still exist.** This change makes them agree on scope, layers and baseline, not on
  implementation. They keep different pattern sources on purpose — derivation needs the history CI
  has, and the explicit list needs the out-of-repo configuration only the preflight has. Divergence
  is now a measurable property, and `tasks.md` measures it.
- **`main` is not clean, and this change does not clean it.** After TIM-471, 5 paths / 7 occurrences
  remain, of which 2 are unscrubbable path matches and 1 is TIM-472's key.
