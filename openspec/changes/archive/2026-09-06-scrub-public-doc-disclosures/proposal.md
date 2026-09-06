# Scrub pre-existing disclosure-rule violations from the public documentation tree (TIM-471)

## Why

`timecalendar/timecalendar` is a public repository. Anything committed to it is visible to the
whole internet, and our own contribution rule already forbids publishing a person's identity,
an internal host, a host filesystem path outside this repository, or a control-plane
identifier. Twenty-nine tracked files break that rule today. None of it was added by a single
branch — it accreted, one accurate sentence at a time, in handover notes, release-ops runbooks,
exploration specs and archived change folders.

This is worth doing on its own terms: the text is public now, and no gate has to ship for that
to be true. It is also what unblocks TIM-468, the pre-publication scan, which reads the **full
text of every file a branch touches** rather than the diff. A file that already carries a match
fails a branch that never touched the offending line, so shipping that gate against today's
tree hard-stops a large share of routine pull requests on day one.

Other files carry the same categories deliberately — the author credit rendered in the app and
on the website, and the legal identity in `LICENSE` and the privacy policy. Those are a product
and legal decision, not a scrub, and they are out of scope here (TIM-469). At this branch's head,
the raw content census used by baseline generation deliberately ignores `publishedIn` and records
16 files / 48 occurrences. The current `publishedIn`-aware whole-tree scan also checks paths and
reports only 1 file / 1 occurrence: the mockup greeting. The archived planning files that specify
the shipped credit are covered by the current path expression, while the raw census still records
them for a count-keyed baseline (D10).

## What Changes

Every edit is a **rewrite, never a deletion**. Each document must still say exactly what it
said, with the identifier replaced by the thing the reader actually needs: a role, a
placeholder, a repository-relative path, or an environment variable. A sentence deleted to make
a pattern stop matching is a regression, not a fix.

- **Human-handoff inbox (13 files).** `docs/react-native-migration/inbox/README.md` names the
  human owner in its title; eleven dated notes name them again on the `**For:**` line, and one
  reproduces a host home directory in a shell recipe. The README is the *convention* that
  generates the other twelve, so it is fixed there first — otherwise the next `(HUMAN: …)` note
  reintroduces it. Four notes in the same folder already use a compliant role phrasing; the
  eleven adopt it rather than inventing a new placeholder.
- **Release operations (2 files).** `docs/mobile/releases/03-first-preview.md` carries the
  signing-certificate common name in two evidence tables; the certificate **fingerprints stay**,
  because those are what an operator actually matches on.
  `docs/mobile/releases/02-signing-and-credentials.md` names the legacy Match certificates
  repository in prose and gains the documentation for the new environment variable below.
- **Legacy iOS signing config (1 file).** `app/ios/fastlane/Matchfile` is the only non-prose
  target: its `git_url` is live configuration Fastlane Match reads at run time. It is not
  blanked — it is routed through `ENV[…]`, the way the same file already resolves
  `app_identifier`.
- **Developer environment handbook (1 file).** `docs/agent-dev-environment.md` §5 describes the
  worktree layout using an absolute host path. The layout is the useful part; it is re-expressed
  against a placeholder root so an agent on any machine still reads its own layout out of it.
- **Exploration and roadmap documents (5 files).** Four tech specs and one archived-prompt
  roadmap file link issues through an internal control-plane host, or quote a host path inside a
  reproduced prompt. Bare `TIM-…` keys are the repository's established traceability anchor and
  stay; the host that resolves them does not.
- **Web mockup — argued, and deliberately not scrubbed.** `web/app/mockups/calendar-confetti/page.tsx`
  greets a fictional student by a real first name in placeholder content, which reads as sample
  data rather than as a credit. The exclusion set naming it is signed off, and a marginal case may
  only move *into* that set, never out of it, so this change leaves the file untouched and refers
  the reclassification to the set's owner (D11).
- **Operations exploration (1 file).** `docs/mobile/ota/09-human-checklist.md` names an internal
  machine by its alias in three places and an account by login in a fourth. Each becomes the
  role that machine or account plays, which is the information the checklist is actually
  conveying.
- **Archived change folders (6 files).** Two host paths in an infrastructure change, two in a
  tooling change, five control-plane issue links, and one agent mention carrying a raw actor
  identifier. Archived changes are historical records, but they are public text and the rule
  applies to the file as it stands, so they are edited in place. The archive carries no
  re-validation requirement.

Git history is **not** rewritten. This removes the text from the working tree — which is what a
full-file gate reads, and what a reader of the repository sees.

## Impact

- **Affected:** `docs/` (agent handbook, mobile releases, mobile OTA exploration, React Native
  migration inbox / roadmap / tech specs), `openspec/changes/archive/` (six files),
  `app/ios/fastlane/Matchfile`.
- **No product code, no test, no API contract, and no database schema is touched.** There is no
  capability whose behaviour changes, so this change carries **no spec delta** — the same shape
  as the archived `refactor-mobile-shared-fake-db` change.
- **No Architecture Book rule changes**, therefore no ADR and no changelog entry.
- **Sensitive surface — one.** `app/ios/fastlane/Matchfile` is store/native signing
  configuration. It is the only file in scope where a wrong edit has a runtime consequence
  rather than a cosmetic one: Match resolves that url when it fetches certificates for the
  legacy Flutter iOS app. `app/` is under R-5 bounded maintenance; this one line is in bounds
  and nothing else under `app/` is.
- **Out of scope.** The raw baseline census records 16 content files / 48 occurrences: rendered
  credit, the planning text that specifies it, legal identity and the mockup greeting. The
  `publishedIn`-aware whole-tree scan reports only the mockup, with one occurrence. It also
  suppresses the two legacy Flutter Android package paths, whose path segments embed the
  published application id (D6); those permanent path anchors cannot be
  represented in a baseline whose entries are keyed by path. The mockup is deferred to neutral
  sample copy without a carve-out (D11). Also out of scope: the deliberate credit and legal
  identity generally (TIM-469), the gate itself (TIM-468), and the pattern list it runs
  (TIM-470).

## Non-Goals

- Rewriting git history, or removing anything from previously published releases.
- Changing what the deliberate author credit says or where it is rendered.
- Adding, deploying or configuring the pre-publication scan. This change makes the tree pass it;
  it does not install it.
