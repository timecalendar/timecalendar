**For:** the owner of the server export-guide module. No human action is needed.

# Export-guide bootstrap silently stays empty when the server boots before migrations

`ExportGuideBootstrapService.onApplicationBootstrap`
(`server/src/modules/export-guide/services/export-guide-bootstrap.service.ts`) publishes the
initial catalogue only when the `school` table exists. On Postgres `42P01` it returns without a
retry or a log line. `ExportGuideCatalogueStore` loads its snapshot once, so a server that boots
on an unmigrated database keeps an empty catalogue for its whole lifetime, and every
`GET /schools`, `GET /schools/:id` and `POST /schools/search` fails with
`Export-guide snapshot unavailable` (500) until the process restarts.

This is what kept the mobile nightly Maestro lane red from 2026-09-13 to 2026-10-26 (Android run
40077031966: three `Export-guide snapshot unavailable` errors in the server log, app on "Could not
load schools"). `fix-e2e-server-seed-order` fixed the e2e harness by seeding before boot; the
server behaviour is unchanged.

Any other boot-before-migrate path hits the same trap: a local `npm run start` before
`db:init`, or a deployment whose migrations run after the new pod starts. Candidates: log a
warning and retry the initial publish on the first request that needs the snapshot, or fail
`/health` while no catalogue is active so orchestration restarts the pod. Neither is decided.

## Related gaps found by the same investigation

- **Asset-origin contract has no cross-package gate.** The mobile parser accepts guide images only
  from `EXPORT_GUIDE_ASSET_ORIGINS` (`mobile/src/features/export-guides/data/constants.ts`, the dev
  bucket only). The server serves them from `S3_PUBLIC_BUCKET_CLIENT_URL`. `test-env.test.ts`
  pins test == development on the server side only; a change to the mobile constant alone turns
  every guide load into `invalid_generic` again, and only the nightly lane notices.
- **Production origin is not in the allow-list.** A release build talking to a server whose
  `S3_PUBLIC_BUCKET_CLIENT_URL` is not the dev bucket rejects the whole catalogue and blocks
  onboarding at the export guide. The production value lives in the platform repo, not here, so
  this was not verified. Decide the production origin (or a per-variant compiled list) before the
  v4 cutover.
- **Stale local catalogues.** `server/export-guide-catalogues/` is cwd-relative, shared by dev and
  test, and not in `server/.dockerignore`, so a catalogue published under another origin survives
  restarts and can be copied into a locally built e2e image. The bootstrap skips publishing when a
  catalogue is already active. CI starts clean.
- **Android keyboard inset is unverified on a real device.** `KeyboardSafeActionLayout`
  hid its action behind the keyboard on the CI emulator (API 34, run 40258402156 step 036 and run
  40261770615 `personal-event-save`). On Android it no longer uses `KeyboardAvoidingView` (whose
  hide event reads a height as a window Y and left the action raised over a blank strip after the
  keyboard closed); it pads the action region by the keyboard's overlap with the owner, computed in
  window coordinates on `keyboardDidShow` and reset on `keyboardDidHide`. #381 (`28ddeaf1`) had
  reported the opposite symptom (action "below the keyboard edge"), on a device not recorded in the
  commit. On the OnePlus 6 (Android 11) and an Android 15+ device, open the keyboard on add-by-URL,
  the personal-event editor and onboarding programme/institution: Submit/Save/Continue must sit
  right above it. Then close the keyboard: the action must return to the bottom edge with no blank
  strip beneath it.
