import {
  BottomSheet,
  Button,
  Form,
  Group,
  Host,
  HStack,
  ProgressView,
  Section,
  Spacer,
  Text,
  TextField,
  useNativeState,
  VStack,
} from "@expo/ui/swift-ui"
import {
  accessibilityIdentifier,
  accessibilityLabel,
  disabled,
  font,
  frame,
  interactiveDismissDisabled,
  onSubmit as onSubmitModifier,
  padding,
  presentationDetents,
  presentationDragIndicator,
  scrollContentBackground,
  submitLabel as swiftSubmitLabel,
  tint,
} from "@expo/ui/swift-ui/modifiers"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { useTheme } from "@/theme"

import { NativeErrorNotice } from "./native-error-notice"
import type { NativeTextEntryDialogProps } from "./native-text-entry-dialog"

const SHEET_HEADER_MIN_HEIGHT = 44

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
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light"
  const theme = useTheme()
  const saveDisabled = pending || submitDisabled
  const submit = () => onSubmit(buffer.get())

  return (
    <Host
      testID="native-text-entry-dialog-ios-host"
      colorScheme={colorScheme}
      matchContents
    >
      <BottomSheet
        isPresented
        onIsPresentedChange={(presented) => {
          if (!presented) onCancel()
        }}
      >
        <Group
          modifiers={[
            presentationDetents(["medium", "large"]),
            presentationDragIndicator("visible"),
            interactiveDismissDisabled(pending),
            tint(theme.primary),
            accessibilityIdentifier(ids.dialog),
          ]}
        >
          <VStack spacing={0}>
            <HStack
              modifiers={[
                frame({ minHeight: SHEET_HEADER_MIN_HEIGHT }),
                padding({ horizontal: 16, top: 12 }),
              ]}
            >
              <Button
                label={cancelLabel}
                onPress={onCancel}
                modifiers={[
                  accessibilityIdentifier(ids.cancel),
                  disabled(pending),
                ]}
              />
              <Spacer />
              <Text modifiers={[font({ textStyle: "headline" })]}>{title}</Text>
              <Spacer />
              {pending ? (
                <ProgressView
                  testID="native-text-entry-dialog-ios-progress"
                  modifiers={[accessibilityLabel(submitLabel)]}
                />
              ) : null}
              <Button
                label={submitLabel}
                onPress={submit}
                modifiers={[
                  font({ textStyle: "body", weight: "semibold" }),
                  accessibilityIdentifier(ids.submit),
                  disabled(saveDisabled),
                ]}
              />
            </HStack>
            <Form modifiers={[scrollContentBackground("hidden")]}>
              <Section
                footer={
                  message === null ? undefined : (
                    <NativeErrorNotice message={message} testID={ids.message} />
                  )
                }
              >
                <TextField
                  testID={ids.input}
                  text={buffer}
                  placeholder={placeholder}
                  autoFocus
                  onTextChange={onChange}
                  modifiers={[
                    accessibilityLabel(label),
                    accessibilityIdentifier(ids.input),
                    swiftSubmitLabel("done"),
                    onSubmitModifier(() => {
                      if (!saveDisabled) submit()
                    }),
                    disabled(pending),
                  ]}
                />
              </Section>
            </Form>
          </VStack>
        </Group>
      </BottomSheet>
    </Host>
  )
}
