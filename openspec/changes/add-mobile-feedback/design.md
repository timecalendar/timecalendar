# Design — mobile feedback and iCal failure reporting

## Context

Flutter exposes one Suggestions form from Profile and from its failed iCal-import dialog. React Native already has the required generated `POST /contact` operation, a durable public `useUserCalendars()` read whose `id` is the server calendar ID, `expo-device`, `expo-constants`, the `@/storage` and `@/firebase` seams, and established thin-route, typed-i18n, accessible-status, and generated-mutation test patterns. What is missing is the feature boundary and the two live entry points.

The current iCal URL screen separates client validation (`errorKey`) from a recorded create/resolve/persist failure (`isError`). That distinction is the privacy and UX boundary for the report action: invalid input never becomes a report prompt, while a real failed server-side operation can carry the attempted URL and any already-selected school identity into `/feedback`.

The existing API, database, and native configuration are sufficient. `openapi/openapi.json`, generated sources, server code, SQLite schema/migrations, `mobile/app.config.ts`, EAS/Firebase configuration, and Flutter remain unchanged.

## Goals / Non-Goals

**Goals:**

- Ship a root feedback route and layered feature module with Flutter-parity fields, validation, async states, and success/failure behavior.
- Enrich each contact request with every held calendar server ID and stable device/app/build/variant information.
- Retain a validated last-used e-mail without retaining the message.
- Expose the form from Settings and only from the recorded iCal failure state.
- Keep route and telemetry payloads minimal, typed, and body-free.
- Prove behavior at the data, UI, Settings/iCal integration, and no-network Maestro levels.

**Non-Goals:**

- Subject/category UI, `gradeName`, attachments, screenshots, or message drafts.
- Changes to `/contact`, its DTO, generated code, server behavior, or database schema.
- Profile/About/Changelog/activity/grades work from other Phase 07 steps.
- Reporting the local invalid-URL prefilter as an operational failure.

## Decision 1 — A layered `feedback` feature owns validation, persistence, enrichment, and contact mutation

Create `mobile/src/features/feedback/` with focused data/form utilities and a tested `ui/feedback-screen.tsx`, exported through sublayer and feature barrels. The data layer is the only feedback code that imports the generated contact hook. It accepts a small domain submission input and constructs `SendMessageDto`; the UI composes public `useUserCalendars()` data and route context without reading SQLite or generated types.

The pure form validator trims the e-mail for validation/sending, rejects empty or whitespace-only messages, and returns typed localizable error keys. The e-mail rule mirrors Flutter's practical contract (one non-space/non-`@` local part, `@`, and a dotted domain) without attempting full RFC mailbox parsing.

*Alternative rejected*: put the generated mutation, validation, device reads, and storage calls in the screen. That would bypass the repository's data-only generated-client rule and make the 90% logic gate harder to prove.

## Decision 2 — Remember only a normalized, valid e-mail through a total feature store

Use one flat key such as `feedback.lastEmail` through `@/storage`. `parseRememberedEmail(raw)` returns a trimmed valid address or `""` for missing, whitespace, malformed, corrupt, or legacy values. The screen initializes from this read and writes the normalized address once client validation passes, before attempting the request, so a transient server failure or navigation away does not discard valid user input. The message is never persisted.

*Alternative rejected*: save only after server success. “Last used” describes valid user input, and tying local convenience state to mail delivery would lose it precisely on retryable failures.

## Decision 3 — The feedback data seam builds one privacy-bounded DTO

`useSendFeedback()` wraps the real generated `useContactControllerSendMessage` mutation. For each submission it builds:

- normalized `email` and message;
- `calendarIds` from every `useUserCalendars()` row's `id`, regardless of visibility;
- `deviceInfo` from `expo-device` model/OS/version plus `expo-constants` app name/version/build and `extra.appVariant`, with deterministic fallbacks;
- optional `calendarUrl`, `schoolId`, and `schoolName` copied only from validated route context.

It never includes `gradeName`, a subject, or any field not in `SendMessageDto`. Failure calls `recordUnknownError(error, "feedback/contact-submit")` with a static breadcrumb only; neither telemetry context nor metadata includes the e-mail or message. The inline UI remains enabled after pending clears so the same content can be retried.

*Alternative rejected*: call the generated `contactControllerSendMessage` function directly from UI. The generated mutation hook matches existing query/runtime and test conventions and keeps request construction behind the feature data seam.

## Decision 4 — Root route parameters are the optional DTO context, not navigation state

