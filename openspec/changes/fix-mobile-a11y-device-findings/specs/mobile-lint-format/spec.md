## ADDED Requirements

### Requirement: Symbol icons render only through the icon primitive

Lint SHALL report an error for any import of the `SymbolView` component from `expo-symbols` outside the app's icon primitive module and its test, so every icon passes through the text-scaling contract. Type-only imports from `expo-symbols` (symbol name types) SHALL stay allowed.

#### Scenario: A feature imports SymbolView

- **WHEN** a file under `src/features/` imports `SymbolView` from `expo-symbols`
- **THEN** `npm run lint` fails with a message that points to the icon primitive

#### Scenario: Symbol name types stay importable

- **WHEN** a file imports the `SFSymbol` or `AndroidSymbol` type from `expo-symbols`
- **THEN** lint reports no error for that import
