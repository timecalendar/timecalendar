# iOS SEED-B native migration acceptance

The genuine Flutter SEED-B fixture survives local replacement by the production-identity RN Debug simulator app. The shipping importer runs against actual Expo SQLite and native MMKV, settles once, preserves the retained source, and leaves later RN edits intact. All fixture content is synthetic. This proof is scoped to a local iOS 26.5 simulator, not a signed physical TestFlight/App Store upgrade.

## Evidence matrix

| Acceptance | Artifact | Observed result |
| --- | --- | --- |
| Flutter source and typed preferences | [Baseline](seed-b-before.json), [Flutter screen](seed-b-flutter.png), [replacement retention](seed-b-postinstall.json) | 3 calendars, 60 personal events, 134 checklists, hidden counts 21/6; six allowlisted preferences and six intentionally dropped preferences |
| Actual first import / cold relaunch | [Offline readback](seed-b-offline-readback.json), [SQLite journal](seed-b-native-sqlite.json) | All 17 baseline checks pass; six Drizzle migrations applied; successful attempt 1, one pending private report |
| Exact source mapping | [Independent field comparison](seed-b-independent-fields.json) | 1,576 comparisons, zero mismatches; Europe/Paris timezone |
| Visible retained settings/data | [Calendar](seed-b-rn-calendar.png), [Home](seed-b-rn-home.png), [personal event](seed-b-rn-personal-event.png) | Dark appearance, calendar startup, Monday–Friday columns, personal-event Unicode/date/color and checklist content |
| Two shipping Home refreshes | [Revision 1](seed-b-sync1.json), [revision 2](seed-b-sync2.json) | All 18 checks pass on each; 31 cached courses, 67 school-linked checklists, correct hidden UID/name exclusions |
| Private queued report delivered | [Schema check](seed-b-outbox-schema.json), [server receipts](../reporting/qa-transport/device-receipts.json), [stored-payload validation](../reporting/qa-transport/device-privacy.json) | Same immutable report delivered once after offline attempts; shipping strict schema accepts 962-byte payload |
| Later checklist edit preserved | [UI edit](seed-b-user-edit.json), [cold restart](seed-b-post-edit-restart.json), [screen](seed-b-checklist-after-edit.png) | Item 0 unchecked through the event screen remains unchecked after process restart |
| Later checklist deletion preserved | [UI deletion](seed-b-user-delete.json), [cold restart](seed-b-post-delete-restart.json), [screen](seed-b-checklist-after-delete.png) | Item 0 stays absent after restart; 133 checklists remain; other event checklist positions reflect normal UI renumbering |
| Later native preference preserved | [Theme restart](seed-b-post-theme-edit-restart.json), [Light screen](seed-b-theme-edited.png) | Light selected through shipping appearance settings survives cold restart with no false native-integrity report |
| Independent final verification | [Coordinator check](seed-b-independent-final.json) | Light selected in native UI; deleted row absent; 133 checklists; original attempt 1 and exactly one delivered report |
| Retained source after every action | [Final source](seed-b-final-source.json), [final runtime](seed-b-final-runtime.json) | Original database bytes and all six typed preference values unchanged; source mode 0444; source and target retained after graceful simulator shutdown |

The successful report ID is `7000d54a-612c-4726-bbb8-4e8fd82c1ecf`. Its outbox acknowledgement is `2026-10-04T17:52:11.659Z`, after four attempts including offline failures. Report IDs are synthetic; source hashes appear only in local fixture-retention artifacts, never in the private report or exported journal diagnostics. Server/device wall clocks are not synchronized, so receipt timestamps do not measure latency.

## Intentional differences after normal RN use

The readback helper compares to the original Flutter fixture. After the checklist toggle, `checklistFields=false` is expected. After deletion, `checklistCount=false` and `checklistFields=false` represent the absent item and normal renumbering. After the Light choice, `darkTheme=false` is expected. Every other final readback check passes; the immutable migration attempt remains 1 and the outbox contains only its original delivered report. These differences demonstrate preservation of newer RN state.

The first accessibility capture immediately after delete still contained a stale row. The refreshed rendered screenshot and actual SQLite query show the row absent; cold-restart and independent coordinator queries confirm deletion durability. The final theme screenshot is captured after refreshed accessibility state confirms Light selected.

## Reproduction boundary

Build/install and fixture commands are in [the native command record](../native/commands.md); [the harness README](../../../../../mobile/scripts/migration-rehearsal/README.md) documents exact native readback, fetch isolation and receiver setup. The successful iOS raw bundle is:

```text
http://127.0.0.1:8086/scripts/migration-rehearsal/entry.bundle?platform=ios&dev=true&minify=false&transform.routerRoot=src/app&transform.engine=hermes&unstable_transformProfile=hermes-stable
```

Pass the fully URL-encoded bundle as the development client's `url` parameter. The rehearsal entry explicitly sets root location `/`; it otherwise runs the shipping route tree, bootstrap, repositories and settings. The synthetic fetch transport resets to offline on each cold launch. Offline iOS evidence is injected fetch failure, not radio-off proof. No production calendar request is delegated by the transport; native SDK networking and OTA are outside that boundary.

Actual UI operations use accessibility-derived controls and `idb ui tap`; controlled restarts terminate and reopen the same application without uninstalling, clearing data or rewriting fixtures. The source capture tool compares the retained Flutter database and allowlisted preferences without exporting their values. Simulator B is `4CADEE84-03D3-49ED-921E-29C728C7423F`, application ID `fr.samuelprak.timecalendar`; its data remains retained. Simulator A is only seeded with Flutter and has no target-import claim.

Normal signed launch assets, physical iPhone data protection, backup/restore, background-first-launch, OTA-after-migration and low-end release-mode duration/memory remain release gates. The raw development launcher does not provide normal signed manifest asset metadata. Neither this evidence nor the host fault-injection matrix grants public rollout approval.
