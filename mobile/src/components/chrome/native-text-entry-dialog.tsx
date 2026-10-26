import { Platform } from "react-native"

import { useAssertOutsideNativeList } from "./native-list-context"
import { NativeTextEntryDialogAndroid } from "./native-text-entry-dialog-android"
import { NativeTextEntryDialogIos } from "./native-text-entry-dialog-ios"

export type NativeTextEntryDialogIds = {
  dialog: string
  input: string
  message: string
  cancel: string
  submit: string
}

export type NativeTextEntryDialogProps = {
  title: string
  initialValue: string
  label: string
  placeholder: string
  message: string | null
  messageKind?: "validation" | "operation"
  // "code" is for case-sensitive machine strings (tokens, ids): no
  // auto-capitalization, no autocorrect.
  inputKind?: "text" | "code"
  cancelLabel: string
  submitLabel: string
  pending: boolean
  submitDisabled: boolean
  ids: NativeTextEntryDialogIds
  onChange: (value: string) => void
  onSubmit: (currentValue: string) => void
  onCancel: () => void
}

export function NativeTextEntryDialog(props: NativeTextEntryDialogProps) {
  useAssertOutsideNativeList("NativeTextEntryDialog")
  return Platform.OS === "ios" ? (
    <NativeTextEntryDialogIos {...props} />
  ) : (
    <NativeTextEntryDialogAndroid {...props} />
  )
}
