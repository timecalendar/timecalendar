## 1. Pure ADE window policy

- [ ] 1.1 Add a pure UTC calendar-date helper with named 12-month past/future bounds,
  `yyyy-MM-dd` output, end-of-month clamping, and an injectable current date; verify ordinary,
  year-boundary, and 29-February cases in its focused Jest suite.
- [ ] 1.2 Add the structural ADE iCal URL renamer using `URL`/`URLSearchParams`; verify
  supported anonymous/direct endpoints, explicit pairs in any order, `nbWeeks`, duplicate
  date canonicalization, non-date parameter/fragment preservation, invalid/lookalike/UI
  no-ops, and incomplete-pair no-ops.
- [ ] 1.3 Replace the generic 2000–2038 `nbWeeks` expansion with webcal conversion followed
  by the bounded ADE renamer; verify the legacy range is no longer emitted.

## 2. Strategy composition and sync behavior

- [ ] 2.1 Make `FetchService` apply the generic strategy exactly once when no school strategy
  matches while preserving the existing non-generic fallback renamers; extend the focused
  service tests to prove the transformation order and single clock sample.
- [ ] 2.2 Add real registered-strategy regression cases for generic/unmatched ADE,
  Université Bourgogne's generic opt-out, Savoie Mont Blanc's half-pair repair,
  St-Étienne's project rewrite, and Lyon 1's inherited date normalization.
- [ ] 2.3 Extend calendar-sync service coverage through the real URL-transformation seam to
  prove creation uses a current pair, a later due sync recomputes it, non-date source fields
  survive, and the original calendar URL remains stored.
- [ ] 2.4 Retain or extend the Lyon 1 batch-sync cadence proof: creation plus repeated sync
  requests within 60 minutes make one upstream fetch, and the first due request after the
  hour makes exactly one additional fetch with a freshly computed date pair.

## 3. Living documentation and QA record

- [ ] 3.1 Update `docs/mobile/architecture-book/calendar.md` at the sync boundary with the
  server's fetch-time ADE window contract, the 12-month retention implication, and the rule
  that normalized URLs are never persisted; verify the text points to the enforcing renamer
  and tests rather than duplicating implementation detail.
- [ ] 3.2 Create
  `docs/react-native-migration/inbox/2026-08-25-ade-export-window-device-pass.md`, tagged
  `(HUMAN: …)`, with a post-deploy real-device script that imports a legitimate expired or
  narrow ADE iCal URL, confirms current events load, and confirms a later refresh remains
  successful without requesting credentials in the PR.

## 4. Verification and CI proof

- [ ] 4.1 Run the focused renamer, fetch-service, representative-school, calendar-sync, and
  calendar-sync-all Jest suites from `server/`; record the exact command and passing counts
  in the PR/handoff as the deterministic CI proof used by `ci-build-deploy.yml`.
- [ ] 4.2 Run server local-green checks (`npm run build`, `npm run lint`, and `npm test --
  --runInBand`), confirm no unintended OpenAPI/generated-client diff, and resolve every
  failure in scope.
- [ ] 4.3 Run `openspec validate normalize-ade-export-date-windows` and confirm the final
  diff touches only server fetch/sync tests, the Architecture Book/inbox documentation, and
  this OpenSpec change—no OpenAPI, generated mobile API, migrations, deploy/native config,
  or legacy Flutter surfaces.
