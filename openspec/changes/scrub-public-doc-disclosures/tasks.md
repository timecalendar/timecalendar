# Tasks — scrub pre-existing disclosure-rule violations (TIM-471)

Every task is a **rewrite**. If a task's edit leaves the document saying less than it did
before, the task is not done — go back and say the same thing without the identifier.

Read `design.md` first. D1–D11 decide the *form* each rewrite takes; the tasks below say only
where and what must survive.

Scope is **30 files carrying 53 occurrences**. Counts below are occurrences, not lines: several
of these lines carry two or three, and treating a line as one hit half-scrubs it.

## 1. Fix the convention before the instances

- [x] 1.1 `docs/react-native-migration/inbox/README.md` — the heading names the human owner.
      Rewrite it to the role, per D1. The heading must still say what the folder is: handoffs
      from the autonomous pipeline to the human who can act on them.
- [x] 1.2 In the same file, check the **Convention** and **Why it exists** sections for any
      other phrasing that would regenerate the problem, and align the template with 1.1 so a
      note written by copying this README is compliant by default.

## 2. The eleven dated inbox notes

Each carries the identifier once, on the `**For:**` line. Adopt the phrasing four sibling notes
in the folder already use (D1) and **keep the parenthetical verbatim** — it is the reason the
item needs a human, and it is different in every note.

- [x] 2.1 `2026-06-15-android-storage-verification.md`
- [x] 2.2 `2026-06-16-calendar-low-end-android-perf.md`
- [x] 2.3 `2026-06-16-calendar-restart-durability.md`
- [x] 2.4 `2026-06-16-calendar-visual-brand-review.md`
- [x] 2.5 `2026-06-16-event-checklists-on-device.md`
- [x] 2.6 `2026-06-16-hidden-events-on-device.md`
- [x] 2.7 `2026-06-17-fcm-push-receive-device-verification.md`
- [x] 2.8 `2026-06-17-notification-subscription-review.md`
- [x] 2.9 `2026-08-25-ade-export-window-device-pass.md`
- [x] 2.10 `2026-08-25-ota-runtime-device-verification.md`
- [x] 2.11 `2026-08-30-activity-trigger-device-verification.md`
- [x] 2.12 `grep` the `**For:**` line across the whole inbox folder afterwards and confirm every
      note now reads the same way — including the four that were already compliant.

## 3. The remaining inbox note: a host path in a shell recipe

- [x] 3.1 `docs/react-native-migration/inbox/2026-08-26-ota-control-plane-live-bootstrap.md` —
      four occurrences in one fenced recipe that writes a credential file. Re-root the recipe
      so it still runs and still shows the same permissions, ownership and no-stdout handling;
      the operator must be able to follow it unchanged. The surrounding prose about not printing
      the value stays as it is.

## 4. Developer environment handbook

- [x] 4.1 `docs/agent-dev-environment.md` §5 — one prose occurrence and two in the example tree.
      Re-root both against a placeholder per D4.
      **Must still be true afterwards:** worktrees are siblings of the main checkout, one per
      issue, alongside the long-lived per-agent worktrees, and the example layout still shows
      that relationship and the branch each row is on.
- [x] 4.2 Leave the two development-SDK rows elsewhere in the file alone — they are allowlisted
      on purpose. Verify by scanning the whole file, not the section.

## 5. Release operations

- [x] 5.1 `docs/mobile/releases/03-first-preview.md` — the signing row (line 119) and the
      certificate subject row (line 176), **six occurrences across those two lines**, not two.
      Replace the identity with the role, per D8. **Keep every fingerprint, the
      keystore identifier, the alias and the validity window**: they are the discriminator an
      operator matches on, and this is the acceptance criterion that catches a delete-instead-of-
      rewrite.
- [x] 5.2 `docs/mobile/releases/02-signing-and-credentials.md` — the prose naming the legacy
      Match certificates repository. Rewrite so the sentence still records what it records:
      legacy Flutter iOS used Fastlane Match against a private certificates repository, the
      current identity still has access to it, and it is legacy custody rather than the planned
      React Native signing source.
- [x] 5.3 In the same file, document the environment variable introduced in task 6.1 — where an
      operator will look for it, in the section that already covers legacy iOS custody. Say what
      happens when it is unset (D3).

## 6. Legacy iOS signing configuration — **sensitive surface**

- [x] 6.1 `app/ios/fastlane/Matchfile` — route `git_url` through the environment per D3, mirroring
      the `app_identifier` line in the same file. One line changes; `storage_mode`, `type` and
      `app_identifier` are untouched. **Do not blank the url and do not delete the line** — Match
      reads it at fetch time.
      *Verification:* `ruby -c app/ios/fastlane/Matchfile` parses, the file still contains exactly
      four directives, and 5.3 has landed in the same commit.
- [x] 6.2 Nothing else under `app/` is in bounds. Confirm the diff touches exactly one file there.

## 7. Roadmap, tech specs and operations exploration

- [x] 7.1 `docs/react-native-migration/01-roadmap/owned-calendar-renderer-prompt.md` line 9 — a
      host path inside a reproduced historical prompt, carrying two categories on one line. The
      file's own banner says the prompt is historical and must not be executed, so the path is
      not operational; re-root it. The banner and the "reproduced below for audit" framing stay.
- [x] 7.2 `docs/react-native-migration/05-tech-specs/activity-revival.md` and
      `activity-revival-monkified.md` — one control-plane issue link each. Collapse to the bare
      key per D2.
