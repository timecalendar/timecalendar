## 1. Isolate Maestro flow lifecycles

- [ ] 1.1 Refactor `mobile/e2e/run_e2e.sh` so it boots `ci/e2e-server.sh` once,
  discovers every top-level `mobile/.maestro/*.yaml` in deterministic lexical order, runs
  each file in its own `maestro test <file>` process, stops at the first terminal failure,
  and tears the server down once on every exit; preserve `--native` and `--keep-up` on macOS
  Bash 3.2.
- [ ] 1.2 Add an explicit bounded startup-attempt argument whose default is one. Capture each
  attempt's output and retry only the pinned Maestro 2.8.0 signatures proving the first
  `launchApp`/`setPermissions` failed because the XCTest driver was not listening or refused
  its local connection, with no assertion evidence; log classification and return every
  unknown/application/assertion failure immediately.
- [ ] 1.3 Add a focused shell proof for the harness control flow using fake Maestro results:
  all top-level YAML files are enumerated, the server lifecycle is single-lived, a known
  startup failure retries no more than the configured bound, an assertion failure is invoked
  exactly once, later flows do not run after terminal failure, and the original non-zero
  status propagates.

## 2. Make the native CI toolchain bounded and reproducible

- [ ] 2.1 In both jobs in `.github/workflows/ci-mobile-e2e.yml`, install Maestro with
  `MAESTRO_VERSION=2.8.0`, export its binary path for the current and later steps, and print
  `maestro --version`; remove the floating-latest behavior.
- [ ] 2.2 Bound Android `:app:assembleRelease` at 3072 MiB heap, 1024 MiB Metaspace, two
  workers, and `--no-daemon`, log the effective limits, and keep release configuration,
  development identity, API URL, APK install, KVM, timeout, and failure artifacts intact.
- [ ] 2.3 Make iOS simulator selection deterministic from `simctl` JSON and print
  `xcode-select -p`, `xcodebuild -version`, available runtimes, and the selected simulator's
  name, UDID, and runtime before boot/install; fail clearly if no iPhone is available.
- [ ] 2.4 Replace the workflow's four whole-suite retries with one harness invocation using at
  most four startup attempts per flow and a bounded driver-start timeout. Preserve the
  native Postgres/Redis setup, single `ci/e2e-server.sh --native` lifecycle, release build,
  debug uploads, and server-log uploads.
- [ ] 2.5 Run the focused shell proof as a CI step before native execution, and add static
  assertions that both jobs pin 2.8.0 and the Android Gradle invocation retains all four
  resource bounds.

## 3. Update the binding testing contract

- [ ] 3.1 Add ADR 037 under `docs/mobile/architecture-book/decisions/` with `## Decision`
  blocks for process-per-top-level-flow isolation, startup-only retries, the single shared
  server lifecycle, alternatives, consequences, and a revisit condition tied to a pinned
  Maestro upgrade proving stable directory-suite execution on iOS 26; index the ADR in
  `decisions/README.md`.
- [ ] 3.2 Update `docs/mobile/architecture-book/testing.md` to replace the one-directory-
  session rule with the per-flow lifecycle and strict retry boundary, while retaining
  `clearState`, seeded-round-trip, and shared-server requirements.
- [ ] 3.3 Update `mobile/e2e/README.md` and `docs/agent-dev-environment.md` with the exact
  Maestro pin, new invocation/startup-attempt contract, per-flow behavior, CI Gradle limits,
  Apple toolchain logging, and the distinction between local static checks and post-merge
  native proof.
- [ ] 3.4 Confirm the documentation introduces no human-only credential/device/console step;
  therefore no `docs/react-native-migration/inbox/` note is needed.

## 4. Local-green verification

- [ ] 4.1 Run `bash -n mobile/e2e/run_e2e.sh` and the focused harness shell proof; run
  ShellCheck if it is installed, recording an explicit N/A otherwise.
- [ ] 4.2 Validate the workflow syntax and static invariants (exact Maestro pin in both jobs,
  Xcode/runtime logging, Android heap/Metaspace/workers/no-daemon bounds, no whole-suite
  retry, and failure artifact steps still present).
- [ ] 4.3 Run `openspec validate stabilize-mobile-maestro-ci` and the repository's formatting
  check on the touched YAML/Markdown/shell files. Do not run mobile TypeScript/Jest coverage:
  no application TypeScript or product behavior changes.
- [ ] 4.4 Review `git diff --check` and the complete diff: only the CI workflow, mobile E2E
  harness/tests/docs, Architecture Book ADR/testing/index, agent handbook, and this OpenSpec
  change may differ; confirm no secrets, flow removals, ignored outcomes, API/schema/native
  config, deploy/infrastructure, or legacy Flutter edits.

## 5. CI proof and close-out

- [ ] 5.1 Let normal PR checks verify the implementation without adding the `run-e2e` label
  solely to compensate for this host's lack of KVM; Reviewer confirms the sensitive workflow
  remains non-deploying and failure diagnostics still upload.
- [ ] 5.2 After merge, confirm the path-triggered `main` workflow runs on a SHA containing
  onboarding merge `482f134f`, and verify the logs show Maestro 2.8.0 plus the chosen Apple
  toolchain/runtime and that `onboarding.yaml` ran as part of the complete flow set.
- [ ] 5.3 Record direct `SUCCESS` job links for `Run mobile E2E (iOS)` and
  `Run mobile E2E (Android)` on the recovery issue before closing it so the onboarding issue
  can consume terminal proof; keep the recovery issue open and repair within this scope if
  either job fails.
