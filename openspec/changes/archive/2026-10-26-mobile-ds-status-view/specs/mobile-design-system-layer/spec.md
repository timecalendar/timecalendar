# Spec Delta

## MODIFIED Requirements

### Requirement: Design primitives live in the design layer behind one barrel

Shared, product-agnostic UI primitives (text, icon, button, status surfaces, page layouts) SHALL
live under `mobile/src/design/` and SHALL be imported by application code only through the
`@/design` barrel. The barrel SHALL export primitives and their public types only; it SHALL NOT
export gallery runtime, fixtures or design tokens. Tokens SHALL stay importable only from
`@/theme`. Code outside `src/design/` and the native chrome seam SHALL NOT import a module path
below `@/design/` other than the gallery entry where that entry is allowed.

#### Scenario: A screen imports a primitive

- **WHEN** a feature screen needs `Button`, `Icon`, `ThemedText`, `RootPage` or `StatusView`
- **THEN** it imports it from `@/design` and lint reports no error

#### Scenario: A feature deep-imports a primitive file

- **WHEN** a file under `src/features/` imports `@/design/button/button`
- **THEN** `npm run lint` fails with a message that names the `@/design` barrel

#### Scenario: The barrel carries no tokens

- **WHEN** a module imports `Spacing` or `useTheme` from `@/design`
- **THEN** `npx tsc --noEmit` fails
