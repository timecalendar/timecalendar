## Context

The backend-environment selector introduced a dedicated `BACKEND_ENVIRONMENT_CAPABILITY` build input. `app.config.ts` normalizes only `development`, `preview`, and `production`; absent or malformed input deliberately resolves to `production`, independently of `APP_VARIANT`, OTA metadata, Firebase configuration, and the compiled API URL.

The native E2E workflow predates that boundary. Its Android and iOS prebuild steps set only `APP_VARIANT=development`, while their release compilation steps set the development variant plus a platform-local `EXPO_PUBLIC_API_URL`. A CI-shaped config resolution therefore produces `appVariant=development` but `backendEnvironmentCapability=production`, so the runtime cannot select `local` and the seeded import fails before later B10 flows run. The existing `mobile/e2e/test_ci_mobile_e2e.sh` proof checks toolchain, retry, and artifact invariants but does not inspect this build contract.

The workflow is a sensitive CI surface. The change must recover the local seeded-server path on both platforms without weakening the production fail-closed behavior or changing application/runtime selection code.

A second, independent defect sits immediately behind the first. Exact-head run 33162979890 proved the routing repair — both platforms reach `TEST ENVIRONMENT · Local`, complete `import-seed.yaml`, and render the real seeded events — then fail terminally on `tapOn: id: "calendar-view-agenda"`. That id belonged to a segmented control removed in `a45b9a5`, when the calendar header moved to native chrome. The view control is now a single header element with `testID="calendar-view"` — an `@expo/ui` `Picker` with `appearance="menu"` on iOS, a `@react-native-menu/menu` trigger `Pressable` on Android — and the view is chosen from its menu. `calendar.yaml` and `hidden-events.yaml` still carry four references to the dead id, so the seeded round trip they exist to prove can never complete.

The same class of drift is not unique to this id. `run_e2e.sh` iterates top-level flows lexically and stops at the first failure, so `calendar.yaml` (third alphabetically) has been masking every later flow. Two further selectors removed by unrelated UI reworks are still referenced downstream: `onboarding-welcome-url-cta` (`ical-import.yaml`, removed in `482f134`) and `onboarding-school-filter` (`onboarding.yaml`, removed in `f2e47ee`). Repairing those is not authorized here and is tracked in `TIM-265`; this change must not silently claim the full flow set is green.

## Goals / Non-Goals

**Goals:**

- Make each Android and iOS native E2E prebuild and release-compilation step resolve development identity, development backend capability, and the platform-correct local API URL.
- Add a focused, locally runnable structure proof that fails if any of those four build steps loses or misstates one member of the contract.
- Reach the agenda surface in both shared calendar-family flows through the control the app actually ships, with one cross-platform, locale-stable interaction and no per-platform branch.
- Catch selector drift at the commit that causes it, in the baseline gate, instead of at an on-demand native run.
- Keep the Architecture Book, E2E operator README, and agent handbook aligned with the executable contract.
- Require baseline checks and both native jobs to pass on the recovery PR's exact head, with direct run/job links recorded in the handoff.

**Non-Goals:**

- Change `app.config.ts`, the backend-environment selector, endpoint allowlist, persisted environment behavior, application UI/behaviour, retry classification, Maestro flow order, seeded-data assertions, or server lifecycle.
- Repair the `ical-import.yaml` / `onboarding.yaml` stale selectors (`TIM-265`) or add per-platform branches to any flow.
- Change OpenAPI/generated clients, server schema or migrations, native/store configuration, EAS profiles, Firebase files, deployments, infrastructure, or legacy Flutter.
- Re-run a terminal native failure without a material workflow fix, add a separate QA gate, or modify the parent feature PR.

## Decisions

## Decision 1: Declare the complete backend contract on every native build step

The Android prebuild, Android Gradle release assembly, iOS prebuild, and iOS Xcode Release build will each declare all three inputs explicitly:

| Platform | Identity                  | Capability                                   | Local URL                                   |
| -------- | ------------------------- | -------------------------------------------- | ------------------------------------------- |
| Android  | `APP_VARIANT=development` | `BACKEND_ENVIRONMENT_CAPABILITY=development` | `EXPO_PUBLIC_API_URL=http://10.0.2.2:3005`  |
| iOS      | `APP_VARIANT=development` | `BACKEND_ENVIRONMENT_CAPABILITY=development` | `EXPO_PUBLIC_API_URL=http://localhost:3005` |

Keeping the values on the named prebuild/build steps makes every config evaluation and bundle compilation self-contained and reviewable. The capability is not inferred from the development identity, scheme, URL, or CI context. Existing Gradle bounds, Xcode invocation, native identities, and artifact locations remain unchanged.

