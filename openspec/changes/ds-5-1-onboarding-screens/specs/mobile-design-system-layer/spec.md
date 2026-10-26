# Spec Delta

## ADDED Requirements

### Requirement: Migrated screens stay free of the audit's drift patterns

Every screen file a design-system migration slice has migrated SHALL be listed, with its slice, in
one migrated-screen contract, and a CI-gated test SHALL fail when any listed file (comments
excluded) contains a drift pattern from the design-system audit: a raw color literal, a numeric
spacing, radius or typography literal, a `fontWeight` or `fontFamily` style key, a legacy shadow
key, direct color-scheme access, `hairlineWidth`, a literal opacity, border width or `hitSlop`, a
raw `ActivityIndicator` or `SymbolView` element, an inline style object, a raw 44/48 touch-target
value, the `themeColor` prop, or a legacy `ThemedText` type alias (`default`, `small`,
`smallBold`, `subtitle`). Platform branching and style arrays that compose an animated or measured
value SHALL stay allowed. The list SHALL only grow: each Phase 5 slice appends its files in the
same change that migrates them and raises the contract's file floor; the test SHALL fail when the list holds fewer files than the floor, and when a listed file no longer exists.

#### Scenario: A migrated screen regains a deprecated color prop

- **WHEN** `themeColor="textSecondary"` is added back to `welcome-pages.tsx`
- **THEN** the migrated-screen contract test fails naming the file, the line and the pattern

#### Scenario: A migrated screen regains a hand-rolled touch target

- **WHEN** `Platform.OS === "ios" ? 44 : 48` is added to any file in the contract
- **THEN** the migrated-screen contract test fails naming that file

#### Scenario: A listed file is deleted or renamed

- **WHEN** a file named in the contract no longer exists
- **THEN** the migrated-screen contract test fails naming the missing path

#### Scenario: The detectors catch each pattern

- **WHEN** the contract's detector runs over a fixture string containing one example of each drift
  pattern and one comment line containing `themeColor=`
- **THEN** it reports every example and does not report the comment line

#### Scenario: Slice 5.1 seeds the contract

- **WHEN** the contract is read after slice 5.1
- **THEN** it lists the onboarding welcome, connect and manual-import screen files under slice 5.1
  and every one of them passes
