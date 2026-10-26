**For:** whoever runs screen-reader passes on iOS and Android (OpenSpec `mobile-ds-status-view`).

# StatusView and field-error hints: VoiceOver and TalkBack pass

## What I need

A real VoiceOver (iOS) and TalkBack (Android) pass, in French, on a development build of
`feat/mobile-ds-status-view`, at the default text size and at the largest text size:

1. **Announcement once on appearance.** Open each story with
   `timecalendar-dev://developer/gallery/<id>`: `status-view--loading-screen`,
   `status-view--empty-screen-artwork`, `status-view--error-screen`,
   `status-view--error-retry-busy`, `status-view--long-strings`. Each state is spoken once when
   it appears (iOS: title, then caption; Android: through the polite live region), not twice.
2. **No re-announcement while typing.** On the school picker and the timezone chooser, type a
   query with no match, then keep typing: the no-results state is spoken when it appears and not
   on every keystroke on iOS. Record what TalkBack does (the polite live region may re-speak a
   changed title).
3. **Roles.** Empty and error titles are reachable through heading navigation (VoiceOver rotor
   Headings, TalkBack heading navigation). A loading state is one stop that reads its title and
   a busy/in-progress state; the spinner is not a separate stop. Retry reads as a button and,
   while busy, as dimmed/busy.
4. **Field errors from the field.** On `error-surfaces--field-error`, and on the feedback screen
   after submitting an invalid email: focusing the field reads its label, its value, then the
   error (iOS hint; Android hint). Clearing the error removes it from the field's reading.

## Why

Jest proves declared semantics (roles, `busy`, the hint string, announcer calls). It cannot prove
announcement timing, duplicate speech, or how TalkBack delivers a `TextInput` hint across Android
versions. The planning agent cannot operate a screen reader.

## How to verify

Each numbered item is recorded here as pass or fail per platform, with the Android version. A
failure is fixed in `src/design/status/status-view.tsx`, `src/hooks/use-error-announcement.ts` or
`src/design/status/field-error-hint.ts` and re-checked, or stays listed here with the reason.

## Blocks

Nothing. Task 10.4 of `mobile-ds-status-view` closes when items 1–4 pass on both platforms.
