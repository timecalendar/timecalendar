import {
  AlertDialog,
  CircularProgressIndicator,
  Column,
  Host,
  OutlinedTextField,
  Text,
  TextButton,
  useNativeState,
} from "@expo/ui/jetpack-compose"
import {
  fillMaxWidth,
  imePadding,
  testID,
} from "@expo/ui/jetpack-compose/modifiers"
import { StyleSheet } from "react-native"

import type { NativeTextEntryDialogProps } from "./native-text-entry-dialog"

export function NativeTextEntryDialogAndroid({
  title,
  initialValue,
  label,
  placeholder,
  message,
  cancelLabel,
  submitLabel,
  pending,
  submitDisabled,
  ids,
  onChange,
  onSubmit,
  onCancel,
}: NativeTextEntryDialogProps) {
  // `useNativeState` captures initialValue once and is the source of truth for
  // fast native edits. Compose updates it before onValueChange crosses to JS.
  const buffer = useNativeState(initialValue)
  const saveDisabled = pending || submitDisabled

  return (
    <Host
      useViewportSizeMeasurement
      ignoreSafeAreaKeyboardInsets={false}
      modifiers={[testID("native-text-entry-dialog-android-host")]}
      style={styles.host}
    >
      <AlertDialog
        modifiers={[testID(ids.dialog)]}
        properties={{
          dismissOnBackPress: true,
          dismissOnClickOutside: false,
          usePlatformDefaultWidth: true,
          decorFitsSystemWindows: true,
        }}
        onDismissRequest={onCancel}
      >
        <AlertDialog.Title>
          <Text>{title}</Text>
        </AlertDialog.Title>
        <AlertDialog.Text>
          <Column
            horizontalAlignment="start"
            verticalArrangement={{ spacedBy: 12 }}
            modifiers={[
              fillMaxWidth(),
              imePadding(),
              testID("native-text-entry-dialog-android-content"),
            ]}
          >
            <OutlinedTextField
              value={buffer}
              autoFocus
              enabled={!pending}
              singleLine
              isError={message !== null}
              onValueChange={onChange}
              modifiers={[fillMaxWidth(), testID(ids.input)]}
            >
              <OutlinedTextField.Label>
                <Text>{label}</Text>
              </OutlinedTextField.Label>
              <OutlinedTextField.Placeholder>
                <Text>{placeholder}</Text>
              </OutlinedTextField.Placeholder>
              {message === null ? null : (
                <OutlinedTextField.SupportingText>
                  <Text modifiers={[testID(ids.message)]}>{message}</Text>
                </OutlinedTextField.SupportingText>
              )}
            </OutlinedTextField>
          </Column>
        </AlertDialog.Text>
        <AlertDialog.DismissButton>
          <TextButton onClick={onCancel} modifiers={[testID(ids.cancel)]}>
            <Text>{cancelLabel}</Text>
          </TextButton>
        </AlertDialog.DismissButton>
        <AlertDialog.ConfirmButton>
          <TextButton
            enabled={!saveDisabled}
            onClick={() => onSubmit(buffer.get())}
            modifiers={[testID(ids.submit)]}
          >
            {pending ? (
              <CircularProgressIndicator
                modifiers={[
                  testID("native-text-entry-dialog-android-progress"),
                ]}
              />
            ) : null}
            <Text>{submitLabel}</Text>
          </TextButton>
        </AlertDialog.ConfirmButton>
      </AlertDialog>
    </Host>
  )
}

const styles = StyleSheet.create({
  host: { flex: 1 },
})
