---
kind: roadmap
status: approved
---

# Roadmap

## Sequencing principles

The approved P01–P04 outcomes and D01–D05 decisions are delivered through four complete work
items. The three epics group product outcomes; they are not extra implementation tickets.
Native controls, their data wiring, and their tests belong together. Size describes relative
implementation shape, not elapsed time. Owner-led visual acceptance has no separate ticket.

## Epic order and dependencies

| Epic | Demonstrable outcome | Tickets | Completion dependency |
| --- | --- | --- | --- |
| [E01](epics/E01-native-preferences/README.md) | Native hub, theme, and language | T01 | None |
| [E02](epics/E02-worldwide-timezones/README.md) | Offline worldwide zone search and manual memory | T03 | E01 native presentation contract |
| [E03](epics/E03-resilient-notification-settings/README.md) | Native notification choices and resilient saves | T05, T07 | E01 native presentation contract |

## Four implementation tickets

| Ticket | Complete result | Size | Confidence | Depends on |
| --- | --- | --- | --- | --- |
| [T01](epics/E01-native-preferences/T01-native-preferences.md) | Native hub, theme, language, and bounded locale refresh | L | medium | None |
| [T03](epics/E02-worldwide-timezones/T03-native-timezone-search.md) | Library-backed native zone search, persistence, and manual memory | L | medium | T01 |
| [T05](epics/E03-resilient-notification-settings/T05-reliable-notification-saves.md) | Durable notification saves, shared status, retries, and reset integration | L | medium | None |
| [T07](epics/E03-resilient-notification-settings/T07-native-notification-controls.md) | Native frequency, day presets, and custom-number entry | L | medium | T01, T05 |

Stable ticket IDs are intentionally nonconsecutive. Each ticket includes implementation,
relevant tests, and specification updates; those are not additional tickets.

## Why these boundaries

T01 proves native composition through theme, then reuses it for language in the same change.
T03 delivers the entire time-zone chooser, including its maintained catalog and preference
wiring. T05 makes reliable saves observable on the existing notification screen, independently
of native layout. T07 delivers the complete notification UI using that shared save contract.

Reliability warrants its own ticket because it changes request ownership, persistence, and
recovery across app lifecycles. It has a distinct failure model from native controls and can
be reviewed and verified without the visual redesign. A dormant engine, a catalog without
its chooser, or separate tickets for neighboring preference controls add no necessary release
boundary here.

All four are bounded L changes with existing APIs and data models. Internal implementation
steps should remain inside the ticket unless concrete implementation evidence reveals a
separately reviewable result or invalidates the approved scope. Ticket count is not an effort
estimate; reducing handoffs does not remove native integration or reliability work.

## Execution order and independent work

Start T01 to prove forms, navigation, scrolling, and theme behavior. T05 can proceed
independently on the existing notification screen. T03 needs T01's presentation contract;
T07 needs T01 and T05. E02 and E03 do not depend on each other. Catalog investigation can
happen early within T03 without requiring a separate ticket.

Root layout, storage classification, preference barrels, and chrome exports/mocks are shared
edit sites. Coordinate integration and revalidate changed contracts. Fleet dispatch consumes
these canonical documents through the separate Paperclip workflow.

## Verification convention

Every implementation ticket runs tests after editing them. There is no Makefile. From
`mobile/`, use focused Jest runs during development, then `npx tsc --noEmit`, `npm run lint`,
and `npm test -- --coverage`, plus applicable checks from `.github/workflows/ci-mobile.yml`.
Follow `mobile/AGENTS.md` and SDK 56 docs before implementation. New native imports need
native-boundary mocks, which cannot prove rendering. Follow the existing native harness
policy rather than mechanically restoring removed smoke flows.

## Rollout gates

- Current main matches the recorded work-site assumptions; reconcile drift before execution.
- Existing routes, saved values, fixed 19:00 Paris scheduling, and custom 1..30 values survive.
- Owner reviews native phone/tablet layouts, both languages/themes, app/device theme mismatch,
  large text, keyboard, cancellation/Back, and accessibility before release. No QA ticket.
- Automated evidence covers persistence, request races, restart, reset, and time-zone integrity.
- Native dependency/config changes follow existing runtime/build compatibility rules. Older
  ten-zone builds cannot represent new choices; prefer compatible repair over destructive rollback.
- Permission lifecycle and OS app-language migration remain deferred, not represented as solved.

## Replanning notes

Ticket decomposition may change within approved outcomes, epic boundaries, and decisions.
Changing a boundary, requiring a locale bridge or server revision protocol, or substituting
custom platform replicas requires decision review. No ticket is low-confidence; the primary
medium-confidence risks are T01/T03 native integration and T05 runtime lifecycle behavior.
