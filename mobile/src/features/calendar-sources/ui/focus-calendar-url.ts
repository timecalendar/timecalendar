import type { TextInput } from "react-native"

export const focusCalendarUrl = (input: TextInput | null): void =>
  input?.focus()
