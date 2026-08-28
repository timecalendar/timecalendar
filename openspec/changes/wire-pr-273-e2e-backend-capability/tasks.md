## 1. Reconfirm the same-PR boundary

- [ ] 1.1 Confirm the checkout, remote head, and GitHub head are PR #273's existing named branch;
      record the exact head and current `origin/main`, and verify the PR is open, non-draft,
      mergeable, and retains `run-e2e`. Do not switch branches, open another PR, rebase,
      force-push, or merge during Apply.
- [ ] 1.2 Review the exact current workflow, ADR 043, ADR 044, `mobile/app.config.ts`, and the
      focused app-config/workflow tests before editing. If `main` has advanced, integrate it only by
      a normal merge under the existing ADR 043/044 identities; return to Founding Engineering if a
      conflict or new sensitive surface exceeds this design.

## 2. Wire the explicit native E2E capability

- [ ] 2.1 In `.github/workflows/ci-mobile-e2e.yml`, add
      `BACKEND_ENVIRONMENT_CAPABILITY: development` beside `APP_VARIANT: development` in Android's
      `Prebuild Android (dev variant)` and `Build release APK` step-local environments. Change no
      command, API URL, native setting, runner, or other workflow field.
- [ ] 2.2 Add the same step-local value beside `APP_VARIANT: development` in iOS's
      `Prebuild iOS (dev variant)` and `Build Release simulator app` environments. Change no command,
      API URL, native setting, runner, or other workflow field.
- [ ] 2.3 Complete the Architecture Book update/disposition: verify ADR 043 still owns the
      independent capability and production-safe fallback, ADR 044 still owns source recovery, and
      no architectural rule changed. Leave `docs/mobile/architecture-book/` unchanged in substance
      and record that no new ADR, topical rewrite, or `(HUMAN: ...)` inbox note is warranted.

## 3. Prove the narrow configuration contract locally

- [ ] 3.1 Run a focused static workflow check that proves exactly four
      `BACKEND_ENVIRONMENT_CAPABILITY: development` entries exist and that each belongs to one of the
      four named prebuild/release build steps already declaring `APP_VARIANT: development`. Also run
      `./mobile/e2e/test_ci_mobile_e2e.sh` to retain the existing native workflow invariants.
- [ ] 3.2 From `mobile/`, run the focused `app.config.test.ts` suite and direct
      `expo config --json --type public` checks proving the scoped development environment resolves
      `extra.backendEnvironmentCapability=development`, while absent and malformed capability inputs
      still resolve `production`. Do not edit `mobile/app.config.ts` or its tests to obtain a pass.
- [ ] 3.3 Run the repository's YAML/Markdown formatting checks for touched files,
      `git diff --check`, and a complete authored-diff review. Outside the active/archived OpenSpec
      lifecycle, the implementation diff must be exactly four identical workflow key/value additions;
      verify triggers, permissions, runners, commands, local API URLs, assertions, failure artifacts,
      `mobile/app.config.ts`, Architecture Book, OpenAPI/generated client, migrations, secrets,
      Firebase config, infrastructure, deploy behavior, and `app/` are unchanged.

## 4. Validate, archive, and establish exact-head CI proof

- [ ] 4.1 Run `openspec validate wire-pr-273-e2e-backend-capability --strict`, archive with
      `openspec archive wire-pr-273-e2e-backend-capability --skip-specs -y`, then run
      `openspec validate --all --strict`. Confirm no canonical
      `openspec/specs/same-pr-native-e2e-capability-remediation/` directory remains.
- [ ] 4.2 Commit and push without force to the existing PR branch, update PR #273's body to
      disclose the newly authorized sensitive workflow surface, preserve `run-e2e`, and record the
      final exact head. Require fresh baseline checks plus `Run mobile E2E (Android)` and
      `Run mobile E2E (iOS)` on that exact head; both native jobs must pass the unchanged import and
      source-recovery assertions before handoff.
- [ ] 4.3 Hand the same issue and branch to Simplifier only after exact-head CI is green. Require
      fresh Simplifier and Reviewer passes after any head-changing commit; Reviewer may autonomously
      squash-merge the same PR only after a clean exact-head verdict. No separate QA gate or deploy
      act applies.
