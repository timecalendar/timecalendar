# Golden-path skeleton template

The copy-this source for **starting a new feature**, blessed in Phase 1.5 by the
[golden-path exemplar](../../../../.claude/rules/mobile/golden-path.md) and
[ADR 014](../../../../.claude/rules/mobile/decisions/014-layered-feature-module-pattern.md).

## Why it lives here and not under `mobile/src/`

These files are **template stubs, not source**. If they lived under `mobile/src/`
they would be bundled by Metro, walked by the Expo Router `require.context` route
harness, linted as source, and counted against the Jest coverage denominator (a 0%
stub would break the K-3 gate). So they live here, **outside `src/`**, with a
`.ts.txt` / `.tsx.txt` suffix so no harness touches them (design D2).

## How to use it

Follow the **"Starting a new feature" checklist** in the
[golden-path exemplar](../../../../.claude/rules/mobile/golden-path.md). In short:
copy these files into your feature's home under `mobile/src/`, **drop the `.txt`
suffix**, rename `feature` / `<feature>` to your feature name, keep only the
sublayers your axis needs (`data/` / `store/` / `form/`), wire FR+EN keys, register
the route, add a Maestro flow, and run `npx tsc --noEmit` / `npm run lint` /
`npm test` in `mobile/`.

## What's here

```
golden-path-template/
  feature/
    data/
      types.ts.txt       → src/features/<feature>/data/types.ts   (domain type + a total parser)
      index.ts.txt       → src/features/<feature>/data/index.ts   (sub-barrel)
    index.ts.txt         → src/features/<feature>/index.ts         (feature barrel)
  components/
    feature-screen.tsx.txt      → src/components/<feature>-screen.tsx       (presentational screen)
    feature-screen.test.tsx.txt → src/components/<feature>-screen.test.tsx  (colocated test)
  app/
    feature.tsx.txt      → src/app/<feature>.tsx                  (thin route re-export)
```

Each stub carries `TODO` markers and an inline pointer to the canonical landed
feature for that axis (Settings / Personal events / School selection). The
`data/`-only shape is the skeleton; add `store/` (copy `settings/prefs/store.ts`)
or `form/` (copy `personal-events/form/`) when your axis needs them.
