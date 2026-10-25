# 065 — Icons declare their text scaling, and Android draws its own glyph box

## Status

Accepted.

## Context

At Android font scale 2.0 every Material glyph clipped. `expo-symbols` 56 renders an Android
`SymbolView` as a `View` of `size × size` wrapping a font-scaled `Text` (`fontSize = lineHeight =
size`) in the Material Symbols font: the text grows with the font scale but its box does not, and
the inner `Text` takes no props from the caller. On iOS a `SymbolView` is an SF Symbol image that
never scales with text, so a glyph beside a label stays small while the label grows. Thirteen
call sites rendered `SymbolView` directly, each with an implicit and unrecorded scaling choice.

## Decision

- `src/components/icon.tsx` exports `Icon`, the only renderer of a symbol glyph. Its props carry a
  required discriminated `scaling`:
  - `"text"`: the icon sits beside or inside text. Its rendered size and its box are
    `size × min(fontScale, maxFontSizeMultiplier ?? ∞)`, so the container grows with it. A
    container around a text icon uses `minWidth` / `minHeight`, never a fixed size.
  - `"fixed"`: standalone chrome (header actions, FABs, status glyphs). The size stays `size`.
- iOS renders `SymbolView` at the resolved size. Android renders a `View` of the resolved size
  holding an RN `Text` in `MaterialSymbols_400Regular`, loaded with `expo-font` `useFonts` from
  `expo-symbols/androidWeights/regular`, centered in its box; `"fixed"` sets
  `allowFontScaling={false}` (one line-level lint exemption: the glyph is drawn like an image and
  keeps its design size below the default text size too) and `"text"` passes the caller's cap.
  Before the font loads the box renders empty at its final size.
- Android glyphs come from the closed `MATERIAL_GLYPHS` table (only the glyphs the app uses);
  `icon.test.tsx` pins every codepoint against `expo-symbols`' `symbols.json`.
- `Icon` is always decorative; the control that contains it owns the accessible name.
- Lint L9 (`no-restricted-imports`, `importNames: ["SymbolView"]` on `expo-symbols`) applies
  everywhere except `src/components/icon.tsx` and its test. Symbol name types stay importable.

Rejected: patching `expo-symbols` (a patch over a fast-moving package whose fixed box is the
flaw); an `@expo/ui` Compose `Icon` host per glyph (a native host per icon inside RN pressables,
with unproven touch pass-through); the async, unstable `unstable_getMaterialSymbolSourceAsync`
image path (an image does not scale with text by itself); an L8 exemption (the glyph still
clips).

## Consequences

Every icon makes its scaling decision in the type system, and lint keeps new icons on the seam.
Android duplicates `SymbolView`'s font rendering in one file, and a new Android glyph needs a
`MATERIAL_GLYPHS` row (the codepoint test proves it). Text icons on iOS grow up to 3.571× at AX5,
so a text icon in a dense row needs the same cap as its neighbor text, and a row chevron, a cue
rather than content, caps at `ChevronMaxFontScale` (2).

## Revisit if

- `expo-symbols` sizes its Android box with the font scale, or exposes its glyph text props.
- The design-system `Icon` catalogue (named icons, tones, `IconSize`-only sizing) lands on top of
  this scaling core.
