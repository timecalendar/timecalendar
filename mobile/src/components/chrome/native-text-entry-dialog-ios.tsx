import {
  Button,
  Host,
  HStack,
  ProgressView,
  Spacer,
  Text,
  TextField,
  useNativeState,
  VStack,
} from "@expo/ui/swift-ui"
import {
  accessibilityIdentifier,
  accessibilityLabel,
  buttonStyle,
  disabled,
  font,
  frame,
  padding,
  textFieldStyle,
} from "@expo/ui/swift-ui/modifiers"
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  View,
} from "react-native"

import { AdaptiveContent } from "@/components/adaptive-content"
import { Spacing } from "@/theme"

import type { NativeTextEntryDialogProps } from "./native-text-entry-dialog"

export function NativeTextEntryDialogIos({
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
  // SDK 56 captures this initial value once. Native edits update the observable
  // before the asynchronous JS callback, so submit reads the complete current
  // buffer with get() instead of relying on a possibly delayed React snapshot.
  const buffer = useNativeState(initialValue)
  const saveDisabled = pending || submitDisabled

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        testID="native-text-entry-dialog-keyboard-owner"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.fill}
      >
        <View
          testID="native-text-entry-dialog-backdrop"
          style={styles.backdrop}
        >
          <AdaptiveContent
            testID="native-text-entry-dialog-content"
            lane="readable"
            style={styles.contentOwner}
          >
            <View
              testID={ids.dialog}
              accessibilityViewIsModal
              style={styles.focusOwner}
            >
              <Host
                testID="native-text-entry-dialog-ios-host"
                matchContents={{ vertical: true }}
                style={styles.host}
              >
                <VStack
                  alignment="leading"
                  spacing={Spacing.three}
                  modifiers={[
                    frame({ maxWidth: 560, alignment: "leading" }),
                    padding({ all: Spacing.four }),
                    accessibilityIdentifier(ids.dialog),
                  ]}
                >
                  <Text modifiers={[font({ textStyle: "headline" })]}>
                    {title}
                  </Text>
                  <TextField
                    testID={ids.input}
                    text={buffer}
                    placeholder={placeholder}
                    autoFocus
                    onTextChange={onChange}
                    modifiers={[
                      textFieldStyle("roundedBorder"),
                      accessibilityLabel(label),
                      accessibilityIdentifier(ids.input),
                      disabled(pending),
                      frame({ minWidth: 0, maxWidth: 560 }),
                    ]}
                  />
                  {message === null ? null : (
                    <Text
                      testID={ids.message}
                      modifiers={[
                        accessibilityLabel(message),
                        accessibilityIdentifier(ids.message),
                      ]}
                    >
                      {message}
                    </Text>
                  )}
                  <HStack spacing={Spacing.two}>
                    <Spacer />
                    <Button
                      testID={ids.cancel}
                      role="cancel"
                      label={cancelLabel}
                      onPress={onCancel}
                      modifiers={[
                        buttonStyle("bordered"),
                        accessibilityIdentifier(ids.cancel),
                      ]}
                    />
                    {pending ? (
                      <ProgressView
                        testID="native-text-entry-dialog-ios-progress"
                        modifiers={[accessibilityLabel(submitLabel)]}
                      />
                    ) : null}
                    <Button
                      testID={ids.submit}
                      label={submitLabel}
                      onPress={() => onSubmit(buffer.get())}
                      modifiers={[
                        buttonStyle("borderedProminent"),
                        accessibilityIdentifier(ids.submit),
                        disabled(saveDisabled),
                      ]}
                    />
                  </HStack>
                </VStack>
              </Host>
            </View>
          </AdaptiveContent>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  contentOwner: { width: "100%" },
  focusOwner: { width: "100%" },
  host: { width: "100%" },
})