Alternatives rejected:

- Infer capability from `APP_VARIANT`: this weakens the independent security boundary and contradicts the fail-closed selector design.
- Change the missing-value default to development: malformed production builds could become non-production-capable.
- Set only the final bundle steps: `expo prebuild` also evaluates app config and must generate native development configuration from the same declared inputs.
- Put the values at workflow or repository scope: this unnecessarily exposes build-only inputs to unrelated steps and makes platform ownership less obvious.

## Decision 2: Prove named step environments, not global string counts

`mobile/e2e/test_ci_mobile_e2e.sh` will retain its existing invariants and add a helper that isolates each of the four named workflow step blocks. For each block it will assert exactly one development identity, exactly one development backend capability, and exactly one expected platform URL. It will also reject the opposite platform URL in that block.

This focused shell proof remains dependency-light and runs in both native jobs before device execution. Step-scoped assertions prevent a duplicated value in one job from compensating for an omission in another, which a workflow-wide occurrence count would miss.

Alternatives rejected:

- Rely only on `app.config.test.ts`: it proves parsing and fail-closed semantics, not that GitHub Actions supplies the inputs.
- Check only total string counts: counts do not establish co-location or platform correctness.
- Add a general workflow parser dependency: the four fixed step contracts are small enough for the existing shell proof, and a new parser would broaden this recovery change.

## Decision 3: Reach the agenda through the shipped calendar-view control

Both shared flows replace `tapOn: id: "calendar-view-agenda"` with the interaction the app actually offers:

```yaml
- tapOn:
    id: "calendar-view"
- tapOn:
    text: "Agenda"
```

`calendar-view` is the **same** `testID` on both platforms (`calendar-view-menu.tsx`): the `@expo/ui` `Picker` (`appearance="menu"`) on iOS and the `@react-native-menu/menu` trigger `Pressable` on Android. `Agenda` is `calendar.view.agenda`, which is byte-identical in `en.json` and `fr.json`, so the selection stays locale-stable — the same property the existing flow headers already rely on. No per-platform branch is introduced.

`calendar.yaml`'s follow-on `assertVisible: id: "calendar-view-agenda"` becomes an assertion on `id: "agenda-section-list"` — the `FlatList` in `agenda-list.tsx`, which mounts **only** when `view === "agenda"`. That is a strictly stronger proof than the old one: the dead assertion only proved a segment existed, whereas the new one proves the view actually switched. `hidden-events.yaml`'s two references are pure taps and need no companion assertion; its existing seeded-title waits already prove the agenda rendered.

Alternatives rejected:

- Extract a shared `runFlow` sub-flow for the interaction: `run_e2e.sh` globs `.maestro/*.yaml` and runs **every** top-level file standalone, so a sub-flow would need a nested directory and a new convention. Three call sites of two lines each do not justify it, and Decision 4's guard — not deduplication — is what actually prevents recurrence.
- Assert the trigger's label reads "Agenda" after selection: on Android that label is an `accessibilityLabel` and on iOS it is the picker's rendered value; asserting it cross-platform is fragile and proves less than the agenda list mounting.
- Add a `view` deep-link parameter to reach agenda without the menu: that is an application change, explicitly out of scope, and it would stop exercising the control a user actually taps.
- Drop the agenda step and assert seeded titles on the timeline grid: the flow headers already record why that is not viable — calendar-kit grid tiles live inside a Reanimated worklet grid and carry no per-event `testID`.

## Decision 4: Guard selector drift in the baseline gate, not the native gate

A new `mobile/e2e/maestro-selectors.test.ts` (Jest, so it runs in the existing `test-mobile` baseline job with no new CI surface) will:

1. read every `mobile/.maestro/*.yaml` and collect each literal selector id — any `id:` value matching `^[a-z0-9-]+$`, which skips the two deliberately regex-shaped ids (`checklist-check-.*`, `checklist-remove-.*`);
2. read every non-test file under `mobile/src` and collect literal `testID="…"` values;
3. fail on any flow id with no matching `testID`.

The baseline gate is the correct home. All three known stale selectors were introduced by UI-rework PRs that ran the baseline gate and did not run the on-demand native gate; a proof living only in `test_ci_mobile_e2e.sh` would have caught none of them at the commit that caused them. The workflow-contract proof stays where it is — it asserts workflow structure, which is a different concern.

