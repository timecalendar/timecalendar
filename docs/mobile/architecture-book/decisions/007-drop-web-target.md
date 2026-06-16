# 007 — Drop the web target: iOS + Android only

> Origin: the `drop-mobile-web-and-brand-theme` change, design D1 (foundation
> theming readiness, Phase-0 → Phase-1 hand-off). Records the platform-scope
> decision the web removal embodies.

## Status

Accepted.

## Context

The mobile app targets **iOS + Android only** — the migration's platform scope
(Architecture Book "Scaffold-time rules → Runtime baseline"; ADR
[002](./002-minimum-os.md) sets iOS/Android floors and says nothing about web).
But the Expo SDK 56 template it was scaffolded from ships a **web target** by
default, and that surface was still wired in everywhere it touches: the
`web: { output, favicon }` block in `app.config.ts`, the `"web": "expo start --web"`
script plus the `react-dom` / `react-native-web` deps in `package.json`, the
`Fonts.web` branch in `tokens.ts` (the only reason `theme/index.ts` carried the
`import "@/global.css"` side-effect), and four web-only files
(`app-tabs.web.tsx`, `use-color-scheme.web.ts`, `global.css`, `favicon.png`).

None of it ships. It is dead surface on a two-platform app: extra dependencies, a
build target nobody runs, a CSS-vars styling path (`global.css`) the native
runtime never executes, and a `.web.tsx` resolution that misleads a contributor
into assuming web is supported.

## Decision

**Drop the web target wholesale.** Delete the four web-only files, the `web` block
in `app.config.ts`, the `"web"` script + `react-dom` / `react-native-web` deps in
`package.json` (regenerate the lockfile), the `Fonts.web` branch, and the orphaned
`import "@/global.css"`. `src/hooks/use-color-scheme.ts`
(`export { useColorScheme } from "react-native"`) **stays** as the one-line seam —
with its `.web` sibling gone, Metro resolves the bare `.ts` on both platforms,
exactly the desired behavior.

*Rejected:* keep web "just in case" — there is no web roadmap; carrying it adds
deps, maintenance, and the `.web.tsx` confusion for zero shipped value.

## Consequences

- The native app loses nothing: nothing in `src/` imported `react-dom` /
  `react-native-web` (grep-verified); `npx expo prebuild --clean`, `tsc`, lint, and
  the test suite stay green.
- `react-dom`, `react-native-web` (and a transitive) are removed; the lockfile is
  regenerated so the tree is consistent.
- The change rides the file set the brand/scheme/nav-theme readiness work touches
  anyway, so the cleanup and that work land together.
- Rollback is a plain revert — the deletion is mechanical, no data or schema.

## Revisit if

A real web roadmap appears (a genuine browser deliverable, not the template
default) — then re-add the target deliberately, with its own design, rather than
inheriting an unused scaffold.
