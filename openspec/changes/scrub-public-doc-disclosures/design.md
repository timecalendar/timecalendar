# Design — scrub pre-existing disclosure-rule violations (TIM-471)

## Context

The rule this change enforces is a contribution rule, not a code rule: no lint, type or CI check
enforces it today. What makes it hard is not that the offending sentences are wrong — it is that
they are **right**. Every one of them was written by someone recording an accurate observation,
and every reviewer since has read them as correct, because they are correct. The identifier and
the useful content are the same bytes.

That shapes the whole approach. The unit of work is not "find bad text" — the measurement
already did that, mechanically, by matching the deployed pattern list against every tracked file.
The unit of work is **"say the same true thing without the identifier"**, one document at a time,
and then re-measure. A rewrite is as capable of introducing a match as of removing one, so the
measurement is the acceptance evidence and it runs *after* the edits, never before.

### The measurement

The scan compiles each pattern case-**in**sensitively (`gi`) unless an entry opts out, and none
does. It matches a file's whole **content** and also its **path**, and a pattern may carry a
`publishedIn` list of paths where that string is the project's own published identity rather
than a leak — a copyright line, an author credit, a legal notice. `publishedIn` suppresses the
finding entirely, so a carved-out file reports nothing at all rather than reporting and being
excused.

Run that way over all 2 583 tracked files at this branch's head, the tree reports **35 paths
carrying 60 occurrences**, split four ways:

| Set | Paths | Occurrences | Disposition |
| --- | --- | --- | --- |
| A — genuine violations | 30 | 53 | scrubbed by this change |
| B — spec text quoting the shipped author credit | 2 | 4 | untouched (D10) |
| C — legacy Android package directories | 2 | 2 | untouched, path-only (D6) |
| D — committed development TLS key | 1 | 1 | untouched, TIM-472's |

**The expected post-change hit set is therefore 5 paths carrying 7 occurrences** — sets B, C
and D — and zero in the other 2 578 files.

An earlier pass of this design put the baseline at 48 paths / 103 occurrences and the expected
set at 19 paths. That pass predates `publishedIn` reaching the deployed list. Thirteen of the
seventeen files that pass called out — `LICENSE`, the privacy policy, the About screen and its
test, both locale files, the Maestro flow, the web footer and layout, the legacy Flutter About
screen, and the four archived/live `mobile-about-screen` and `mobile-changelog` **spec** files —
are now carved out by path and report nothing. They are not in the expected set because they
produce no finding to expect. The four that still fire are sets B and D.

## Decisions

### Decision D1 — the inbox `**For:**` line adopts the phrasing already in the folder

**Decision.** The eleven dated notes and the `README.md` heading name a role, not a person, and
they take the exact phrasing four sibling notes in the same folder already use. The parenthetical
that explains *why* the item needs a human is preserved verbatim on every note.

**Why.** The compliant form is not a placeholder we have to invent — it is already the majority
convention in that folder, written by the same pipeline. Adopting it makes the folder internally
consistent instead of introducing a thirteenth spelling, and it gives the next `(HUMAN: …)` note
an obvious model to copy. Fixing `README.md` matters more than fixing any individual note: the
README is the template the pipeline follows, so leaving it would regenerate the problem on the
next handoff.

**Rejected.** A bracketed token such as `<owner>`: correct but foreign to the folder, and it
reads as a fill-in-the-blank an operator is expected to complete. Deleting the `**For:**` line:
loses the routing information the inbox exists to carry.

### Decision D2 — control-plane issue links collapse to bare `TIM-…` keys

**Decision.** Wherever a document links an issue through the control-plane host, the link becomes
the bare key in code formatting. Nine occurrences across four tech specs and two archived change
folders.

**Why.** The bare `TIM-…` key is this repository's traceability anchor already — it is what commit
messages, ADRs and the Architecture Book use, and it is the one identifier the disclosure rule
explicitly permits. The host that resolves the key is internal infrastructure and carries no
information a reader of the public repository can act on: they cannot open the link. Nothing is
lost by dropping it, and the surviving key is exactly what a person with access searches for.

### Decision D3 — `Matchfile` routes `git_url` through `ENV["MATCH_GIT_URL"]`

**Decision.** `git_url(ENV["MATCH_GIT_URL"])`, mirroring the `app_identifier([ENV["APP_BUNDLE_ID"]])`
line four lines below it. `docs/mobile/releases/02-signing-and-credentials.md` documents the
variable in the section that already covers legacy iOS custody.

**Why.** This is the one file in scope that is executed rather than read, so it must keep
resolving a real url. `MATCH_GIT_URL` is Fastlane Match's own documented variable name, so an
operator who knows Match already knows it, and the file adopts a pattern it demonstrably already
uses rather than a new one. The url itself is not secret — it is a repository name — but it names
a person, and it belongs in the operator's environment for the same reason the bundle id does.

**Consequence to flag for review.** A run with the variable unset resolves `git_url` to `nil`
and Match fails at fetch time with its own error. That is the correct failure: legacy iOS signing
is an operator-run, credential-bearing path, and a silent fallback to a hard-coded url would be
worse. The documentation change is what makes this discoverable, which is why it is not optional
and why the two files must land together.

