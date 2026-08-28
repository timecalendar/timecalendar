## Why

PR #273's capability-wired Android and iOS native runs now pass the formerly failing calendar
import, but both platforms stop in `environment-switch.yaml` after opening Settings because the
existing `settings-environment` selector is below the visible viewport. The same-PR gate needs one
bounded scroll to reveal that unchanged control without weakening the wait or any subsequent
assertion.

## What Changes

- Add exactly one Maestro `scrollUntilVisible` command to
  `mobile/.maestro/environment-switch.yaml`, immediately after `tapOn: "Settings"` and before the
  existing `extendedWaitUntil` for the environment control.
- Configure that command with `element.id: "settings-environment"`, `direction: DOWN`, and
  `timeout: 60000`.
- Preserve the existing wait, selector, taps, confirmation, and final environment-marker assertion,
  plus every other Maestro flow and all product layout/runtime behavior.
- Preserve the four existing native E2E `BACKEND_ENVIRONMENT_CAPABILITY: development` entries and
  require focused YAML/scope proof followed by fresh exact-head baseline, Android, and iOS CI
  before Simplifier and Reviewer continue the authorized same-PR pipeline.

## Capabilities

### New Capabilities

- `same-pr-environment-switch-scroll-remediation`: One-off requirements for revealing PR #273's
  existing environment selector in the shared Android/iOS Maestro flow without changing the
  selector, interaction contract, product, or any other flow.

### Modified Capabilities

None. The canonical `mobile-backend-environments` and `mobile-e2e` requirements remain unchanged;
this operational delta makes their already-accepted visible Settings proof driveable on both
native viewports.

## Impact

- Existing PR #273 and branch
  `TIM-186-prod-health-investigation-at-rentr-e-2026-write-docs-investigations-2026-08-25-rentree-prod-health-report`
  only; no replacement PR, rebase, force-push, merge, QA gate, or deploy act during Apply.
- `mobile/.maestro/environment-switch.yaml` is the sole authorized implementation surface. It may
  gain exactly one command in the specified position; product layout/runtime and all other Maestro
  YAML remain unchanged.
- The existing sensitive CI surface `.github/workflows/ci-mobile-e2e.yml` remains unchanged,
  including its four development-capability entries, triggers, permissions, runners, commands,
  URLs, and failure artifacts.
- `mobile/app.config.ts`, `mobile/eas.json`, `mobile/firebase/`, Architecture Book rules and ADRs,
  `openapi/openapi.json`, `mobile/src/api/generated/`, server migrations, credentials/certificates,
  Terraform/Kubernetes, deploy behavior, production data, dependencies, background operations, and
  legacy Flutter are out of scope.
- No human-only credential, device-install, or console-registration step is introduced, so no
  `(HUMAN: ...)` migration-inbox note applies.
