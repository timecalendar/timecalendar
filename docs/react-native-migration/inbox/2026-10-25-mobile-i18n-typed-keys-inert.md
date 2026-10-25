**For:** the planner of the next mobile i18n or lint change. No human action is needed.

# Typed translation keys are not enforced by `tsc`

## What I need

A small change that makes the typed-key augmentation take effect, then fixes what it surfaces.

**Current state.** `mobile/src/i18n/i18next.d.ts` declares `CustomTypeOptions` on the
`react-i18next` module. With i18next 26 and react-i18next 17 the option is read from the `i18next`
module, so `t("any.string")` and `ParseKeys` accept every string: a removed or mistyped key is not
a compile error. Found while removing `eventDetails.colorLabel` in
`fix-mobile-a11y-device-findings`: `tsc` stayed green with the key still referenced.

Moving the declaration to `declare module "i18next"` surfaces 7 errors: one stale key (since
removed by that change) and six call sites that pass a `string`-typed key
(`calendar-sources/ui/ical-url-screen.tsx`, `home/ui/home-screen/welcome-card.tsx`,
`onboarding/ui/institution-name-screen.tsx`, `onboarding/ui/programme-screen.tsx`,
`personal-events/ui/personal-event-fields.tsx` ×2). Those need their key variables typed as
`ParseKeys` (or a narrower union), not casts.

## Why

`i18n.md` and the `D4` comment in `i18next.d.ts` promise that a missing key fails `tsc`. The
`SWATCH_NAME_KEYS satisfies Record<SwatchPreset, ParseKeys>` check in personal events relies on it
too.

## How to verify

A scratch `t("definitely.not.a.key")` fails `npx tsc --noEmit` in `mobile/`, and the suite is green.

## Blocks

Nothing. The FR/EN parity test still catches catalog drift between languages.
