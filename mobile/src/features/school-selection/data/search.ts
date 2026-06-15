import type { SchoolListItem } from "./types"

// Accent-insensitive name-or-code school search — the pure data/ logic the
// school screen filters through (90% logic gate). Mirrors the Flutter
// `stringIncludes`: lowercase, strip diacritics, strip spaces/hyphens, then
// substring-match the needle against the normalized name OR code.
//
// Diacritics are stripped with NFD decomposition + a combining-marks range strip
// (U+0300–U+036F, the Unicode "Combining Diacritical Marks" block) rather than a
// \p{Diacritic} property escape: Hermes (RN 0.85.3 / SDK 56) has known gaps in
// RegExp Unicode property escapes (facebook/react-native#29807), so the explicit
// range is the safe, dependency-free equivalent for Latin accents. No new dep.
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s-]/g, "")
}

export function schoolMatches(needle: string, school: SchoolListItem): boolean {
  const n = normalize(needle)
  if (n.length === 0) return true
  return (
    normalize(school.name).includes(n) || normalize(school.code).includes(n)
  )
}
