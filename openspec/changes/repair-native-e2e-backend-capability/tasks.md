## 1. Compile native E2E with development backend capability

- [ ] 1.1 Add `BACKEND_ENVIRONMENT_CAPABILITY: development` to the job-level environment of `e2e-mobile-android` in `.github/workflows/ci-mobile-e2e.yml`; keep the existing development variant, Android host URL, cleartext policy, build bounds, triggers, and server lifecycle unchanged.
- [ ] 1.2 Add the same job-level capability to `e2e-mobile-ios`; keep the existing development variant, iOS host URL, ATS behavior, simulator/toolchain selection, startup classification, triggers, and native server lifecycle unchanged.
- [ ] 1.3 Review the sensitive workflow diff and confirm the capability exists only in the two development E2E jobs, cannot reach preview/production lanes, and does not alter secrets, Firebase, deployment, store, OTA, OpenAPI, migration, or legacy Flutter surfaces.

## 2. Add the deterministic regression gate

- [ ] 2.1 Extend `mobile/e2e/test_ci_mobile_e2e.sh` to inspect the `e2e-mobile-android` and `e2e-mobile-ios` job blocks independently and fail with a job-specific message unless each job-level environment declares exactly `BACKEND_ENVIRONMENT_CAPABILITY: development`.
- [ ] 2.2 Preserve the existing workflow invariants and add focused resolved-config verification using `mobile/app.config.test.ts` or an equivalent Expo config assertion: explicit development resolves `extra.backendEnvironmentCapability=development`, while missing/malformed input stays production-locked.
- [ ] 2.3 Run `./mobile/e2e/test_ci_mobile_e2e.sh` from the repository root and the focused mobile app-config Jest suite; confirm both pass and that a temporary omission/change in either job makes the new assertion fail before restoring the intended workflow.

## 3. Update the Architecture Book

- [ ] 3.1 Update `docs/mobile/architecture-book/testing.md` so the release-config E2E build contract names all three independent inputs: development app identity, explicit development backend capability, and the platform-local compiled API URL.
- [ ] 3.2 Add a dated entry to `docs/mobile/architecture-book/CHANGELOG.md` recording the corrected native E2E build rule and its deterministic workflow gate; do not add a new ADR because accepted ADR 043 already owns capability independence and fail-closed behavior.

## 4. Local-green verification

- [ ] 4.1 Run the targeted workflow regression and app-config suite, then run the smallest relevant formatting/lint checks for the changed shell, TypeScript test/config, workflow, and Markdown files; resolve failures without weakening assertions or bypassing hooks.
- [ ] 4.2 Run `openspec validate repair-native-e2e-backend-capability` and `git diff --check`; inspect the final diff for debug artifacts, secrets, unrelated edits, and forbidden changes to `mobile/app.config.ts` defaults, production/preview config, Firebase, OpenAPI/generated clients, migrations, deploy config, or `app/`.

## 5. CI proof on the exact implementation head

- [ ] 5.1 Push the implementation head and add the PR's `run-e2e` label so the exceptional native repair executes `Run mobile E2E (Android)` and `Run mobile E2E (iOS)` against that exact SHA.
- [ ] 5.2 Confirm both native jobs are green and their release-config binaries complete the fresh-storage seeded dev-import through `http://10.0.2.2:3005` on Android and `http://localhost:3005` on iOS; if either reports `dev-import-error`, retain the real-server assertion and repair the capability/config wiring rather than adding retries or weakening Maestro checks.
- [ ] 5.3 Record the exact head SHA and both green job links in the handoff/review evidence. QA remains not required because this is build/CI configuration with the two native integration jobs as its required proof.
