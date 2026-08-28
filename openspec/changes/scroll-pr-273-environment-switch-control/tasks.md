## 1. Reconfirm the same-PR and failure boundary

- [ ] 1.1 Confirm the checkout, remote head, and GitHub head are PR #273's existing named branch;
      record the exact head and current `origin/main`, and verify the PR is open, non-draft,
      mergeable, and retains `run-e2e`. Do not switch branches, open another PR, rebase,
      force-push, or merge during Apply.
- [ ] 1.2 Review the prior exact-head native failure, `mobile/.maestro/environment-switch.yaml`,
      `mobile/.maestro/home.yaml`'s established `scrollUntilVisible` shape, and
      `.github/workflows/ci-mobile-e2e.yml` before editing. Confirm both platforms passed calendar
      import and failed only after the Settings tap while waiting for `settings-environment`; if
      current evidence or a new sensitive surface contradicts that boundary, return to Founding
      Engineering rather than broadening this design.

## 2. Reveal the existing environment control

- [ ] 2.1 In `mobile/.maestro/environment-switch.yaml`, add exactly one `scrollUntilVisible`
      command immediately after `tapOn: "Settings"` and immediately before the existing
      `extendedWaitUntil`. Set only `element.id: "settings-environment"`, `direction: DOWN`, and
      `timeout: 60000`.
- [ ] 2.2 Preserve the existing `extendedWaitUntil`, its selector and 60000 ms timeout, the
      id-based environment tap, the `Preproduction` tap, confirmation assertion/tap, and final
      preproduction-marker wait byte-for-byte. Change no other Maestro flow, harness, product file,
      or workflow field.

## 3. Complete the architecture and human-step disposition

- [ ] 3.1 Verify this remains a leaf-level Maestro driveability repair under R-4: no product or
      binding architecture rule changed, so leave `docs/mobile/architecture-book/` and its ADRs
      unchanged and record that no Architecture Book update is warranted.
- [ ] 3.2 Confirm the change introduces no credential, device-install, or console-registration
      step, so no `(HUMAN: ...)` note under `docs/react-native-migration/inbox/` is needed. Keep
      EAS/Firebase/store config, contracts/generated clients, migrations, infrastructure, deploy
      behavior, and legacy Flutter unchanged.

## 4. Prove the narrow YAML and scope contract locally

- [ ] 4.1 Parse the target YAML and run a focused structural assertion proving exactly one
      `scrollUntilVisible` exists, with the exact id/direction/timeout, between the Settings tap and
      unchanged environment-control wait. Run the repository's YAML/Markdown formatting check for
      touched files.
- [ ] 4.2 Run `./mobile/e2e/test_ci_mobile_e2e.sh` and a focused count/scope assertion proving
      `.github/workflows/ci-mobile-e2e.yml` still has exactly four
      `BACKEND_ENVIRONMENT_CAPABILITY: development` entries in the previously authorized native
      build environments. Do not edit the workflow to obtain a pass.
- [ ] 4.3 Run `openspec validate scroll-pr-273-environment-switch-control --strict`,
      `git diff --check`, and a complete authored-diff review. Outside this OpenSpec lifecycle, the
      implementation diff must be exactly the one authorized command in
      `mobile/.maestro/environment-switch.yaml`; verify every other flow, application/runtime file,
      protected surface, and prior workflow capability entry is unchanged.

## 5. Archive, push, and establish exact-head proof

- [ ] 5.1 Archive the completed one-off change with
      `openspec archive scroll-pr-273-environment-switch-control --skip-specs -y`, then run
      `openspec validate --all --strict`. Confirm no canonical
      `openspec/specs/same-pr-environment-switch-scroll-remediation/` directory remains.
- [ ] 5.2 Commit and push without force to the existing PR branch, update PR #273's body with the
      one-command Maestro remediation while continuing to disclose the inherited sensitive CI
      surface, preserve `run-e2e`, and record the final exact head. Require fresh baseline checks
      plus `Run mobile E2E (Android)` and `Run mobile E2E (iOS)` on that exact head; both native jobs
      must pass the unchanged import, environment-switch, and later flow assertions.
- [ ] 5.3 Hand the same issue and branch to Simplifier only after exact-head CI is green. Require
      fresh Simplifier and Reviewer passes after any head-changing commit; Reviewer may autonomously
      squash-merge the same PR only after a clean exact-head verdict. No separate QA gate or deploy
      act applies.
