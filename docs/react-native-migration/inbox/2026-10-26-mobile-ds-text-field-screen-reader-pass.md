**For:** whoever runs screen-reader passes on iOS and Android (OpenSpec `mobile-ds-text-field`; a
real VoiceOver and TalkBack session needs a person on a device).

# TextField and DateTimeField: VoiceOver and TalkBack pass

## What I need

A real VoiceOver (iOS) and TalkBack (Android) pass, in French, on a development build of
`feat/mobile-ds-text-field`, at the default text size and at the largest text size (iOS
`accessibility-extra-extra-extra-large`, Android font scale 2.0):

1. **Label, value, hint order.** Open `timecalendar-dev://developer/gallery/text-field--helper`
   and `text-field--error`. Focusing the input reads its label, its value, then the hint (error,
   then helper). The helper text is not a separate stop. The visible label is a text stop before
   the field.
2. **Error announced once.** In `text-field--error`, press the toggle: the error is spoken once.
   Type in the field while the error stays: nothing is re-spoken. Toggle off and on: spoken once
   again. Repeat on the feedback screen by submitting an invalid email, then typing.
3. **Disabled.** `text-field--disabled` reads as dimmed/disabled and does not open the keyboard.
4. **Keyboard.** `text-field--keyboard`: Next on the email field moves focus to the second field
   and the keyboard stays up; on iOS the clear button appears while editing and VoiceOver names it.
5. **Android date-time field.** `date-time-field--default` and the personal-event form: the row
   reads "<label>, <value>, button"; after committing a new date and time through both dialogs,
   the reading contains the new value. `date-time-field--error`: the hint carries the error.
6. **iOS date-time field error.** `date-time-field--error` on iOS: the error is spoken when it
   appears and is the next stop after the picker (the SwiftUI picker takes no hint).
7. **iOS date-time field name (known gap).** VoiceOver names the picker "Date and Time Picker":
   `@expo/ui`'s `DateTimePicker` takes no label, so the field's label is a separate text stop
   before it and is not part of the picker's name. Verify the label stop is read directly before
   the picker and that the pair is understandable; record whether the generic name is acceptable
   or needs an `@expo/ui` label prop.
8. **Large text.** At the largest size, `text-field--long-strings` and
   `date-time-field--long-strings`: label, input text, helper and error wrap without clipping; the
   multiline field shows at least four lines.

## Why

Jest proves declared semantics (label, hint string, disabled state, announcer calls). It cannot
prove speech order, duplicate speech, how TalkBack delivers an `EditText` hint across Android
versions, or how the iOS compact date picker is read. The planning agent cannot operate a screen
reader.

## How to verify

Record each numbered item here as pass or fail per platform, with the OS version. A failure is
fixed in `mobile/src/design/field/text-field.tsx` or `mobile/src/design/field/date-time-field.tsx`
and re-checked, or stays listed here with the reason.

## Blocks

Nothing. The screen-reader task of `mobile-ds-text-field` closes when items 1–8 pass on both
platforms.
