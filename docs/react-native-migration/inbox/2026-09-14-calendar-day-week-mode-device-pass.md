# (HUMAN: owner device verification) T05 Calendar Day/Week mode

## Testable revision and scope

Runtime revision: `b06a529b955f9c3e58e9b448ee8752e0d43889ff`.

Use the exact pull-request head containing that runtime revision for the installed development
build. Host automation proves deterministic mode/date transitions, one/five/seven-column geometry,
typed persistence and reset survival, stale-generation rejection, localized labels, retained
Agenda/details behavior, and the one-renderer ownership contract. It does not claim native drag,
restart, visible-hour, platform-menu, or assistive-technology results.

Agenda remains available, but its active-section date transfer is intentionally unchanged until
T18. Initial current-time positioning remains T08, and complete Today/direct-date intent remains
T17.

## Build and fabricated setup

- From `mobile/`, run `npm ci`, then `npm run ios` or `npm run android` with a supported device.
- Fully reload the development build and open Calendar on an empty fabricated week.
- Use `timecalendar-dev://calendar?focusDate=2026-09-18` for the weekend traversal case.
- In Settings > Calendar, turn Show weekends off before the Friday→Saturday→Sunday check.
- Use only fabricated data for retained Agenda and event-details checks.

The existing personal-event Maestro journey remains Agenda-focused and uses Agenda across a cold
restart. Adding a persisted Day/Week detour would change that journey's purpose and restart state,
so the focused host suites plus this owner checklist are the safer bounded proof. No fourth journey,
retry, or weakened selector was added.

## Environment record

- iOS device / OS / physical or simulator: pending owner entry; unavailable on this host.
- Android device / OS / physical or emulator: pending owner entry; unavailable on this host.
- Installed build kind and exact revision: pending owner entry.
- French/English language and text-size settings: pending owner entry.
- VoiceOver/TalkBack and reduced-motion settings: pending owner entry.

## Owner checklist

- [ ] Scroll the empty Week surface to an afternoon hour, switch Week→Day, and confirm Monday alone remains at the same visible hour.
- [ ] Move Day to another civil date, switch Day→Week, and confirm its containing Monday-first week appears at the same visible hour.
- [ ] Repeat Day↔Week several times and confirm there is no intermediate wrong date, mixed columns, or duplicate announcement.
- [ ] Select Day, fully restart the app, and confirm Day remains selected while the date follows the fresh-open rule and no old clock offset is restored.
- [ ] Begin a partial forward and backward page drag, switch mode before settlement, and confirm no old destination commits or announces.
- [ ] With Show weekends off, start on Friday 18 September 2026 and page Day through Saturday 19 and Sunday 20 before Monday; confirm every page has one column.
- [ ] Confirm Week still renders five columns with weekends hidden and seven with weekends shown, while both modes retain exactly three native pages.
- [ ] Check iOS and Android menus expose Day, Week, Agenda in that order and show the committed selection.
- [ ] With VoiceOver and TalkBack, confirm Day actions say previous/next day, Week actions say previous/next week, and each accepted page announces once.
- [ ] Repeat reduced-motion paging and a background/foreground interruption; confirm centered header/grid state and no obsolete announcement.
- [ ] Repeat the touched accepted interactions: Today, one-shot `focusDate`, Week/Agenda switching, Agenda refresh/retry, synced and personal details return, Add, device clock format, and Show weekends.

## Results and gate

- Checklist results / observations: pending owner entry.
- Focused retest build and revision after any finding: pending if required.
- Acceptance source and date: pending explicit owner acceptance of the exact tested pull-request head; no reply is not acceptance.
- Reviewer verdict and merged revision: pending after owner acceptance.

T06 remains ineligible until owner acceptance and the merged T05 revision are recorded through the
canonical delivery protocol.
