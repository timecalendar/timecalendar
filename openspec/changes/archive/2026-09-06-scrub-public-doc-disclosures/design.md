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
does. Two measurement modes answer different questions and must not share a result label:

- The **raw baseline census** checks tracked-file content and deliberately ignores `publishedIn`,
  just as `disclosure-baseline` does. At this branch's head it records **17 files / 49
  occurrences**. That is the input from which a count-keyed content baseline is generated.
- The current **`publishedIn`-aware whole-tree scan** checks both content and paths. It suppresses
  the project's published credit and legal-identity content plus the permanent Android package
  path anchors (D6). At this branch's head it reports **2 files / 2 occurrences**: the committed
  development TLS key and the mockup greeting.

The scrub itself accounts for the difference from the corrected pre-change raw census: 29 files /
52 occurrences were removed from 46 files / 101 occurrences, leaving 17 / 49. The path anchors
are deliberately absent from that arithmetic because a baseline census cannot encode a matching
path. The aware scan is a separate present-state result, not a smaller baseline census.

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

**Consequence.** These two paths are the permanent `publishedIn` case. A count-keyed baseline
cannot represent either finding because each baseline entry is keyed by the matching path; trying
to pin it would put the protected value into the baseline itself. The out-of-repository pattern
list can safely carry the path expression and already does. TIM-468 and TIM-473 must therefore
retain these path anchors when content carve-outs move to generated baseline entries.

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

### Decision D10 — the two archived About-screen planning files are excluded, and enter the raw census

**Decision.** `openspec/changes/archive/2026-08-25-add-mobile-about-screen/design.md` (2
occurrences, line 118) and `.../tasks.md` (2 occurrences, line 29) are **not** scrubbed. The raw
baseline census records them, while the current `publishedIn`-aware scan suppresses them.

**Why.** Both lines are describing the *content of the shipped credit row* — the design file
records which developer names and destinations the About screen renders; the task file records
wiring those exact names to their exact URLs. The identifier is not incidental to the sentence,
it is the specification of published product content. Scrubbing it would make the archived plan
disagree with the UI it planned, which is the desynchronisation the credit exclusion exists to
prevent. The signed-off ruling is explicit that the deliberate credit is a product decision and
that nothing may be scrubbed to turn a gate green.

**Current scanner contract.** The deployed expression covers both archived planning files. They
therefore do not appear in the current aware result. `disclosure-baseline` ignores `publishedIn`
by design, so its raw census still records all four occurrences; that is what lets a generated
count-keyed baseline replace the content carve-out later without changing layer A's verdict.

### Decision D11 — the mockup greeting is left untouched, and the argument is referred upward

**Decision.** `web/app/mockups/calendar-confetti/page.tsx` (1 occurrence, line 125) is **not**
scrubbed by this change. The file is left exactly as it stands, and the case for reclassifying it
is recorded here for the owner of the exclusion set to rule on.

**The argument for scrubbing, which is a good one.** The line is a mockup's greeting heading — a
fake user greeted by name in placeholder content, alongside a fake date and a fake day summary. A
person's real first name used as dummy data is the ordinary case the disclosure rule is about, and
replacing it would cost the mockup nothing, because the mockup demonstrates a layout and not an
identity. It reads differently from the About screen, the footer, `LICENSE` and the privacy policy,
which name the author *as* the author: remove the name there and the document becomes false or the
product loses a credit it deliberately ships.

**Why the change does not act on it anyway.** The scrub stage referred the classification instead
of overriding the signed-off exclusion set. The later ruling confirms that the value is sample
data, not credit, and directs a bounded follow-up to replace it with neutral sample copy. This
change still leaves the line untouched, and no permanent `publishedIn` entry is added for it.

**Consequence while the follow-up is pending.** No `publishedIn` path covers this file, so the
aware scan reports its one pre-existing occurrence. The follow-up removes it by changing the
sample copy; a carve-out would preserve the wrong classification.

## Verification strategy

Acceptance is a single mechanical measurement, and it is the only evidence that counts.

1. Build the tree scanner in the run's scratch directory — **never in the repository**. A denylist
   is the list of strings that must not be published, so a committed copy publishes them, in the
   repository it was meant to protect.
2. Read the 16 patterns out of the running agent's own instructions and compile them the way the
   scanner does (`gi`). Run the raw content census with `publishedIn` ignored and compare its
   per-file counts: **17 files / 49 occurrences**.
3. Run the `publishedIn`-aware whole-tree scan over content and paths. Its separate result is
   **2 files / 2 occurrences**, one in the development TLS key and one in the mockup. Zero
   occurrences outside those two files. Compare occurrence counts, not only the path set: a path
   expected to carry 2 that carries 1 has been half-scrubbed, which a path-set diff reports as a
   pass.

Two traps this design accounts for explicitly:

- **The pre-publication scan reading added diff lines will pass trivially here.** This change's
  diff is almost entirely *removals* of matching text, so a clean scan report proves nothing about
  whether the work is done. The full-tree measurement is the acceptance evidence; the pre-publication
  scan only guards the text being published alongside it.
- **A rewrite can introduce a match somewhere new.** Re-measuring before editing, or re-checking
  only the 29 edited files, would miss it. The scan walks the whole tree, after the edits.

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
- **Recurrence.** Twelve of the twenty-nine files are instances of one convention. D1 fixes the
  convention at its source, which is what makes the next handoff note compliant by default. This
  is a working-tree fix, not a gate; the gate is TIM-468's job.