- [x] 7.3 `docs/react-native-migration/05-tech-specs/calendar-naming-and-manual-import.md` and
      `calendar-naming-and-manual-import-monkified.md` — same, one each.
- [x] 7.4 `docs/mobile/ota/09-human-checklist.md` — the internal machine alias in three places
      (two in prose, three occurrences in one table row) and one account login in the machine-audit
      row. Replace each with the role it plays, per D9. **Must still be true afterwards:** the
      reader can tell which step needs which kind of access — the host with the sealing toolchain
      and scoped kubeconfig, and which tools were verified working.

## 8. Archived change folders

Edited in place; no re-archive and no `openspec validate` run (D5).

- [x] 8.1 `archive/2026-08-29-add-v1-calendar-log-search/proposal.md` — five control-plane issue
      links (D2). The blocking relationships those links describe must read identically afterwards.
- [x] 8.2 `archive/2026-08-29-add-v1-calendar-log-search/tasks.md` — two more of the same.
- [x] 8.3 `archive/2026-08-29-measure-activity-capacity-budgets/tasks.md` line 33 — an agent
      mention carrying a raw actor identifier. Name the role in plain text and keep the bare
      issue key. The task's claim — that no pipeline stage opens a production connection — is
      unchanged.
- [x] 8.4 `archive/2026-08-30-add-chart-server-pod-annotations/tasks.md` — two host paths naming
      a sibling repository checkout, one in prose and one in a shell snippet. Re-root both; the
      snippet must still run for someone who has that repository checked out, so express the
      location as a variable with a sensible relative default rather than deleting it.
- [x] 8.5 `archive/2026-08-30-upgrade-husky-9/design.md` and `proposal.md` — one host path each,
      naming the shared main checkout's git config. Re-root per D4. **Must still be true
      afterwards:** the hazard is that the setting is a single value in the *main checkout's*
      config, shared by every worktree on the host, and last-install-wins.

## 9. The web mockup greeting

- [x] 9.1 `web/app/mockups/calendar-confetti/page.tsx` line 125 — a greeting heading in mockup
      content uses a real first name as sample data. Replace it with a generic sample first name,
      per D11. Nothing else on the page changes: the fake date, the day summary and every style
      reference stay exactly as they are.
      *Why this one and not the About screen:* the surrounding page is a layout mockup populated
      with a fictional student, so the name asserts nothing about anyone. Read D11 before editing
      if this looks like it belongs on the exclusion list — it was on it, and inspection moved it.

## 10. Acceptance — the full-tree measurement

This is the only evidence that the change is done. Run it **after** every edit above, not before.

- [x] 10.1 Build the tree scanner in the run's scratch directory. **Never write the pattern list,
      a pattern, or a finding's matched text into this repository** — a denylist is the list of
      strings that must not be published. Read the 16 patterns from the running agent's own
      instructions and compile them case-insensitively, the way the scanner does. Honour each
      pattern's `publishedIn` paths: a scan that ignores them reports the carved-out credit files
      and reads as thirteen unfixed violations.
- [x] 10.2 Walk every tracked file (`git ls-files`), matching each pattern against the file's whole
      content **and** against its path. Report per-file occurrence counts.
- [x] 10.3 The result is **exactly 5 paths carrying 7 occurrences**: the two archived About-screen
      planning files at 2 each (D10), the two legacy Android package directories at 1 each (D6),
      and the committed development TLS key at 1 (TIM-472). Zero occurrences in every other
      tracked file. Check the **counts**, not just the path set — a path expected to carry 2 that
      carries 1 has been half-scrubbed and a path-set diff calls that a pass. Any other path is a
      regression introduced by a rewrite: fix it and re-run.
- [x] 10.4 Confirm no protected string appears in the diff, in any commit message, or in the pull
      request body. The removals are removals — nothing quotes what it removed. Pattern ids and
      file paths are safe to write; matched text is not.
- [x] 10.5 Run the pre-publication scan before opening or editing the pull request, as usual. Note
      that it will pass trivially on a diff of removals — that is not evidence for 10.3.

## 11. Report what this change cannot clear

Paths, occurrence counts and pattern ids only — never a matched string.

- [x] 11.1 Tell TIM-473 the residue this change leaves for the committed baseline: **5 paths / 7
      occurrences**, itemised as in 10.3. That is the complete standing footprint once this lands,
      alongside the thirteen credit/legal files that `publishedIn` already silences.
- [x] 11.2 Tell TIM-470 that the `mobile-about-screen` carve-out under-covers its own intent by one
      path shape: it requires the capability name after a separator, so it covers the `specs/` file
      and misses the sibling planning files in the same archived folder (D10). Widening it is that
      ticket's call, not this one's.
- [x] 11.3 Tell TIM-468 the gate consequence: a branch touching any of the 5 residual paths reports
      occurrences no scrub can clear, and for the two path-only matches no `publishedIn` entry can
      clear them either — `publishedIn` is keyed on the path and there the path *is* the match.
- [x] 11.4 Confirm to the Founding Engineer that the carve-out on all-`added: false` reports can be
      deleted once this merges, and name the 5 residual paths that will still fire afterwards so the
      deletion is made with them in view.

## 12. Close out

- [ ] 12.1 `openspec archive scrub-public-doc-disclosures --skip-specs` after merge. Name the
      folder without a date prefix — the command prepends it. `--skip-specs` is the documented
      route for a doc-only change and is required here because the change proposes no delta
      (D7); do **not** add `openspec validate --strict` as a gate, which fails a delta-free
      change by design.
