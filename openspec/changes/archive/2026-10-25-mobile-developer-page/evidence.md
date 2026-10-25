# Evidence — lint gate inject-and-revert (task 5.2)

Run in `mobile/`. Each injection prepended one import line; ordering/unused rules were silenced
on the command line so only `no-restricted-imports` speaks. All injections were reverted and
`npm run lint` exits 0 afterwards.

## (a) Barrel import from Settings

Injected into `src/features/settings/ui/settings-screen.tsx`:
`import { EnvironmentSettingsControl } from "@/features/environment"`

```
$ npx eslint src/features/settings/ui/settings-screen.tsx
  1:10  error  'EnvironmentSettingsControl' import from '@/features/environment' is restricted. The environment control lives on the developer page — mount it from src/features/developer/ui only (navigation.md → Developer page)  no-restricted-imports
✖ 1 problem (1 error, 0 warnings)
```

## (b) Deep import from a route file

Injected into `src/app/developer.tsx`:
`import { EnvironmentSettingsControl } from "@/features/environment/ui/environment-settings-control"`

```
$ npx eslint src/app/developer.tsx
  1:1  error  '@/features/environment/ui/environment-settings-control' import is restricted from being used by a pattern. The environment control lives on the developer page — mount it from src/features/developer/ui only (navigation.md → Developer page)  no-restricted-imports
✖ 1 problem (1 error, 0 warnings)
```

## (c) Developer screen: control allowed, `@/app` ban carried forward

Uninjected:

```
$ npx eslint src/features/developer/ui/developer-screen.tsx
ESLint: No issues found
```

Injected `import "@/app/about"`:

```
$ npx eslint src/features/developer/ui/developer-screen.tsx
  1:1  error  '@/app/about' import is restricted from being used by a pattern. Route files under src/app/ are entrypoints — move shared code to a module and import that instead  no-restricted-imports
✖ 1 problem (1 error, 0 warnings)
```