### Decision D4 — `docs/agent-dev-environment.md` §5 is rooted at a placeholder

**Decision.** The prose and the example tree express the layout relative to a placeholder repository
root, keeping the sibling-directory relationship, the per-agent worktree names and the per-issue
example row intact. The two allowlisted `/home/dev/flutter` rows elsewhere in the file are left
alone.

**Why.** The operational content of §5 is the *shape* — one worktree per issue, siblings of the
main checkout, long-lived per-agent worktrees beside them. The absolute prefix contributes
nothing an agent needs; an agent reading this handbook already knows where its own checkout is,
and hard-coding one machine's prefix is actively misleading on any other. This is the criterion
the ticket calls out by name: §5 must still tell an agent where the worktrees live.

### Decision D5 — archived change folders are edited in place

**Decision.** The six files under `openspec/changes/archive/**` are rewritten like any other
document. No re-archive, no `openspec validate` run, no note recording that they were edited.

**Why.** The archive is a historical record of decisions, not an immutable artefact, and it is
published on every clone exactly like `README.md`. The rule applies to the file as it stands, and
an archived folder has no live spec to desynchronise. Adding an "edited on…" note would only
restate what `git log` already answers precisely.

### Decision D6 — the two legacy Android package directories are excluded

**Decision.** `app/android/app/src/main/java/fr/…/MainActivity.java` and
`app/android/app/src/main/kotlin/fr/…/MainActivity.kt` are **not** touched. They are set C of the
expected post-change hit set.

**Why.** Both are path-only matches: the *content* of both files is clean, and what matches is a
directory segment of the legacy Flutter Android package. That package is the published
application id — it is `namespace` and `applicationId` in `app/android/app/build.gradle`, it is
the identifier the app ships under on the store, and it is already on the deliberate-and-public
list. Renaming those directories would rename the legacy application, which is neither wanted nor
inside R-5 bounded maintenance.

The pattern fires here only because a path separator is not one of the characters its boundary
excludes, so the same identifier that is correctly ignored in dotted form is matched in path
form. That is a fact about the pattern, not about these files, and the fix is **not** to loosen
the pattern: the identical dotted-to-slash form appears in a repository url that this change is
scrubbing on purpose, so relaxing the boundary would blind the scan to a real violation.

**Consequence.** TIM-468 and TIM-473 need to know that a branch touching either file reports a
path finding that no scrub can clear, and that no `publishedIn` entry can clear it either:
`publishedIn` is keyed on the path, and here the path *is* the match. It has to be a baseline
entry or nothing. That is a reporting obligation on this change, not a blocker for it.

### Decision D7 — no spec delta, and no ADR

**Decision.** The change ships `proposal.md`, `design.md` and `tasks.md` with no
`specs/<capability>/spec.md`, and adds nothing to the Architecture Book or its changelog.

**Why.** Nothing here changes a capability's behaviour, a rule, or a shape a spec could describe —
the deliverable is prose in documents plus one configuration line. The repository has precedent:
the archived `2026-07-05-refactor-mobile-shared-fake-db` change shipped and archived with no
`specs/` directory. Writing a spec delta to satisfy the folder template would put a
requirement in the specification that no behaviour backs.

**Consequence for the tooling.** `openspec validate --strict` fails a delta-free change by
design ("Change must have at least one delta"), so it is **not** a gate on this change and must
not be added to `tasks.md` as one. The archive step takes `--skip-specs`, which the CLI documents
for exactly this case — "useful for infrastructure, tooling, or doc-only changes". That flag is
the sanctioned route here, not a way around a failing check: there are no specs to update because
the change proposes none.

### Decision D8 — certificate evidence keeps its fingerprints

**Decision.** In `docs/mobile/releases/03-first-preview.md`, the signing row and the certificate
subject row keep every SHA-1 and SHA-256 fingerprint, the keystore identifier, the validity
window and the alias. Only the common-name/organisation identity is replaced by the role.

**Why.** An operator reading those tables is confirming *which certificate* they are holding, and
the only thing they can compare byte-for-byte is a fingerprint. The name is decoration in that
task; the fingerprint is the discriminator. This is the concrete case criterion 4's sibling
criterion exists to prevent — a scrub that silences the pattern by deleting the row would destroy
the document's entire purpose.

### Decision D9 — internal machine and account names become the role they play

**Decision.** In `docs/mobile/ota/09-human-checklist.md`, the internal machine alias becomes a
description of the machine's capability, and the account login becomes the role that account has.

**Why.** The checklist's reader is a human operator being told *what kind of access* a step needs
— a host that has the sealing toolchain and the scoped kubeconfig, an account authenticated to a
given service. The alias is a name only someone with existing access can resolve, so it conveys
nothing to anyone else while disclosing an internal host. Note that this document is exploration,
not a rule file, so the rewrite is not constrained by anything in the Architecture Book.

### Decision D10 — the two archived About-screen planning files are excluded, and go to the baseline

