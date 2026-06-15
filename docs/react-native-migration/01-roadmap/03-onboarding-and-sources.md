# Phase 03 — Onboarding & calendar sources

> **Goal:** everything that gets a calendar onto the device. This establishes **identity** (= calendar subscription tokens) and the durable storage of it — the thing the whole app hangs on.
>
> **Depends on:** Phase 02 (server-read pattern, storage). **Modules:** `onboarding`, `add_school`, `school`, `school_group`, `qr_code`, `import_ical`.

## Rough steps

1. ✅ **Onboarding flow** — landed (`add-mobile-onboarding-flow`, ADR [015](../../../.claude/rules/mobile/decisions/015-onboarding-flow-shape.md)): a **native-default** brand/welcome surface as the onboarding entry over the existing school step (Expo Router stack, welcome-first). The **designer-polish artifacts** (real illustrations / final brand copy / optional motion / the white-on-brand-CTA `primaryStrong` decision) are inboxed (HUMAN: `inbox/2026-06-15-onboarding-design-polish.md`); the on-device DoD axes are inboxed (`inbox/2026-06-15-onboarding-flow-dod-manual.md`).
2. **School / school-group selection** — grow Phase 02's read path into the full picker.
3. **QR scan** — `expo-camera` barcode scanning (replaces `mobile_scanner`) to add a calendar by token.
4. **iCal import** — add a calendar by URL/file.
5. **Identity persistence** — store `user_calendars` tokens durably (MMKV or Drizzle). **This schema is a Phase 09 migration target — design it to receive the recovered `user_calendars.token`.**
6. **Confirm Android storage** while we're here — verify the open Android items from the [migration research §6](../00-exploration/data-persistence-migration.md#6-device-verification-done) (prefs backend + sembast path) on a real Android device.

## Exit criteria

- A fresh user can add a calendar via school pick, QR, and iCal — each passing full DoD on both platforms.
- Calendar tokens persist across restarts; schema is migration-ready.
- Android storage paths confirmed.

## Risks & decisions

- Token persistence correctness is **critical** — it's the user's identity. Test restart/kill/reinstall-of-cache scenarios.
- Designed brand surface (onboarding) — needs the design artifacts, not just native defaults.
</content>
