---
name: iterate-screen
description: Iterate a mobile/ screen to native-quality through the proposal → build → exigent-review-panel → device-pass loop. Use when the user wants to redesign, polish, or "make native" a React Native screen (e.g. "let's iterate on this screen", "bring this screen up to platform standards"). Drives three persistent expert reviewers (native patterns, RN code, a11y) and treats the user's device as the only source of rendering truth.
---

# Iterate a screen to native quality

A multi-round loop for one screen: propose → user approves → build → three EXIGENT
expert reviewers → consolidated fix pass → disposition re-review → user device pass →
investigate discrepancies with the experts → converge. The loop ends when the reviewers
pass the diff, the gates are green, and the user's device pass is clean.

## The oracle principle (govern every decision with this)

- **The user's device is the only rendering truth.** Types, docs, HIG text, and even
  expert endorsement are necessary but not sufficient — native chrome behavior
  (headers, search bars, keyboards, ripples) is only proven on screen.
- **The reviewers are citation truth.** Specs (HIG / Material 3 / WCAG) and the
  *installed* library sources in `node_modules` — never memory, never vibes.
- **You are the integrator.** Never guess when an oracle can answer: unknown platform
  behavior → ask the experts BEFORE shipping; unknown pixels → ask the user with a
  precise checklist. The goal is to nail each build on the first device try; when the
  device disagrees with theory anyway, that discrepancy is *learning material* — it gets
  a root-cause investigation, not another guess.

## Phase 0 — Context (before proposing anything)

1. Read the screen + its test, the feature's `data/` layer (what fields exist — e.g.
   images, codes), and the route/layout wiring in `src/app/`.
2. Read the relevant Architecture Book topical files (`docs/mobile/architecture-book/`):
   at minimum `navigation.md`, `theming.md`, `accessibility.md`, `testing.md`, plus the
   feature's entry in `features.md`. The book is binding.
3. Verify library capabilities against **installed** types/sources in `node_modules`
   (e.g. react-native-screens `SearchBarProps`, expo-router's vendored native-stack
   types) — not against training memory. `mobile/AGENTS.md` pins the Expo docs version.
4. Ask the user for reference AND **anti-reference** screenshots ("what should this not
   look like"). Anti-references carry as much information as mockups — they reveal
   artwork shapes, rejected styles, and the old app's failure modes.

## Phase 1 — Proposal (loop until approved)

- Present the redesign as a short direction statement + `AskUserQuestion` for each
  genuine choice point (search pattern, list style, personality touches…), with ASCII
  previews per option and a recommended default. Fold uncontroversial fixes (states,
  a11y, keyboard handling) into the direction statement — don't ask about those.
- Platform-split options honestly (iOS pattern vs Android pattern per option).
- Do not build until the user approves. Rejections with changes re-enter this phase.

## Phase 2 — Build

- Follow the book: tokens only (no call-site color math — precompute alpha variants as
  tokens and document them in the `tokens.ts` contrast block), thin routes, feature
  `ui/` placement, i18n FR/EN parity, live regions + roles per the a11y rules.
- Native chrome: **system defaults first.** Deviate from a default (placement modes,
  header options, inset behaviors) only with cited platform precedent, one deviation at
  a time, each flagged `device-verify` in your report.
- Gates after every change set: `npx tsc --noEmit`, `npm run lint`, and the FULL suite
  as `npm test -- --coverage` (plain `npm test` passes blind past the coverage gate).

## Phase 3 — The review panel (three exigent reviewers, in parallel)

Spawn three named agents (Agent tool, `general-purpose`, `model: opus`) that persist
for the whole session:

1. **native-reviewer** — senior UIKit engineer + Material reviewer in one; reviews as if
   the screen ships inside a first-party Apple/Google app; hates off-platform choices.
2. **rn-reviewer** — principal RN engineer; correctness, React/RN footguns, perf, list
   semantics, test quality (behavior vs theater), Architecture Book violations.
3. **a11y-reviewer** — accessibility specialist; VoiceOver/TalkBack semantics and
   announcement quality, focus order, WCAG contrast/target sizes, Dynamic Type/font
   scaling, RN-specific a11y traps (live regions are Android-only, label merging on
   iOS Pressables), and the book's heading-role/live-region contracts.

Prompt invariants for all three (these made the reviews good — keep every one):
- Exigent persona; do not soften; do not pad — "if it's right, say so".
- **Every claim verified against installed sources** (`node_modules` types/source,
  vendored implementations) with file:line evidence; specs cited by name/section.
- Scope: the uncommitted diff (`git diff -- mobile/`) + named surrounding files.
- List the user-approved design decisions and forbid relitigating them — but demand
  they flag flawed *execution* of an approved decision.
- Output: numbered findings, most severe first, `[BLOCKER|MAJOR|MINOR|NIT]`, the rule
  violated, the concrete fix with exact values — then a **"What passes"** section (it
  prevents churning correct code).
- Read-only: never edit files. Deliver the full review via `SendMessage` to `main`.
- Reviewers sometimes go idle without delivering — ping them to send the full text.

## Phase 4 — Consolidated fix pass

- Wait for ALL reviews before editing (they overlap; one coherent pass beats three).
- Triage every finding: fix, or **decline with an argued reason** (cost/benefit,
  user-owned decision like a new dependency, agreed next-iteration scope). Never
  silently drop a finding.
- Fold in any user feedback that arrived mid-round. Re-run the gates.

## Phase 5 — Disposition re-review

Send each reviewer the accepted/declined disposition list (what changed, exact values,
what was declined and why) and require: verdict per disposition, any NEW findings the
fix pass introduced, full text via SendMessage. Loop 4↔5 until the panel passes.
Declines they accept are settled; declines they rebut get one argued round, then the
user arbitrates.

## Phase 6 — Device pass (the scarce resource — spend it deliberately)

- Every build handed to the user comes with an explicit numbered checklist of what to
  verify (both platforms, both schemes when relevant).
- **Build-state signaling is mandatory**: say "safe to test now" only when the tree is
  green and coherent; say "hold — mid-edit" while restructuring. If the working tree
  passed through a broken intermediate while a dev server was attached, tell the user
  to **kill and fully reload the app** (not hot-reload) before trusting any symptom —
  hot-reloaded intermediates manufacture phantom bugs (a spread of `undefined` can
  silently zero-size a view four failures deep with no warning). Push back and ask for
  a re-reload whenever a reported symptom could be stale-bundle residue.
- One native-chrome variable per build. Never stack two experiments in one device trip.
- Use the user's platform intuition as data: ask "what does <first-party app> do on
  your device/OS version?" before pinning platform behavior the docs are vague about.

## Phase 7 — Discrepancy investigation (when device ≠ theory)

Do NOT ship another guess. Send the relevant expert a **diagnosis task** (not a review):
- The full symptom/build timeline (build A did X, build B showed Y on which platform,
  what changed between them) — the history is what lets them prove mechanisms.
- Explicit questions, each requiring verified evidence from installed sources, and
  "recommend ONE concrete change".
Apply the verified fix, note what theory missed, and carry the learning forward (into
the code comment, the book, or memory) so the next screen doesn't re-derive it.

## Phase 8 — Converge and encode

- Record outcomes in the repo as you go: new tokens + their contrast-block rationale,
  `architecture-changelog.md` entries for any rule/doc correction, book fixes.
- Keep a visible ledger of deliberately deferred items (next screen in the flow,
  dependency decisions the user owns, device-verify leftovers) — they are the seed of
  the next iteration, not lost scope.
- Done = panel pass + green gates + clean user device pass on the checklist.
