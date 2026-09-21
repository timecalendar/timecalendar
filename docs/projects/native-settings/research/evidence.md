# Evidence register

Observed 2026-09-21 against clean local main and origin/main at
`3e5c818e6ec5e2435c8c66750f2503ab85cbad0c`. This is a source/documentation investigation;
no native build, code experiment, permission change, or visual device pass was performed.

## Repository observations

Paths below are repository-relative and were checked against the stated revision.

| Area | Evidence | Consequence |
| --- | --- | --- |
| Platform requirements | `mobile/AGENTS.md`, `mobile/app.config.ts`, `docs/mobile/architecture-book/runtime.md` | SDK 56 documentation; iOS 16.4 / Android API 24; phone and tablet support |
| Native boundary | `mobile/src/components/chrome/expo-ui.tsx`, architecture decision 056 | Platform-specific controls stay in chrome; composed divergent controls are permitted |
| Settings | `mobile/src/features/settings/ui/appearance-settings-screen.tsx`, `timezone-settings-screen.tsx`, `settings-row.tsx`, `settings-section.tsx` | Menu pickers, shared decoration, and custom row contracts |
| Numeric input | `mobile/src/features/notifications/ui/notification-settings-screen.tsx` | Custom plus/minus controls; full 1..30 range |
| Existing iOS editor | `mobile/src/components/chrome/native-text-entry-dialog-ios.tsx` | Native fields inside a custom overlay; not a native sheet |
| Navigation | `mobile/src/app/_layout.tsx`, `mobile/src/components/root-page.tsx` | Existing destination URLs and explicit scroll/navigation ownership |
| Preferences | `mobile/src/features/settings/prefs/types.ts`, `store.ts`, `hooks.ts` | Ten-zone union; system/manual preference; no remembered manual zone |
| Language | `mobile/src/i18n/detect-locale.ts`, `index.ts`, settings prefs hooks | Startup/manual resolution; no app-lifetime i18next device-locale listener found |
| Sync | `mobile/src/features/notifications/data/subscription.ts`, `hooks.ts`, `registration.ts` | Separate mutation instances and repeated token listeners; full PUT with no revision |
| Reset | `mobile/src/features/environment/data/participants.ts`, `switch.ts`, `mobile/src/storage` | Notification runtime reset is currently no-op; new shared state needs participation |
| Transport | `mobile/src/api/mutator.ts`, `query-client.ts` | Request timeout/cancellation; query retry configuration does not establish mutation ordering |
| Schedule | `server/src/modules/notification-pipeline/jobs/drain-notifications.jobs.ts` | Immediate queue every five minutes; hourly on the hour; daily 19:00 Paris |
| Horizon | `server/src/modules/notification-pipeline/models/merge-calendar-changes.ts` | Filters calendar changes by event start horizon; not reminder scheduling |
| Permissions | `mobile/src/firebase/index.ts`, installed RN Firebase messaging native/JS sources | Android request helper is a no-op; status read exists; permission work is deferred under approved D04 |
| Zone server | `server/src/modules/shared/validators/is-iana-timezone.ts` | Named zones validated through server Intl; no ten-zone server restriction |
| Existing specs | `openspec/changes/mobile-timezone-preference/`, `openspec/specs/mobile-settings-screen/`, `mobile-i18n/` | Old curated/no-search and historical UI/location rules require reconciliation |
| Test policy | `mobile/package.json`, `mobile/e2e/README.md`, `.github/workflows` | Use relevant type/lint/Jest gates; do not mechanically restore removed smoke flows |

## External and installed-package evidence

- [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/) and installed package APIs establish
  native Form/Section, Compose ListItem/AlertDialog/RadioButton, and Router sheet support.
- [Expo Router toolbar](https://docs.expo.dev/router/advanced/stack-toolbar/) plus installed
  StackSearchBar/StackToolbarSearchBarSlot declarations establish native iOS 26 bottom search.
  SearchBarSlot is not an Android control. Actual sheet integration remains unverified.
- [Expo localization](https://docs.expo.dev/guides/localization/) and installed `useLocales`
  establish existing locale observation; OS per-app language integration is a separate concern.
- [@vvo/tzdb](https://github.com/vvo/tzdb): published package 6.198.0 was inspected in memory
  without installation. Its raw data has 315 display groups and common cities including
  Paris/Marseille/Lyon/Toulouse. It also exports raw zone names and deprecated aliases. Group
  count is not an assertion that only 315 distinct names exist. Its license is MIT.
- [date-fns-tz](https://github.com/marnusw/date-fns-tz): existing dependency uses Intl for
  time-zone conversion and localized names, including event-date daylight-saving behavior.
- [Unicode CLDR JSON](https://github.com/unicode-org/cldr-json): French exemplar-city data
  includes London → Londres. Only required fields should enter the app's bundle.
- [Apple picker navigation](https://developer.apple.com/documentation/swiftui/pickerstyle/navigationlink)
  and [Android preferences](https://developer.android.com/develop/ui/views/components/settings/components-and-attributes)
  support the approved platform selection patterns. Presentation is a product choice, not
  a claim that other native patterns are invalid.

## Adversarial review

The plan can fail if a native Form is embedded with double insets/scroll ownership, if
country/zone grouping silently changes historical event interpretation, if a successful
earlier PUT clears later intent, or if a reset lets retries cross backend environments.
These are specific integration/behavior checks, not reasons to invent new frameworks.

Durable local saves do not solve permission refusal or guarantee receipt. The current API
cannot prove strict last-write ordering after a timeout; acknowledging that limitation is
necessary when approving the smaller client-side convergence design. The owner's fixed
Paris schedule is not a defect to redesign.

## Planning verification

On 2026-09-21, the project-planning validator passes in ready mode with zero errors and
warnings. The approved product and five decisions trace into three epics and four tickets.
Local Markdown targets and dependency cycles are checked separately. Source work sites are
based on main/origin/main at `3e5c818e6ec5e2435c8c66750f2503ab85cbad0c`.

The qualitative review identifies native host/scroll/search integration, zone-database
compatibility, and lifecycle/reset races as the main remaining implementation risks. T01,
T03, and T05 make those checks explicit; the README records the residual caveats. Existing
About/environment row consumers constrain T01. Storage classifies notification preferences
and new sync metadata as backend-bound, while remembered manual zones are device preferences.

No application code or tests are edited in this planning session, so implementation tests
are not run. Later tickets use the commands in `.github/workflows/ci-mobile.yml`, captured
in the roadmap. Passing document validation does not establish native rendering or release
readiness; the owner retains device visual acceptance without a separate ticket.
