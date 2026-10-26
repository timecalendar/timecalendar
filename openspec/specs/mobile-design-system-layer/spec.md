# mobile-design-system-layer Specification

## Purpose
Defines where the mobile app's design-system primitives live, what the `@/design` barrel exposes,
how the developer-only component gallery is kept off product screens, and the import layering
between tokens, the native chrome seam, the design layer and features.

## Requirements

### Requirement: Design primitives live in the design layer behind one barrel

Shared, product-agnostic UI primitives (text, icon, button, status surfaces, page layouts) SHALL
live under `mobile/src/design/` and SHALL be imported by application code only through the
`@/design` barrel. The barrel SHALL export primitives and their public types only; it SHALL NOT
export gallery runtime, fixtures or design tokens. Tokens SHALL stay importable only from
`@/theme`. Code outside `src/design/` and the native chrome seam SHALL NOT import a module path
below `@/design/` other than the gallery entry where that entry is allowed.

#### Scenario: A screen imports a primitive

- **WHEN** a feature screen needs `Button`, `Icon`, `ThemedText`, `RootPage` or `EmptyState`
- **THEN** it imports it from `@/design` and lint reports no error

#### Scenario: A feature deep-imports a primitive file

- **WHEN** a file under `src/features/` imports `@/design/button/button`
- **THEN** `npm run lint` fails with a message that names the `@/design` barrel

#### Scenario: The barrel carries no tokens

- **WHEN** a module imports `Spacing` or `useTheme` from `@/design`
- **THEN** `npx tsc --noEmit` fails

### Requirement: The app-shell folder holds no design primitives

`mobile/src/components/` SHALL contain only the app shell (the tab layout component and its test,
the route-structure test) and the native chrome seam directory. A check SHALL fail naming any
other file or directory that appears at its top level.

#### Scenario: A primitive is added to the shell folder

- **WHEN** a new `badge.tsx` is created directly under `src/components/`
- **THEN** the shell contract test fails naming `badge.tsx`

### Requirement: The gallery runtime is a developer-only entry

The gallery runtime (story entries, story lookup, the story renderer and the fixture types)
SHALL be exposed through a dedicated `@/design/gallery` entry, separate from the primitive barrel.
Only the developer feature's UI, gallery fixtures (`*.gallery.tsx` and their tests) and modules
under `src/design/gallery/` SHALL import it; lint SHALL report an error for an import of
`@/design/gallery` (or any path below it) anywhere else. Fixtures SHALL import gallery types with
type-only imports.

#### Scenario: A product screen imports the gallery

- **WHEN** a file under `src/features/settings/` imports from `@/design/gallery`
- **THEN** `npm run lint` fails with a message that the gallery is developer-only

#### Scenario: A fixture imports gallery types

- **WHEN** a `*.gallery.tsx` file imports `type GalleryMeta` from `@/design/gallery`
- **THEN** lint reports no error for that import

#### Scenario: The developer UI renders the gallery

- **WHEN** the gallery index and story screens import their entries from `@/design/gallery`
- **THEN** lint reports no error and the `/developer/gallery` routes list and render every story
  with unchanged story ids and deep links

### Requirement: No product module reaches a gallery fixture at module init

A contract check SHALL walk the static value-import graph of `mobile/src/` (type-only imports
excluded, tests excluded as importers) and SHALL fail, naming the module and one import path,
when: the `@/design` barrel reaches a gallery module or a `*.gallery.tsx` fixture; any module
other than the developer feature UI, developer routes, fixtures and `src/design/gallery/` modules
reaches one; or an import cycle passes through a module under `src/design/`.

#### Scenario: Settings stays free of the gallery

- **WHEN** the graph is walked from the Settings screen
- **THEN** it reaches no gallery module and no fixture

#### Scenario: A primitive imports the gallery

- **WHEN** a primitive under `src/design/` value-imports a gallery module
- **THEN** the import-graph contract test fails naming the barrel path to that module

#### Scenario: A fixture value-imports the gallery entry

- **WHEN** a fixture replaces its type-only import of `@/design/gallery` with a value import
- **THEN** the import-graph contract test fails naming the cycle through the registry

### Requirement: Design-layer imports respect the layering

The design layer SHALL NOT import a feature, a route, the generated API or the database seam.
Design primitives SHALL import other design modules by their `@/design/<folder>/<file>` path,
never through the `@/design` barrel. Native chrome seam modules other than fixtures SHALL NOT
import the `@/design` barrel; they MAY import a design leaf module by path. A test SHALL assert the
effective import-restriction configuration for representative files of each layer, so a lint
configuration block that silently drops a ban fails CI.

#### Scenario: A primitive imports the barrel

- **WHEN** a file under `src/design/button/` imports from `@/design`
- **THEN** `npm run lint` fails with a message to import the folder path

#### Scenario: Chrome imports the barrel

- **WHEN** a non-fixture file under `src/components/chrome/` imports from `@/design`
- **THEN** `npm run lint` fails with a message to import the design leaf module

#### Scenario: A lint block drops a ban

- **WHEN** a configuration block for developer files re-sets import restrictions without the
  route-entrypoint or seam bans
- **THEN** the design import-policy test fails naming the file and the missing pattern
