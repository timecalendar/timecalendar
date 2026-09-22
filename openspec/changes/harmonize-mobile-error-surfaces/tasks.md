## 1. Shared presentation and platform contract

- [x] 1.1 Complete iOS/Android research, inventory all mobile errors, and record design/spec/ownership and exclusions.
- [x] 1.2 Implement FieldError, ErrorNotice, ErrorState, ErrorTextAction and ErrorAction using provider-independent shared primitives with compact headings, error tokens, platform symbols and action sizing/feedback.
- [x] 1.3 Centralize iOS/native announcements and Android live regions; test message changes, rerenders, platform semantics, busy actions, action hierarchy, long text and contrast pairs.

## 2. Import and guide migration

- [x] 2.1 Replace QR error with visible title/body, primary Retry and secondary Change method; route back to existing chooser and update controller/navigation tests and active import spec.
- [x] 2.2 Move iCal operation notice above sole filled Import, use quiet Report and field-adjacent validation; preserve checkpoint/input/report behavior.
- [x] 2.3 Migrate import-result and blocked guides to ErrorState; keep success and event-sync semantics; adapt instructional-image failure while preserving alt text/caption.

## 3. Lists and sync

- [x] 3.1 Migrate school/group unavailable and cached errors plus group selection guard, preserving loading/empty/search/selection behavior.
- [x] 3.2 Migrate Home/Calendar sync notices without hiding events and Activity initial/cached/pagination errors with correct retry targets and loading exclusion.

## 4. Forms and local writes

- [x] 4.1 Migrate institution/programme, personal-event and feedback field errors; position feedback operation notice without adding a second submit.
- [x] 4.2 Migrate all remaining WriteErrorNotice consumers (calendar list, hidden events, event details, checklist, personal-event actions) and development import failures. Remove the obsolete component after the inventory is clear.

## 5. Native settings and startup

- [x] 5.1 Add native settings error presentation behind chrome; migrate About/notification failures and remove duplicate announcements while retaining non-error status.
- [x] 5.2 Distinguish rename validation from save failure in native adapters; preserve native buffers, keyboard and Cancel/Save behavior; align numeric validation.
- [x] 5.3 Migrate pre-navigation environment failure to provider-independent themed ErrorState with separate progress and safe retry.

## 6. Verification and delivery

- [x] 6.1 Run focused consumer/component/native adapter tests as each batch changes; review the completed inventory and remove unused styles/translations.
- [x] 6.2 Verify full test coverage, typecheck, lint/format, React Doctor and strict OpenSpec validation; inspect final diffs and preserve earlier branch fixes.
- [x] 6.3 Verify live iOS and Android Metro bundles and backend health; document representative device QA for dark/light, large fonts, keyboard, screen readers, native dialogs and recovery navigation. Do not claim host mocks prove native rendering.

Verification note: React Doctor ran and reports 14 pre-existing findings in source unchanged from HEAD (including Activity/Feedback compiler try/finally, checklist draft synchronization and existing memoization). It is not a passing check; no diagnostic was suppressed. Device-only checks are recorded in docs/mobile/error-surfaces-qa.md.

Final automated result: 206 suites / 2,005 tests passed with coverage; typecheck, lint, strict validation of both active changes and git diff whitespace checks passed. iOS/Android Metro bundles returned successfully and API /health confirmed the database up. Startup scrolling received an additional 4-test focused pass. React Doctor limitation above remains.
