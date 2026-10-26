# 068 — Design primitives behind `@/design`, the gallery behind `@/design/gallery`

## Status

Accepted.

## Context

The design system lives in `mobile/src/design/` behind one barrel, with tokens in `@/theme` and
the native seam in `@/components/chrome` (design-system audit, owner decision 1). The gallery
registry statically imports every `*.gallery.tsx` fixture, and fixtures render the primitives. A
single barrel exporting both primitives and the gallery would put every fixture on the
module-init path of any screen that imports a `Button`, and close a require cycle
(`design/index → registry → fixture → design/index`). The same shape leaked through the developer
feature: a feature barrel that re-exported the developer UI made Settings evaluate the gallery
registry to read one capability flag.

`RootPage` reads `useHeaderOverlapInset` from the chrome barrel, and chrome's settings header
renders `ThemedText`, so design and chrome depend on each other through specific files.

## Decision

- Primitives live in family folders under `src/design/`: `text/` (`ThemedText`, `ThemedView`),
  `icon/` (`Icon`), `button/` (`Button`, `ButtonRow`), `status/` (`EmptyState` and its artwork,
  the error surfaces), `layout/` (`RootPage`, `PageIntro`, `KeyboardSafeActionLayout`,
  `AdaptiveContent`, `headerScrollProps`). Each keeps its test and fixture beside it.
- `@/design` (`src/design/index.ts`) exports primitives and their public types only. It does not
  re-export tokens: `@/theme` is the one import source for `Spacing`, `useTheme` and the rest.
- The gallery runtime is a separate entry, `@/design/gallery` (`src/design/gallery/index.ts`).
  Only `src/features/developer/**`, fixtures (with `import type`) and `src/design/gallery/**`
  import it.
- Layering: `@/theme` ← `@/hooks` ← `@/components/chrome` ← `@/design` ← features. Chrome imports
  a design leaf by path (`@/design/text/themed-text`), never the barrel. Inside `src/design/`, a
  folder imports its own files relatively and other folders through `@/design/<folder>/<file>`,
  never the barrel. `useErrorAnnouncement` is a shared hook in `src/hooks/`, below both.
- `src/components/` holds the app shell (`app-tabs`, the route-structure test) and the chrome
  seam, nothing else.
- The developer capability gate is a non-UI sublayer, `src/features/developer/access/`; the
  developer feature barrel exports only `isDeveloperSurfaceEnabled`.
- Gates (Principle 1):
  - ESLint `no-restricted-imports`: `@/design/<folder>/…` is banned outside `src/design/**` and
    chrome; `@/design/gallery` is banned outside its homes; the `@/design` barrel is banned in
    design primitives and chrome runtime files.
  - `tools/eslint-rules/design-import-policy.test.js` asserts the effective
    `no-restricted-imports` options per file class, because flat config replaces options block by
    block and a block that forgets a flag passes silently.
  - `src/design/import-graph.contract.test.ts` walks the value-import graph of `src/` and fails,
    with one witness path, when the barrel reaches a gallery module, when a module outside the
    developer UI, developer routes, fixtures and the gallery reaches one, or when a require cycle
    passes through `src/design/`.
  - `src/components/shell.contract.test.ts` fails on any other top-level entry in
    `src/components/`.

Rejected: one barrel with a lazy `require()` of the registry (hides the cycle from static
analysis); re-exporting tokens from `@/design` (two valid import sources drift); chrome importing
the barrel and tolerating the cycle (a module-init read sees `undefined`); moving
`useHeaderOverlapInset` out of chrome (it reads native header metrics that belong to the seam);
`madge` for the graph (a dependency for one test the TypeScript parser already covers); a bundle
grep (Metro includes every route, so the gallery is in every bundle by ADR
[064](./064-in-house-component-gallery.md); what matters is that no product module evaluates it).

## Consequences

`import { Button } from "@/design"` is safe from any screen, and the graph test proves it. Every
new primitive goes into a family folder, gets a fixture and a test (L10), and an export in the
barrel. The `no-restricted-imports` flag matrix in `eslint.config.js` grows by two flags and four
blocks; the policy test is what keeps it honest. The developer routes stay in every bundle, inert
behind the gate. The personal-events `DateTimeField` stays in its feature until its redesign
slice makes it product-agnostic.

## Revisit if

- A gallery consumer is needed outside the developer UI.
- Chrome needs a design module beyond `text/`.
- Expo Router async routes make route-level code splitting real.
