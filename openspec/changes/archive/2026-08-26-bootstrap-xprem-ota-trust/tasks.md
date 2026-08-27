## 1. Encode the xprem bootstrap contract

- [x] 1.1 Add the public app identity, database-key signing mode, certificate path/fingerprint,
      and single-trust-root rule to the canonical mobile distribution specification.
- [x] 1.2 Update the Architecture Book specification so current guidance records the completed
      public inputs without claiming downstream client wiring or publishing.

## 2. Reconcile reusable and operator guidance

- [x] 2.1 Update `docs/mobile/architecture-book/eas.md` and `CHANGELOG.md` with the deployed public
      inputs and the database-managed signing-key custody boundary.
- [x] 2.2 Replace `docs/mobile/ota/09-human-checklist.md` §3.1's external Expo key generation with
      the completed xprem database-key flow and explicit no-second-key guidance.
- [x] 2.3 Make the bootstrap record's earlier DNS/503 observations explicitly historical.

## 3. Verify and archive

- [x] 3.1 Confirm the committed PEM is public-only and retains the recorded fingerprint, and scan
      the branch diff for private-key or credential material.
- [x] 3.2 Format touched Markdown, run strict OpenSpec validation, and run `git diff --check`.
- [x] 3.3 Archive this completed change so its deltas update the canonical specifications.
