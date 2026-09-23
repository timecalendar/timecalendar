# Error surface QA

Implementation plan: [design](../../openspec/changes/harmonize-mobile-error-surfaces/design.md), [tasks](../../openspec/changes/harmonize-mobile-error-surfaces/tasks.md).

Use the existing development build on iOS and Android. Metro is served at `http://100.106.44.20:8081` and the API at `http://100.106.44.20:3005` over Tailscale. No native rebuild is required by this change.

- [ ] **QR failure:** scan a valid calendar URL that fails import. A visible heading and explanation replace the camera. There are exactly two recovery controls: filled Retry and quiet Change method. Retry uses the same attempt; rapid taps do not duplicate creation. Change method opens the chooser; selecting iCal opens its input directly and preserves institution/programme/guide completion. Back returns to the chooser. Selecting QR starts a fresh scanner.
- [ ] **Invalid QR:** scan a non-calendar code. Readable guidance appears on an opaque surface over the camera. Another scan still works.
- [ ] **iCal:** invalid input shows an error beside the field. A failed valid import retains the URL and shows its explanation before one filled Import button, with Report as a quiet link inside the error notice. Import retries and Report preserves the failed attempt context.
- [ ] **Guide/result:** go back from the chooser and advance again; Next remains enabled. Failed guide loading and event synchronization show a clear recovery action. An unavailable guide image retains its alternate text/caption. Success and empty calendars remain successful.
- [ ] **Lists/sync:** fail a refresh on Home, Calendar, Activity and school/group selection with cached data. Existing data/search/selection remain visible. Fail initial loading with no data: show the full error. Retry the appropriate request; group Confirm is absent without groups.
- [ ] **Forms/writes:** trigger validation and failed saves in feedback, personal events, rename, checklist, calendar removal and hidden-event restore. Input stays intact, validation stays beside its field, and failed operations have readable notices without duplicate submit controls.
- [ ] **Native settings/startup:** exercise an About link failure, notification sync failure, invalid rename/numeric draft and failed environment initialization. Native dialogs retain their buffers and Cancel/Save controls. Only invalid input receives invalid-field styling; progress is not an error.
- [ ] **Accessibility:** repeat representative form, QR, cached-list and native-dialog errors in light/dark mode, with the largest text size and keyboard open. Text/actions remain reachable and do not clip. VoiceOver announces new/changed errors once; TalkBack uses polite live updates. Actions remain individually focusable with 44pt/48dp minimum targets.

Automated rendering tests check semantics and behavior. Physical-device visual layout, native navigation and screen-reader timing remain manual checks; they have not been asserted by host mocks.
