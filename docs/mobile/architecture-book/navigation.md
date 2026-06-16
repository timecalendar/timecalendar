# Navigation & route structure

Expo Router is the navigation backbone and the **only** navigation API: `@react-navigation/*` imports are banned (lint-enforced). Import `DefaultTheme` / `DarkTheme` / `ThemeProvider` etc. from `expo-router`, which re-exports them.

The two route-structure rules below are recorded as prose because their load-bearing half can't be encoded as a lint rule (R-1).

## Route screens that need a test are thin entrypoints over a feature `ui/` module (or a shared `@/components` module for shell screens)

Expo Router's `require.context` bundles **every** `*.tsx` under `src/app/` as a route — a colocated `*.test.tsx` drags `@testing-library/react-native` (Node-only `console`/`picocolors`) into the Metro bundle and breaks it. The `routes-not-importable` lint then forbids importing the route from a test elsewhere.

So the screen lives outside `src/app/` (tested there), and `src/app/<name>.tsx` is a one-line re-export. A feature screen lives in its feature's `ui/` sublayer — `src/features/<feature>/ui/<name>-screen.tsx` — and the route is `export { <Name>Screen as default } from "@/features/<feature>/ui"` (through the `ui/` sub-barrel); a shared shell screen (the tab bar) stays in `src/components/`. `ui/` is under `src/features/`, not `src/app/`, so it's a valid home for the colocated test, same as `src/components/`. Enforced indirectly by the lint boundary; the Metro-bundling half can't be a lint rule, hence this prose.

## Non-tab routes require a root `Stack` with the tabs in a `(tabs)` group

Under a root `NativeTabs` layout, only declared `NativeTabs.Trigger` routes are reachable — a bare sibling route is registered but **cannot** be navigated to (`hidden` triggers are unreachable too).

The layout is therefore:
- `src/app/_layout.tsx` = root `Stack` (+ the QueryClient/Theme providers).
- `src/app/(tabs)/_layout.tsx` = the native tabs; tab screens under `(tabs)/`.
- Non-tab routes (deep-link / modal / onboarding targets) as `Stack` siblings of `(tabs)`.

The nested `onboarding` group is **welcome-first** (ADR [015](./decisions/015-onboarding-flow-shape.md)): `onboarding/index` = the welcome surface (`timecalendar-dev://onboarding`), `onboarding/school` = the school picker (`…/onboarding/school`), `onboarding/groups` = the group picker (`…/onboarding/groups?schoolId=<id>`). The group's `index` is the entry route the deep link / the Profile `<Link href="/onboarding">` resolve to, so it is the first-run surface, not the bare list.
