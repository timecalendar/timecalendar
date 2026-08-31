# Personal-event deletion confirmation device pass

> (HUMAN: run on physical iOS and Android development/preview builds. This checklist is
> pending and non-blocking on the no-KVM agent host; it must not gate TIM-439.)

- [ ] With VoiceOver on iOS, open an existing personal event and activate Delete. Initial
      focus moves into the native alert, and the alert title, permanence message, Cancel,
      and destructive Delete actions are announced clearly and in a useful order.
- [ ] With TalkBack on Android, repeat the flow. Focus stays in the native alert, and the
      title, permanence message, Cancel, and destructive Delete actions are announced
      clearly and in a useful order.
- [ ] On both platforms, the words and announced action semantics identify permanent event
      deletion without relying on the destructive action's color.
- [ ] VoiceOver accessibility escape dismisses the alert without deleting or navigating;
      the populated edit form remains open and Delete can open the alert again.
- [ ] Android hardware back and an outside tap, where the supported system presentation
      permits it, dismiss the alert without deleting or navigating; the populated edit form
      remains open and Delete can open the alert again.
- [ ] Cancel performs no write on both platforms. Return to the personal-events list and
      confirm the event remains, then reopen it and retry.
- [ ] Confirmed Delete exposes the underlying action as disabled while the write is pending,
      closes the form once on success, and leaves the populated form plus announced error
      visible on failure so a later retry can succeed.
- [ ] The confirmation uses the expected platform-native iOS and Android presentation,
      including native focus containment, cancel semantics, and destructive semantics.

Automated component coverage captures every alert callback and the shared Maestro flow
covers cancel-then-confirm against the device-local SQLite repository. The assistive-
technology, dismissal, announcement, and native-presentation checks above have not been run
on this host.
