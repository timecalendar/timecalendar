# Institution → programme → Connect → manual-import journey device pass

> (HUMAN: run on physical iOS and Android development/preview builds once the TIM-391 source change
> reaches a device-capable build. This checklist is **non-blocking** — the agent host has no KVM, so
> there is no emulator or simulator here, and the native E2E gate is not run for this change.)

Everything below is either a native-permission behaviour, an out-of-app navigation, or an assistive
technology / text-scaling behaviour. None of them can be proven by Jest or by Maestro on this host,
which is why they are here rather than in the suite.

## Camera permission (QR route)

- [ ] iOS: first entry to **Import your timetable → Scan QR code** shows the system camera prompt
      with the app's usage string. Allow → the viewfinder appears and a seeded QR imports.
- [ ] iOS: deny, leave, re-enter → the "open Settings" copy appears (not the grant button), and the
      Settings deep link lands on the app's own permission page.
- [ ] Android: the runtime permission dialog appears once; "Don't allow" twice reaches the
      can't-ask-again state and the same Settings path.
- [ ] Entering the QR route through the journey (not a deep link) still carries the institution and
      programme: the created calendar's row in **Mes calendriers** shows the programme name and the
      institution subtitle.

## External intranet link (Connect step)

- [ ] A school whose `intranetUrl` is HTTP(S) shows a button labelled with the institution name;
      tapping it opens the in-app browser at that URL and Back returns to Connect with the draft
      intact.
- [ ] A school with no `intranetUrl`, and the unlisted path, show the guidance copy with **no**
      button. (Non-HTTP(S) values are unit-proven; check only that no button appears if one is
      present in the live school data.)

## VoiceOver / TalkBack

- [ ] Programme step: focus order is title → helper → field label → field → Continue, with the
      trailing header **Skip** reachable and announced as "Skip naming your programme" on both
      platforms. Activating Skip from the screen reader continues to Connect.
- [ ] Inline validation (institution required, 101 characters) is **announced** when it appears, not
      only rendered — the polite live region fires on both platforms.
- [ ] Connect's external-link action announces that it leaves the app (the interpolated label names
      the institution).
- [ ] The manual-import step's two actions read as distinct buttons with their hints.

## Dynamic Type / font scale

- [ ] Largest iOS Dynamic Type and largest Android font size: the institution and programme fields,
      their labels, and the validation text do not clip or overlap, and the Continue button stays
      tappable.
- [ ] Every new control still meets 44pt (iOS) / 48dp (Android) at default and at the largest scale.

## Calendar-name fallback

- [ ] A calendar imported with the programme step **skipped** shows "Mon emploi du temps" /
      "My timetable" in **Mes calendriers** — and the delete confirmation names it the same way.
