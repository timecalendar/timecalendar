# Architectural decisions

ADRs explain current decisions that are costly to reverse. They are not release notes,
implementation diaries, or a place to record every feature choice. Keep each record short:
context, decision, consequences, and a concrete revisit condition. Amend an ADR when the
decision changes; use Git for its history.

## Active decisions

| ADR                                                   | Decision                                                              |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| [001](./001-sdk-target.md)                            | Use the latest stable Expo SDK at scaffold/upgrade time               |
| [002](./002-minimum-os.md)                            | Support iOS 16.4+ and Android API 24+                                 |
| [003](./003-coverage-threshold.md)                    | Require 90% logic and 70% global test coverage                        |
| [006](./006-eas-distribution.md)                      | Use fingerprint runtime versions and human-invoked EAS releases       |
| [007](./007-drop-web-target.md)                       | Ship iOS and Android only                                             |
| [011](./011-personal-event-storage.md)                | Store personal-event dates as UTC text and colors as hex text         |
| [013](./013-query-persister-and-policy.md)            | Persist TanStack Query through the MMKV seam                          |
| [014](./014-layered-feature-module-pattern.md)        | Organize features by explicit sublayers                               |
| [018](./018-user-calendar-storage.md)                 | Store durable calendar identities in SQLite                           |
| [019](./019-calendar-rendering-adopt-calendar-kit.md) | Use calendar-kit behind an owned seam                                 |
| [021](./021-calendar-event-storage-and-sync.md)       | Cache synced events in SQLite with transactional replacement          |
| [023](./023-hidden-events-storage.md)                 | Store hidden-event identities in MMKV and filter at the source seam   |
| [024](./024-event-checklist-storage-and-surfacing.md) | Persist checklists in SQLite and share event details                  |
| [026](./026-fcm-messaging-seam.md)                    | Keep native FCM behind the Firebase seam                              |
| [027](./027-fcm-subscription-registration.md)         | Treat local notification preferences as registration source of truth  |
| [028](./028-fcm-tap-routing.md)                       | Refetch on messages and navigate only on taps                         |
| [032](./032-calendar-kit-vendor-patch-live-anchor.md) | Patch calendar-kit's live scroll anchor                               |
| [033](./033-calendar-renderer-module-boundary.md)     | Own the calendar renderer boundary inside the calendar feature        |
| [034](./034-settings-third-tab-identity.md)           | Use Settings as the canonical third tab and secondary-destination hub |
| [035](./035-display-timezone-preference.md)           | Resolve the curated display-timezone preference at one seam           |
| [036](./036-native-onboarding-pager.md)               | Use the native pager bridge for onboarding                            |
| [037](./037-self-hosted-ota-runtime.md)               | Self-host signed OTA updates and apply them at foreground boundaries  |
| [038](./038-isolate-maestro-flow-lifecycles.md)       | Isolate each Maestro flow in a fresh CLI process                      |
| [039](./039-changelog-version-gating.md)              | Gate bundled Changelog releases with an integer                       |

## Superseded or completed records

ADRs 004, 005, 008–010, 012, 015–017, 020, 022, 025, and 029–031 remain as
short historical pointers because migration documents link to them. They should not be
copied as current guidance; the topical pages above are authoritative.

Use [TEMPLATE.md](./TEMPLATE.md) only when the decision meets this policy.
