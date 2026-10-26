// The Material Symbols codepoints the app draws; icon.test.tsx pins each one
// against expo-symbols' own font table.
export const MATERIAL_GLYPHS = {
  add: 0xe145,
  arrow_forward: 0xe5c8,
  bolt: 0xea0b,
  check_box: 0xe834,
  check_box_outline_blank: 0xe835,
  error_outline: 0xe001,
  event_busy: 0xe615,
  link: 0xe157,
  open_in_new: 0xe89e,
  palette: 0xe40a,
  qr_code_scanner: 0xf206,
  school: 0xe80c,
  search: 0xe8b6,
  smartphone: 0xe32c,
  today: 0xe8df,
} as const

export type MaterialGlyph = keyof typeof MATERIAL_GLYPHS
