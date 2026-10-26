**For:** whoever runs the device passes (real VoiceOver and TalkBack need a physical device and a
person listening; the simulator has no VoiceOver and the agent cannot judge announcements).

# Button family: real screen-reader pass

## What I need

On a development build of `feat/mobile-ds-button-family`, with VoiceOver on an iPhone and
TalkBack on an Android phone, both in French:

1. Open `timecalendar-dev://developer/gallery/button--filled` and swipe through every button.
   Each enabled button announces its label and "button". Each disabled one adds "dimmed" (iOS) or
   "disabled" (Android). Each busy one keeps its label (not "loading" or silence), is announced
   as dimmed/disabled, and the spinner is never a separate stop.
2. Repeat on `button--outlined`, `button--text`, `button--destructive` and `button--icons`: no
   icon is a separate stop, and the size/state suffix in each label tells the buttons apart.
3. Personal-event form (edit an existing event): Save while saving and Delete while deleting
   announce busy with their labels.
4. Onboarding connect step with a listed school: the intranet control announces "link".

## Why

The Jest matrix proves the declared role, label and `accessibilityState`, not what VoiceOver and
TalkBack actually speak (ADR 064, accessibility.md → Device accessibility recipe).

## How to verify

Every item above behaves as described. Record the result in the PR or in a follow-up note;
anything that reads wrong goes in a new inbox note with the story id.

## Blocks

Nothing; the change merges on CI and the simulator pass. This closes task 9.4 of
`openspec/changes/add-mobile-ds-button/tasks.md`.
