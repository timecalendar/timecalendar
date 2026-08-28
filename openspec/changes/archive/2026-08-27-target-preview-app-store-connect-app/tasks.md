## 1. Correct the preview submit destination

- [x] 1.1 In `mobile/eas.json`, replace only `submit.preview.ios.ascAppId` with the string
      `1479613630`; retain preview `appleId`/`appleTeamId`, the complete production submit profile,
      Android submission, build profiles, credentials, and every unrelated field unchanged, then run
      `jq -e -r '.submit.preview.ios.ascAppId == "1479613630"' mobile/eas.json` from the repository root.

## 2. Encode the regression proof

- [x] 2.1 Update `mobile/app.config.test.ts` so preview and production submit expectations are
      lane-specific: assert preview's exact `1479613630` value and reject `$EXPO_ASC_APP_ID`, preserve
      environment-backed Apple account/team fields and Android shape, and keep an exact unchanged
      production expectation; verify with `cd mobile && npm test -- --runInBand app.config.test.ts`.

## 3. Synchronize Architecture Book and release guidance

- [x] 3.1 Update `docs/mobile/architecture-book/eas.md` and
      `docs/mobile/architecture-book/CHANGELOG.md` so the current contract says preview deterministically
      targets public App Store Connect app `1479613630`, production remains environment-backed, and
      credential-bearing inputs remain outside git; point at the focused Jest and `jq` gates.
- [x] 3.2 Update `mobile/EAS.md`, `docs/mobile/releases/03-first-preview.md`, and
      `docs/mobile/releases/05-readiness-and-gaps.md` wherever they describe preview as an unresolved
      submit skeleton; retain explicit operator authorization, exact-artifact, credential-custody, and
      no-upload-in-this-change language, and do not claim a build or submission occurred.

## 4. Local green, sensitive-surface audit, and CI proof

- [x] 4.1 Run `cd mobile && npm test -- --runInBand app.config.test.ts` and the root-level direct
      `jq` assertion again, then run the repository formatter/check for every touched JSON, TypeScript,
      and Markdown file plus `git diff --check`; record the exact commands and green results.
- [x] 4.2 Run `openspec validate target-preview-app-store-connect-app --strict`, inspect the final
      diff, and confirm the only sensitive surface changed is `mobile/eas.json`; confirm no production
      submit, credential/key/certificate, generated native, OpenAPI/generated client, migration,
      Firebase, dependency, infrastructure, workflow, deployment, or legacy Flutter change exists.
- [x] 4.3 Push implementation commits to the existing PR and use green GitHub mobile CI at the
      exact reviewed head as the CI proof test; obtain Reviewer sign-off and then merge the
      repository change autonomously without building, signing, uploading, submitting, assigning
      testers, or distributing to production.
