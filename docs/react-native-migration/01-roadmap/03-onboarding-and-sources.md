# Phase 03 — Onboarding & calendar sources

> **Goal:** everything that gets a calendar onto the device. This establishes **identity** (= calendar subscription tokens) and the durable storage of it — the thing the whole app hangs on.
>
> **Depends on:** Phase 02 (server-read pattern, storage). **Modules:** `onboarding`, `add_school`, `school`, `school_group`, `qr_code`, `import_ical`.

## Rough steps

1. ✅ **Onboarding flow** — landed (`add-mobile-onboarding-flow`, ADR [015](../../../.claude/rules/mobile/decisions/015-onboarding-flow-shape.md)): a **native-default** brand/welcome surface as the onboarding entry over the existing school step (Expo Router stack, welcome-first). The **designer-polish artifacts** (real illustrations / final brand copy / optional motion / the white-on-brand-CTA `primaryStrong` decision) are inboxed (HUMAN: `inbox/2026-06-15-onboarding-design-polish.md`); the on-device DoD axes are inboxed (`inbox/2026-06-15-onboarding-flow-dod-manual.md`).
2. ✅ **School / school-group selection** — landed (`add-mobile-school-picker`, ADR [016](../../../.claude/rules/mobile/decisions/016-school-group-multi-select-commit.md)): grew Phase 02's read path into the **full picker** — the group step is now **multi-select with an explicit confirm-commit** (toggle leaves into a pending set, confirm persists the whole set through the unchanged identity-only store, empty confirm guarded), school search is **accent-insensitive name-or-code** via a pure `data/search.ts` helper, and completion **dismisses the whole onboarding Stack** (`router.dismissTo`). No new dependency / native change. On-device DoD axes inboxed (extended the existing `inbox/2026-06-14-school-selection-dod-manual.md`).
3. **QR scan** — `expo-camera` barcode scanning (replaces `mobile_scanner`) to add a calendar by token.
4. **iCal import** — add a calendar by URL/file.
5. ✅ **Identity persistence** — landed (`add-mobile-calendar-identity-persistence`, ADR [018](../../../.claude/rules/mobile/decisions/018-user-calendar-storage.md)): a durable **Drizzle** `user_calendars` token store (MMKV genuinely weighed and rejected — relational identity + Phase-09 importer target + free migration-runner durability), the schema mirroring the Flutter `toDbMap()` **verbatim** (importer fidelity — `id`-is-record-key, `token` the irreplaceable identity, dates TEXT ISO-8601 UTC, `visible` boolean), the second real migration committed, the full `data/user-calendars/` layer (mappers + repository + reactive hook + the shared `addCalendarFromUrl` persist seam), and ships 3/4's success paths rewired to persist durably (the ephemeral holder removed). On-disk restart/kill/cache-clear durability is the on-device manual pass (HUMAN: `inbox/2026-06-16-calendar-restart-durability.md`). **The Phase-09 importer-target schema is in place to receive the recovered `user_calendars.token`.**
6. **Confirm Android storage** while we're here — verify the open Android items from the [migration research §6](../00-exploration/data-persistence-migration.md#6-device-verification-done) (prefs backend + sembast path) on a real Android device.

## Exit criteria

- A fresh user can add a calendar via school pick, QR, and iCal — each passing full DoD on both platforms.
- Calendar tokens persist across restarts; schema is migration-ready.
- Android storage paths confirmed.

## Risks & decisions

- Token persistence correctness is **critical** — it's the user's identity. Test restart/kill/reinstall-of-cache scenarios.
- Designed brand surface (onboarding) — needs the design artifacts, not just native defaults.
</content>
