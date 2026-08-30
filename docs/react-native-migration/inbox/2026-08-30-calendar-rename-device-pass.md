# Calendar rename device pass

> (HUMAN: run on physical iOS and Android development/preview builds. This checklist is
> non-blocking on the no-KVM agent host and must not gate TIM-392.)

- [ ] The row's overflow trigger reads as one button on both platforms, meets 44pt iOS /
      48dp Android, and opens the native menu on press. Android's TalkBack `activate`
      action opens it without a gesture; iOS opens it natively.
- [ ] The menu carries exactly Rename and Delete, Delete rendered destructively, and no
      standalone trash affordance survives anywhere on Android.
- [ ] Rename opens the dialog with the current name already in the field and the keyboard
      up. Typing fast (or pasting) never drops characters.
- [ ] Save with the device offline: the dialog stays open, the typed text is still there,
      the error is announced by VoiceOver/TalkBack, and Retry reissues once connectivity
      returns. The row's old name never changes in the meantime.
- [ ] Clearing the field and saving leaves the row showing "My timetable" / "Mon emploi du
      temps" in the matching locale, on both platforms.
- [ ] Entering 101 characters disables Save and announces the inline limit message; exactly
      100 is accepted.
- [ ] Cancel and the Android hardware back both close the dialog with no write; a tap on the
      dimmed backdrop does NOT close it (typed text must survive a stray tap).
- [ ] VoiceOver focus is trapped in the dialog (the list behind it is unreachable) and the
      focus order is title → field → message → Cancel → Save.
- [ ] Largest Dynamic Type / font scale: the dialog's title, field, message and both buttons
      remain readable and unclipped.
- [ ] Rename on device A, then pull-to-sync on device B holding the same token: B shows the
      new name. If a calendar was hidden on B, it is STILL hidden afterwards — that is the
      no-full-upsert rule, and it is the one behavior only two devices can show.

`mobile/.maestro/user-calendar-rename.yaml` covers the rename round trip and the
server-convergence claim on one device; the assistive-technology, Dynamic Type, offline and
two-device checks above remain device-only.