The test carries a `KNOWN_STALE` map for the two `TIM-265` ids, each with its ticket reference. The map is bidirectional: the test also fails if a `KNOWN_STALE` id **is** present in `mobile/src`, so the allowlist cannot silently rot once `TIM-265` lands.

Alternatives rejected:

- Extend `test_ci_mobile_e2e.sh` instead: that script runs only inside the two on-demand native jobs, which is precisely the gate that was not protecting us.
- Fail on the two `TIM-265` ids now: that would either red the baseline gate on an unauthorized surface or force this change to absorb a repair that needs its own scope decision.
- Resolve templated `testID={\`prefix-${x}\`}` selectors too: no current flow uses a literal id that resolves through a template, so the matching stays literal-only and simple.

## Decision 5: Update the existing testing rule without a new ADR

`docs/mobile/architecture-book/testing.md`, its changelog, `mobile/e2e/README.md`, and `docs/agent-dev-environment.md` will state that release-config native E2E builds require the explicit capability in addition to the variant and platform URL. Local build examples will include all three inputs. `testing.md` additionally records that flow selectors must resolve against real app `testID`s and names the baseline guard that enforces it.

Both files are binding documentation and are flagged as a sensitive surface. They are corrections to an existing CI/E2E wiring contract, not costly-to-reverse architectural decisions, so no new ADR is warranted. ADR 038's process-per-flow lifecycle and terminal-failure rule remain unchanged.

## Decision 6: Treat exact-head native CI as required recovery evidence

After the implementation is pushed, the recovery PR will receive its normal baseline gate plus the `run-e2e` native workflow. Both named Android and iOS jobs must pass on the same exact commit that is reviewed; seeded calendar import through the real local server is part of that unmodified flow set. The handoff records the commit SHA and direct run/job links. A native failure is terminal under ADR 038 unless a material new fix justifies another run.

No separate QA stage is added because the issue explicitly assigns the exact-head CI evidence to the normal apply/review pipeline and the Reviewer owns autonomous merge after green preflight.

## Risks / Trade-offs

- [One platform or phase drifts later] → Step-scoped assertions cover all four build steps and both exact URLs.
- [Duplicated environment declarations require maintenance] → The duplication is intentionally bounded to four sensitive steps and makes each config evaluation self-contained; the proof keeps them synchronized.
- [A malformed production build becomes development-capable] → Leave all parser/runtime defaults untouched and change only the development-only E2E workflow.
- [Static proof passes while native routing still fails] → Require both native jobs on the recovery PR's exact head, including the real seeded import flow.
- [CI retry masks the import regression] → Preserve ADR 038 unchanged: assertion/application/unknown failures are terminal and only classified XCTest startup transport failures may retry.
- [The menu popup is not addressable on one platform] → This is the residual risk of Decision 3 and only a device settles it. `appearance-settings.yaml` records design D5: `@expo/ui` picker **popup internals** were judged unreliable for a toggle round trip. This case differs — the trigger carries a `testID` that `appearance-settings.yaml` already asserts visible on both platforms, and the menu entries are plain OS menu items with fixed labels, the same shape `environment-switch.yaml` and `hidden-events.yaml` already drive through native `Alert` choosers. If the exact-head run shows one platform cannot address the entry, that is a material finding for the Founding Engineer, not a retry: the fallback would be an application change (a testID-addressable view control or a deep-link parameter) that this change is not authorized to make.
- [The gate still ends red at `ical-import.yaml`] → Expected and stated up front: `TIM-265` owns the two remaining stale selectors. This change's own evidence is that the calendar family completes; do not report the full flow set as green until `TIM-265` lands.

## Migration Plan

1. Add the three explicit build inputs to the four named workflow steps and extend the focused step-scoped shell proof.
2. Replace the four `calendar-view-agenda` references in the two shared calendar-family flows with the current control interaction, and update each flow's header comment to describe the contract it now relies on.
3. Add the baseline-gate selector guard with its documented `KNOWN_STALE` allowlist.
4. Update testing/operator guidance and the Architecture Book changelog; no human-only inbox note is needed.
5. Run shell syntax/proof, workflow/config/YAML formatting, resolved Expo config checks for both platform contracts, the mobile Jest suite, OpenSpec validation, and the applicable baseline checks.
6. Push the implementation and run baseline plus Android and iOS native jobs on one exact PR head. Record the SHA and direct run/job links before review handoff.
7. Rollback is a normal revert of the workflow, flow, proof, and documentation changes. It restores the known broken E2E routing but does not migrate data or alter production behavior.

## Open Questions

None. The `TIM-265` scope decision is tracked on its own ticket and does not gate this change.
