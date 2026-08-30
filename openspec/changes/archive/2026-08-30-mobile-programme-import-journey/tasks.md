# Tasks — React Native institution, programme, Connect and manual QR/iCal import journey

> Preconditions, verify before starting:
> - `git log origin/main -1` includes the merged server contract (#313). The generated client must
>   already carry `CreateCalendarDto.name` (`@maxLength 100`), `SendMessageDto.calendarName`, and
>   `SchoolForList.intranetUrl`. **Do not regenerate `mobile/src/api/generated/` or
>   `openapi/openapi.json`** — they are owned by the server ticket.
> - No file under `app/` may change. The two Flutter screens named in the design are read-only
>   behavioural references.
> - Run `openspec validate mobile-programme-import-journey --strict` and dry-run the archive
>   **early** (task 10.1), not at the end — only `openspec archive` validates delta headers.
> - Jest note: this worktree's directory name contains the ticket id, so a bare
>   `npx jest <module>` pattern matches the whole path and runs the entire suite. Use an explicit
>   path (`npx jest src/features/onboarding`) with `--maxWorkers=4`.

## 1. The ephemeral import draft (design D1, D2, D3)

- [x] 1.1 Add `intranetUrl: string | null` to `SchoolListItem` in
      `mobile/src/features/school-selection/data/types.ts` and project it in
      `data/queries.ts#toSchoolListItem`; update `queries.test.ts` to assert the field survives the
      projection (including the `null` case)
- [x] 1.2 Create `mobile/src/features/onboarding/draft/types.ts`: `ImportInstitution`,
      `CalendarImportDraft`, `normalizeImportName(raw)`, `NAME_MAX_LENGTH = 100`, and
      `safeIntranetUrl(raw)` (HTTP(S) only — `null` for absent/empty/unparseable/`javascript:`/`file:`)
- [x] 1.3 Create `draft/context.tsx`: `ImportDraftProvider` + `useImportDraft()` exposing
      `{ draft, setListedInstitution, setUnlistedInstitution, setCalendarName, clearDraft }`.
      `useImportDraft()` must be **total** — outside the provider it returns `draft: null` and
      no-op setters, never throwing (design D1 consequence)
- [x] 1.4 Add `useImportCreateFields()` (or an exported pure `toCreateFields(draft)`) deriving
      `CalendarImportFields` per the design D3 table; import the type from
      `@/features/calendar-sources/data` (the cross-feature `data/` sub-barrel — the edge
      `settings/data/summary.ts` already uses). **The onboarding feature must not import
      `@/features/calendar-sources` (top-level barrel)** — that would close a cycle
- [x] 1.5 Add `mobile/src/features/onboarding/draft/index.ts` and re-export the draft surface from
      `mobile/src/features/onboarding/index.ts`
- [x] 1.6 Unit tests: the derivation table (listed → `schoolId` present and `schoolName` key
      **absent**; unlisted → the inverse; `null` → `{ name: "", schoolName: "" }`),
      `normalizeImportName` (trim, Unicode, emoji, 100/101 boundary), `safeIntranetUrl`
      (http/https accepted; null/empty/whitespace/`javascript:`/`file:`/bare-hostname rejected),
      and the total no-provider read
- [x] 1.7 Verify: `npx jest src/features/onboarding src/features/school-selection --maxWorkers=4`

## 2. Routes and the provider mount

- [x] 2.1 Wrap the nested `Stack` in `mobile/src/app/onboarding/_layout.tsx` with
      `ImportDraftProvider` (import through `@/features/onboarding` — routes must not reach seams
      directly, boundary B-3)
- [x] 2.2 Add four thin routes, each a one-line re-export from `@/features/onboarding/ui`:
      `institution-name.tsx`, `programme.tsx`, `connect.tsx`, `import.tsx`. No colocated tests under
      `src/app/` (route-structure rule)
- [x] 2.3 Verify each new deep link resolves: `timecalendar-dev://onboarding/{institution-name,
      programme,connect,import}` (a Jest render of the route module plus a manual check is enough;
      the emulator pass belongs to the inbox note).
      **Applied: verified statically — `tsc` resolves each one-line re-export, and every
      `router.push("/onboarding/…")` target in `src/features/` has a matching file under
      `src/app/onboarding/`. The on-device deep-link pass is in the inbox note (no KVM here).**

## 3. Institution-name step (unlisted path)

- [x] 3.1 `features/onboarding/ui/institution-name-screen.tsx`: labelled `TextInput`, submit control,
      inline accessible validation (`accessibilityLiveRegion="polite"` + `accessibilityRole="alert"`),
      themed via `@/theme`, `MaxContentWidth` layout — mirror `ical-url-screen.tsx`'s shape
- [x] 3.2 Submit writes the `unlisted` draft, calls `clearSelection()` from
      `@/features/school-selection`, and pushes `/onboarding/programme`
- [x] 3.3 Repoint `MissingSchoolAction` in `school-picker-screen.tsx` from `/onboarding/ical-url` to
      `/onboarding/institution-name`; update its `accessibilityHint` copy and the screen's test
- [x] 3.4 Tests: empty and whitespace-only rejected (no draft, no navigation); 100 accepted / 101
      rejected on the trimmed value; a pre-existing persisted selection is cleared (assert
      `getSelection()` is `undefined` after submit)

## 4. Programme step (design D4, D5)

- [x] 4.1 `features/onboarding/ui/programme-screen.tsx`: `<Stack.Screen options={{ headerShown: true,
      … }}>` with the platform-split trailing Skip — iOS `unstable_headerRightItems`, Android
      `headerRight` `Pressable` (`minWidth`/`minHeight` 48, role + translated label). Copy the split
      already used for header-left in `school-picker-screen.tsx`
- [x] 4.2 Field: label `onboarding.programme.fieldLabel`, placeholder `L3 Informatique` (prop only,
      never persisted), trimmed, 100-character normalized maximum with inline accessible validation
- [x] 4.3 Continue (enabled only for a non-empty valid value) stores the normalized name and pushes
      `/onboarding/connect`; Skip stores `""` and pushes the same
- [x] 4.4 Tests: Continue stores the trimmed value; Skip stores `""`; Continue unavailable on empty;
      Unicode/emoji accepted; 100 accepted / 101 shows validation and does not navigate; the Skip
      control renders with a role, a translated label, and the platform minimum target — asserted on
      both `Platform.OS` values via `usePlatform` from `src/test-support/platform.ts`

## 5. Connect step (design D6)

- [x] 5.1 `features/onboarding/ui/connect-screen.tsx`: explanatory copy (Flutter
      `connect_screen.dart` behavioural parity — read only, do not edit), always-present Back and
      Continue; Continue pushes `/onboarding/import`
- [x] 5.2 External-link action rendered only when `safeIntranetUrl(draft.institution.school.intranetUrl)`
      is non-null; label = the institution name, `accessibilityLabel` = a translated interpolated
      string naming the action and the institution; opens via `WebBrowser.openBrowserAsync`
      (`expo-web-browser` is already a dependency, used from `ui/` in `about-screen.tsx`)
- [x] 5.3 Add a comment marking the Connect → manual-import edge as the future assistant insertion
      point, so a later project inserts there without touching the preceding screens
- [x] 5.4 Tests: link shown for `https:` and `http:`; no link for null / empty / whitespace /
      `javascript:` / `file:` / unparseable / any unlisted draft; Back and Continue always present

## 6. Manual-import step (design D7)

- [x] 6.1 `features/onboarding/ui/manual-import-screen.tsx`: explanatory copy (Flutter
      `import_ical_screen.dart` behavioural parity — read only), a "Scan QR code" action pushing
      `/onboarding/qr-scan`, and a "Paste an iCal link" action pushing `/onboarding/ical-url`
- [x] 6.2 Tests: both actions present and pushing the right routes; the screen contains no
      permission, validation, create, or retry logic

## 7. Creation and failure-report wiring (design D3, D7, D9)

- [x] 7.1 `calendar-sources/data/create.ts`: export `CalendarImportFields`; `createCalendar(url,
      fields)` builds the DTO with the trimmed `url`, `customData: null`, the normalized `name`, and
      **exactly one** of `schoolId` / `schoolName` (spread-conditional so the other key is absent, not
      `undefined`). Delete both `Dev import` literals and the `TEMP` comment
- [x] 7.2 `calendar-sources/data/user-calendars/add-calendar.ts`: `addCalendarFromUrl(url, fields)`
      forwards the fields; the create → resolve → upsert chain and its pending/error semantics are
      otherwise unchanged
- [x] 7.3 `qr-scan-screen.tsx`: read the derived fields from `@/features/onboarding`, pass them to
      `addCalendarFromUrl`; on success `clearDraft()` then leave the journey with a
      `router.canDismiss()`-guarded dismissal falling back to `router.back()`; on failure change
      nothing about the draft. Add no report affordance
- [x] 7.4 `ical-url-screen.tsx`: same create wiring and same success/failure draft handling; **remove**
      the `useSelectedSchool()` + `useSchools()` reads used for failure context and derive
      `schoolId` / `schoolName` / `calendarName` from the draft instead, omitting empty values
- [x] 7.5 `feedback`: accept a `calendarName` route parameter in `feedback-screen.tsx`, add it to
      `FeedbackContext` and `buildFeedbackDto` in `data/use-send-feedback.ts` (trimmed, omitted when
      empty). `gradeName` stays unsent
- [x] 7.6 Tests (`data/`, mocking `src/api/mutator` per `testing.md`): listed create body has
      `schoolId` and **no `schoolName` key**; unlisted has the inverse; skipped programme sends
      `name: ""`; a screen rendered with **no provider** creates with `{ name: "", schoolName: "" }`
      on both the QR and URL routes
- [x] 7.7 Tests (`ui/`): a failed import leaves the draft intact and the URL retryable; the report
      route carries `calendarName` when present and omits it when empty; `buildFeedbackDto` includes
      and omits `calendarName` correctly

## 8. Effective display name (design D8)

- [x] 8.1 `calendar-sources/data/effective-name.ts`: pure `effectiveCalendarName(stored): string | null`
      (trim, empty → `null`); export from the `data/` sub-barrel and the feature barrel
- [x] 8.2 `user-calendars-screen.tsx`: replace `calendar.name || t("userCalendars.namePlaceholder")`
      with `effectiveCalendarName(calendar.name) ?? t("userCalendars.nameFallback")`, and use the
      same derived value for the delete-confirmation label. **Touch nothing else on this screen** —
      the overflow menu and rename surfaces belong to Ticket 3
- [x] 8.3 Replace the `userCalendars.namePlaceholder` key with `userCalendars.nameFallback`
      ("My timetable" / "Mon emploi du temps") in both catalogs
- [x] 8.4 Tests: empty, whitespace-only, padded, normal, and >100-character stored names; the stored
      value is never mutated

## 9. i18n, Architecture Book, and the human-only note

- [x] 9.1 Add every new key to `mobile/src/i18n/locales/en.json` **and** `fr.json` under the
      `onboarding.institution.*`, `onboarding.programme.*`, `onboarding.connect.*`,
      `onboarding.import.*` prefixes, plus `userCalendars.nameFallback`; FR is the translation, EN is
      canonical. Parity is a `tsc` error, so run `npx tsc --noEmit` as the check
- [x] 9.2 `docs/mobile/architecture-book/navigation.md`: update the onboarding-group paragraph with
      the new routes, the draft provider on the layout, and the group step's off-path status; extend
      the `/feedback` paragraph's parameter list with `calendarName`
- [x] 9.3 `docs/mobile/architecture-book/features.md`: update the `onboarding` and `calendar-sources`
      rows, and the cross-feature contracts bullets for the draft handoff, the effective display
      name, and the feedback context
- [x] 9.4 Write `docs/mobile/architecture-book/decisions/047-ephemeral-calendar-import-draft.md`
      (context, decision, consequences, revisit condition) and add it to `decisions/README.md`.
      **Before committing, re-check the highest ADR number on `origin/main` and across open PRs** —
      044 is the current maximum on `main` and #317 claims 046; a rebase can move this
      — **re-checked during apply (2026-08-30): 044 was still the maximum on `main`, so this was
      authored as 045. RENUMBERED TO 047 during simplify, after merging `origin/main` at
      `b378adb8`: #317 landed and brought a `decisions/README.md` note reserving 045 for the
      open source-recovery PR (#273), which renumbers its own 044 to 045 on rebase. 046 is
      #317's, so 047 is the first free number. Re-check again at rebase.**
- [x] 9.5 Append a dated entry to `docs/mobile/architecture-book/CHANGELOG.md`
- [x] 9.6 Add `docs/react-native-migration/inbox/2026-08-30-import-journey-device-pass.md` tagged
      `(HUMAN: …)`: QR camera permission on both platforms, external intranet link behaviour,
      VoiceOver/TalkBack focus order and announcements for the Skip header action and inline
      validation, Dynamic Type on the programme and institution fields, and 44pt/48dp targets.
      Non-blocking — this host has no KVM

## 10. Verification and CI proof

- [x] 10.1 **Early:** `openspec validate mobile-programme-import-journey --strict`, then a dry-run of
      `openspec archive` to catch a MODIFIED/ADDED header error before the end of the change
- [x] 10.2 Extend `mobile/.maestro/onboarding.yaml` only where cheap and stable: after the school-step
      assertion, tap the seeded school and assert the programme step's title renders. Do **not** add
      camera or live-import steps. Note in the flow's header comment that `onboarding.yaml` and
      `ical-import.yaml` already reference selectors that no longer exist in the source
      (`onboarding-school-filter`, `onboarding-welcome-url-cta`) — a pre-existing red-on-`main`
      condition this change does not fix and is not gated on.
      **Applied: the new steps are appended at the END of the flow, after the (already broken)
      search steps, so the existing search proof keeps its ordering for whoever repairs it.**
- [x] 10.3 `cd mobile && npx tsc --noEmit && npm run lint && npm test -- --coverage` — all green,
      90% logic / 70% global thresholds met
- [x] 10.4 `git diff --stat origin/main -- app/` is empty (no Flutter file changed) and
      `git diff --stat origin/main -- mobile/src/api/generated openapi/` is empty (contract untouched)
- [x] 10.5 Update the PR body's stage line and its Affected/Sensitive sections if the shape of the
      feature moved during apply
