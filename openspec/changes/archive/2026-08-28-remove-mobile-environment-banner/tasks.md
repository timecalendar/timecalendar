## 1. Delete the marker

- [x] 1.1 In `mobile/src/features/environment/ui/environment-runtime-gate.tsx`, delete
      `NonProductionEnvironmentMarker` and the `markerSafeArea` / `markerText` styles. Collapse the
      happy-path return to `<>{children}</>` and delete the now-unused `root` / `content` styles.
      Leave the journal read, the recovery `SafeAreaView`, the retry pressable, every recovery style,
      and the Crashlytics effect exactly as they are.
- [x] 1.2 Drop every import the file no longer uses (`useTranslation` stays only if the recovery copy
      still needs it — it does; `SafeAreaView` stays for recovery). Verify no unused import or style
      survives; ESLint is the check.
- [x] 1.3 Remove `NonProductionEnvironmentMarker` from
      `mobile/src/features/environment/ui/index.ts`. `mobile/src/features/environment/index.ts`
      re-exports the barrel and needs no edit; confirm nothing outside the feature imported the
      marker (`grep -rn "NonProductionEnvironmentMarker" mobile/src`).
- [x] 1.4 In `mobile/src/features/environment/ui/environment-runtime-gate.test.tsx`, delete the
      marker test and the `NonProductionEnvironmentMarker` import. Keep the three gate tests
      (children mount + diagnostics, cold-start journal block, malformed-journal retry).
- [x] 1.5 Remove `"environment.marker"` from `mobile/src/i18n/locales/en.json` and
      `mobile/src/i18n/locales/fr.json` (line 96 in both). Keep every `environment.choice.*`,
      `environment.selector.*`, `environment.confirm.*` and `environment.recovery.*` key.
      Verification: `grep -rn "environment.marker" mobile/` returns nothing.

## 2. Make the Settings entry the readable indicator

- [x] 2.1 Add `"environment.selector.accessibilityLabel"` to both locales, in the
      `environment.selector.*` block so key order stays parallel. Reuse the repo's existing
      composition template rather than hardcoding the label word: `"{{primary}}, {{secondary}}"` in
      EN and FR, matching `settingsHub.summary.accessibilityLabel`.
- [x] 2.2 In `mobile/src/features/environment/ui/environment-settings-control.tsx`, compute the
      displayed value once (`switching` → `environment.selector.switching`, else
      `environment.choice.${current}`), pass it as `secondary`, and pass
      `accessibilityLabel={t("environment.selector.accessibilityLabel", { primary: label,
      secondary: value })}`. Do not change
      `SettingsRow`, the `testID`, the icon, the hint, the alerts, or the production early return.
- [x] 2.3 In `environment-settings-control.test.tsx`, assert the row's `accessibilityLabel` includes
      the effective environment in both the preview (`Preproduction`) and development (`Local`)
      cases, alongside the existing visible-secondary assertion. Keep every alert-ordering
      assertion untouched.
- [x] 2.4 In `mobile/src/features/settings/ui/settings-screen.test.tsx`, mock `@/features/environment`
      with a controllable capability (defaulting to `production`, which is what the jest env resolves
      today, so the existing section-order assertion is unchanged) and add one test that renders with
      a non-production capability and asserts `settings-section-environment` is the **last**
      `settings-section-*`. Without it the spec's "SHALL remain in Settings' final section" is
      unenforced prose, which R-1 forbids.

## 3. Rewrite the Maestro flow

- [x] 3.1 In `mobile/.maestro/environment-switch.yaml`, delete both
      `TEST ENVIRONMENT · …` waits. Replace the pre-switch assertion with: tap the Settings tab,
      `scrollUntilVisible` on `id: "settings-environment"`, then `assertVisible: ".*Local"`.
- [x] 3.2 Keep the switch itself unchanged: tap `id: "settings-environment"`, tap `"Preproduction"`,
      assert `"Clear data and switch?"`, tap `"Clear and switch"`.
- [x] 3.3 Replace the post-switch banner wait with: `extendedWaitUntil` on the `"Settings"` tab
      (60000, the reload lands on the initial route), tap it, `scrollUntilVisible` on
      `id: "settings-environment"`, then `assertVisible: ".*Preproduction"`.
- [x] 3.4 Update the file's header comment to say what it now proves and why the selectors take the
      shape they do (iOS collapses the row into one accessibility element, so the value is read from
      the composed accessible name; the regex full-matches both platforms; the entry is the last
      section and may sit below the fold). Do not add the `run-e2e` label to the PR.

## 4. Update the binding docs

- [x] 4.1 In `docs/mobile/architecture-book/decisions/043-backend-environment-reset.md`, replace the
      consequence sentence "Local and preproduction show a persistent accessible marker." with a
      dated supersession note (2026-08-28, TIM-269) stating that the Settings entry is now the sole
      indicator and that no environment chrome may consume layout insets. Leave Status `Accepted` —
      only this consequence is superseded — and leave Context, Decision and Revisit if untouched.
- [x] 4.2 In `docs/mobile/architecture-book/features.md`, change the `environment` row's
      responsibility from "Build-authorized backend selection, global test marker and journaled
      reset/recovery" to drop the marker and name the Settings entry instead.
- [x] 4.3 Append a dated entry to `docs/mobile/architecture-book/CHANGELOG.md` recording the rule
      change: the persistent non-production marker is removed, the Settings entry is the single
      indicator and must expose its value to assistive technology, and no environment surface may
      consume insets (ADR 043, features.md).
- [x] 4.4 In `docs/react-native-migration/inbox/2026-08-27-environment-switch-device-pass.md`, delete
      the marker checklist item, drop "marker" from the VoiceOver/TalkBack item, and note that the
      Settings entry is what the device pass now reads.
- [x] 4.5 Confirm this change introduces no new credential, device-install or console step, so no new
      `(HUMAN: …)` inbox note is required — the existing environment-switch note absorbs it.

## 5. Local-green verification

- [x] 5.1 `cd mobile && npx tsc --noEmit`.
- [x] 5.2 `cd mobile && npm run lint` — this carries the FR/EN i18n parity rule and the unused-import
      / unused-style checks that prove step 1 is complete.
- [x] 5.3 `cd mobile && npm test -- --coverage` (the coverage gate is part of the suite). The
      environment feature's remaining tests must pass without the deleted marker test propping up
      coverage on `environment-runtime-gate.tsx`; if the file drops below threshold, cover the gate
      path rather than restoring the marker.
- [x] 5.4 `npx openspec validate remove-mobile-environment-banner --strict`, then run the archive for
      real in this PR: `npx openspec archive remove-mobile-environment-banner -y`. There is no
      `--dry-run` (the CLI offers only `-y`, `--skip-specs`, `--no-validate`), and `--skip-specs`
      must **not** be used — rewriting `openspec/specs/mobile-backend-environments/spec.md` is the
      point. Archive is the only step that checks the `MODIFIED` headers byte-for-byte, and in this
      repo the archive ships inside the feature PR so `main` never contradicts itself.
- [x] 5.5 Review the complete diff (`git diff origin/main...HEAD`): only the environment feature UI,
      its two tests, the two locale files, the Maestro flow, the Architecture Book ADR/features/
      CHANGELOG, the inbox note and this OpenSpec change may differ. No `openapi/`, no
      `mobile/src/api/generated/`, no server migration, no `app.config.ts`/`eas.json`/`firebase/`,
      no workflow, no `terraform/`/`k8s/`, no `app/`.