**Decision.** `openspec/changes/archive/2026-08-25-add-mobile-about-screen/design.md` (2
occurrences, line 118) and `.../tasks.md` (2 occurrences, line 29) are **not** scrubbed. They are
set B of the expected hit set, and they are reported to TIM-473 for a count-keyed baseline entry.

**Why.** Both lines are describing the *content of the shipped credit row* — the design file
records which developer names and destinations the About screen renders; the task file records
wiring those exact names to their exact URLs. The identifier is not incidental to the sentence,
it is the specification of published product content. Scrubbing it would make the archived plan
disagree with the UI it planned, which is the desynchronisation the credit exclusion exists to
prevent. The signed-off ruling is explicit that the deliberate credit is a product decision and
that nothing may be scrubbed to turn a gate green.

**Why not `publishedIn`.** The deployed carve-out for this category is
`^openspec/(?:specs|changes/archive/[^/]*)/.*mobile-(?:about-screen|changelog)`. It requires the
capability name to appear *after* a path separator, so it covers
`…/2026-08-25-add-mobile-about-screen/specs/mobile-about-screen/spec.md` and misses the sibling
`design.md` and `tasks.md`, whose folder segment carries the same capability name. The carve-out
under-covers its own stated intent by one path shape. Widening it is the pattern list's call
(TIM-470) and not this change's, and the standing instruction is that a scrub ticket does not add
`publishedIn` entries. So these two are recorded, not suppressed and not scrubbed.

**Consequence to flag.** This is the one place where the corrected target list and the exclusion
ruling disagree, and the disagreement is real rather than a stale measurement: the list is the
scanner's output, the ruling is the product decision, and both are right. Until TIM-470 widens the
carve-out or TIM-473 records these two, a branch touching either file reports two occurrences it
must not fix.

### Decision D11 — the mockup greeting is scrubbed; it is sample data, not a credit

**Decision.** `web/app/mockups/calendar-confetti/page.tsx` (1 occurrence, line 125) **is** scrubbed.
The greeting takes a generic sample first name. Nothing else on the page changes.

**Why.** It was carried on the exclusion list under "rendered credit", and on inspection it is not
one. The line is a mockup's greeting heading — a fake user being greeted by name in placeholder
content, alongside a fake date and a fake day summary. A person's real first name used as dummy
data is the ordinary case the disclosure rule is about, and replacing it costs the mockup nothing,
because the mockup is demonstrating a layout and not an identity. This is the exclusion list's own
test applied in the direction it is usually applied in reverse: a file is excluded because
inspection shows it is deliberate published content, and inspection here shows it is not.

**Distinguishing it from the real credit.** The About screen, the footer, `LICENSE` and the privacy
policy name the author *as* the author — remove the name and the document becomes false or the
product loses a credit it deliberately ships. Remove this one and a mockup greets a different
fictional student. Nothing is asserted about anyone.

## Verification strategy

Acceptance is a single mechanical measurement, and it is the only evidence that counts.

1. Build the tree scanner in the run's scratch directory — **never in the repository**. A denylist
   is the list of strings that must not be published, so a committed copy publishes them, in the
   repository it was meant to protect.
2. Read the 16 patterns out of the running agent's own instructions, compile them the way the
   scanner does (`gi`), honour each pattern's `publishedIn` paths, and walk every tracked file:
   the file's whole content **and** its path.
3. Diff the resulting hit set against the expected **5 paths / 7 occurrences** — sets B, C and D.
   Zero occurrences anywhere else. Compare occurrence counts, not path counts: a path that should
   carry 2 and carries 1 has been half-scrubbed, which a path-set diff reports as a pass.

Two traps this design accounts for explicitly:

- **The pre-publication scan reading added diff lines will pass trivially here.** This change's
  diff is almost entirely *removals* of matching text, so a clean scan report proves nothing about
  whether the work is done. The full-tree measurement is the acceptance evidence; the pre-publication
  scan only guards the text being published alongside it.
- **A rewrite can introduce a match somewhere new.** Re-measuring before editing, or re-checking
  only the 30 edited files, would miss it. The scan walks the whole tree, after the edits.

Beyond that: nothing to run. No code path changes, so no test, type-check or lint outcome can
move, and the only CI gate a documentation change faces is the build-and-deploy workflow.

## Risks

- **The `Matchfile` edit is the one with a runtime consequence.** It is legacy iOS signing
  configuration, exercised only on an operator-run Match invocation — which means a mistake in it
  is invisible to CI and surfaces months later, in the middle of a signing task. Reviewer: read
  that one line against D3 specifically, and confirm the documentation landed in the same change.
- **Losing meaning while removing an identifier.** Mitigated by making every task state what the
  document must still say afterwards, and by criteria 3 and 4, which exist precisely to catch a
  scrub that deleted rather than rewrote.
- **Recurrence.** Twelve of the thirty files are instances of one convention. D1 fixes the
  convention at its source, which is what makes the next handoff note compliant by default. This
  is a working-tree fix, not a gate; the gate is TIM-468's job.