`mobile/src/app/feedback.tsx` is a thin re-export, registered as a header-capable root Stack sibling. The screen reads only optional `calendarUrl`, `schoolId`, and `schoolName` search parameters. There is no `fromFailedIcalImport` boolean, serialized calendar object, message/e-mail content, or grade context. Settings opens `/feedback` with no params.

On a recorded iCal failure, the report action uses an Expo Router object href so values are encoded. It passes the trimmed attempted URL and, when available, the persisted selected school ID plus its name resolved from the public school-selection query result. If the selection or name is unavailable, it omits that field; reporting remains available. Merely having an old selected school does not change import behavior—it only enriches the explicit failure report.

*Alternative rejected*: let Feedback read iCal or school stores globally. Explicit DTO-shaped route context keeps the feedback module reusable, removes hidden coupling, and ensures Settings reports contain no stale import data.

## Decision 5 — Only the existing recorded iCal failure state offers reporting

The iCal screen renders “Report a problem” alongside Retry only when `useAddCalendar().isError` is true after the valid URL reached the create/resolve/persist chain. The separate `errorKey` prefilter branch remains validation-only and never renders the report action. Tests must assert both halves, including exact encoded route parameters and omission of absent school fields.

*Alternative rejected*: show reporting for every invalid URL. That creates noisy support messages for client-correctable input and contradicts the existing observability boundary.

## Decision 6 — Native form behavior and deterministic success/failure UX

The feedback screen uses a keyboard-aware scroll container and RN text inputs. The e-mail input uses the e-mail keyboard, `returnKeyType="next"`, and focuses the multiline message input; the message accepts multiple lines without treating Return as submit. Labels are visible and exposed as accessibility labels. Title/intro use `ThemedText`, with the title inheriting the heading role.

Submitting invalid data shows field-specific inline errors and never calls `/contact`. Pending disables duplicate submission and exposes a polite loading state. Success opens one native `Alert` with localized title/body and one Close action whose handler calls `router.back()`. Failure shows a localized `alert`/polite live-region message, retains form contents, and leaves Send available for retry.

*Alternative rejected*: snackbar/toast success or immediate navigation. The required native alert makes successful delivery unambiguous and gives assistive-technology users an explicit close action.

## Decision 7 — Tests stop at client validation in Maestro

The data-layer test mocks `@/api/mutator` while exercising the real generated contact mutation and a real QueryClient; it asserts the complete DTO and failure behavior. Pure tests cover validation, remembered-email parsing, and device-info formatting. UI tests mock the feature data hook and public cross-feature hooks to cover focus, validation, pending, success, telemetry, and retry. Settings and iCal screen tests prove both entry points.

The Maestro flow starts from Settings, opens Feedback, submits empty fields, and asserts localized validation text. It never fills a valid form and therefore can never call the real `/contact` endpoint, which sends an e-mail. CI native proof uses the repository's on-demand mobile E2E workflow; this KVM-less host does not gain a `run-e2e` label merely to run a simulator. A `(HUMAN: …)` inbox note records the iOS/Android keyboard, dynamic-type, screen-reader, dark-mode, success/failure, and iCal-context device pass without blocking merge.

## Risks / Trade-offs

- [A request could accidentally leak body content into telemetry] → keep the Crashlytics breadcrumb static, never attach DTO fields, and test the exact `recordUnknownError` call.
- [Route parameters can be arrays or malformed external deep-link values] → normalize each search param to one bounded string or omit it before DTO construction; never trust arbitrary objects.
- [School name may not be available when the import fails] → school context is optional; pass the selected ID independently and add the name only when the public query resolves a match.
- [A duplicate tap could send two e-mails] → disable Send while pending and assert the pending accessibility state.
- [Device/app metadata differs between Expo runtimes] → centralize formatting with explicit fallbacks and unit-test iOS/Android/missing-field shapes.
- [Maestro accidentally sends real mail] → exercise only empty-form validation and assert the validation errors; do not enter valid values or tap a valid submission.
- [Native keyboard, Alert, and screen-reader behavior cannot be proven on this host] → record the required human device checklist as non-blocking and rely on CI for the deterministic Maestro route/validation proof.

## Migration Plan

This is additive and requires no data or server migration. Ship the route, feature, entry points, translations, tests, and documentation together. Rollback removes those additions; the optional `feedback.lastEmail` MMKV value is harmless if left behind and total parsing makes forward/backward versions safe.

## Open Questions

None. Product and privacy decisions are fixed by the issue brief; no ADR is warranted because no binding architecture rule changes.
