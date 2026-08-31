## Why

A valid calendar QR currently locks the scanner before the shared create/resolve/persist operation runs, but a rejection only renders an error. The scanner remains locked with no recovery control until the screen unmounts, leaving students stuck after a backend or network failure.

## What Changes

- Keep valid scans debounced while an import is in flight and while its failure state is visible.
- Capture the normalized calendar URL for the current attempt and offer explicit localized actions to retry that URL or deliberately re-arm the camera for another QR.
- Reuse the existing add-calendar success seam so retry and new-scan success clear the Stack-scoped import draft and leave the journey exactly once.
- Preserve the institution/programme draft through every rejected attempt and while switching to the existing manual iCal URL route.
- Record each rejected real import attempt exactly once through the existing Firebase seam with constant context and no URL/token metadata; keep invalid QR values as unrecorded recoverable noise.
- Extend deterministic component coverage for failed, retry, re-arm, navigation/unmount, and concurrency paths, and record the camera/accessibility/platform checks as a non-blocking physical-device inbox item.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `mobile-qr-scan`: make a failed valid-QR import explicitly recoverable without automatic rescans or concurrent duplicate requests.

## Impact

- Primary implementation: `mobile/src/features/calendar-sources/ui/qr-scan-screen.tsx` and its colocated component test.
- Localized UI: flat FR/EN keys in `mobile/src/i18n/locales/{en,fr}.json` for Retry, Scan another QR, and the manual iCal escape path where shown.
- Device evidence: a bounded `(HUMAN: ...)` note under `docs/react-native-migration/inbox/`; no new Maestro camera fixture or `run-e2e` label because the harness cannot inject a scan or serve a parseable import URL.
- Architecture guidance: update the Architecture Book only if implementation reveals a reusable current-state rule change; this leaf recovery behavior is expected to fit ADR 017, ADR 047, and the existing navigation/accessibility/testing/Firebase rules without a new ADR.
- Sensitive surfaces touched: none. The change must not modify `openapi/openapi.json`, generated API clients, server migrations, native/store/EAS/Firebase config, deploy/CI files, or legacy Flutter `app/`.
- No dependency, API contract, schema, camera permission, or durable/global-state change.
