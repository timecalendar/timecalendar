import {
  AlertDialog,
  Host as ComposeHost,
  OutlinedTextField,
  Text as MaterialText,
  TextButton,
  useNativeState as useComposeNativeState,
} from "@expo/ui/jetpack-compose"
import {
  fillMaxWidth,
  imePadding,
  testID,
} from "@expo/ui/jetpack-compose/modifiers"
import {
  Button as SwiftButton,
  Form,
  Host as SwiftHost,
  Section,
  Text as SwiftText,
  TextField as SwiftTextField,
  useNativeState as useSwiftNativeState,
} from "@expo/ui/swift-ui"
import {
  accessibilityIdentifier,
  accessibilityLabel,
  keyboardType,
  submitLabel,
} from "@expo/ui/swift-ui/modifiers"
import { Platform, StyleSheet } from "react-native"

import { useColorScheme } from "@/hooks/use-color-scheme"

import { NativeErrorNotice } from "./native-error-notice"

export type NativeSettingsNumericEditorIds = {
  container: string
  field: string
  cancel: string
  submit: string
  message: string
}

export type NativeSettingsNumericEditorProps = {
  title: string
  label: string
  initialValue: string
  cancelLabel: string
  submitLabel: string
  validationMessage?: string | undefined
  ids: NativeSettingsNumericEditorIds
  onCancel: () => void
  onSubmit: (value: string) => void
}

function useResolvedScheme(): "light" | "dark" {
  return useColorScheme() === "dark" ? "dark" : "light"
}

function IosNumericEditor(props: NativeSettingsNumericEditorProps) {
  const buffer = useSwiftNativeState(props.initialValue)
  const colorScheme = useResolvedScheme()
  return (
    <SwiftHost
      colorScheme={colorScheme}
      useViewportSizeMeasurement
      style={styles.fill}
    >
      <Form>
        <Section title={props.title}>
          <SwiftTextField
            text={buffer}
            autoFocus
            modifiers={[
              accessibilityIdentifier(props.ids.field),
              accessibilityLabel(props.label),
              keyboardType("numeric"),
              submitLabel("done"),
            ]}
          >
            <SwiftTextField.Placeholder>
              <SwiftText>{props.label}</SwiftText>
            </SwiftTextField.Placeholder>
          </SwiftTextField>
          {props.validationMessage ? (
            <NativeErrorNotice
              message={props.validationMessage}
              testID={props.ids.message}
            />
          ) : null}
          <SwiftButton
            label={props.cancelLabel}
            onPress={props.onCancel}
            modifiers={[accessibilityIdentifier(props.ids.cancel)]}
          />
          <SwiftButton
            label={props.submitLabel}
            onPress={() => props.onSubmit(buffer.get())}
            modifiers={[accessibilityIdentifier(props.ids.submit)]}
          />
        </Section>
      </Form>
    </SwiftHost>
  )
}

function AndroidNumericEditor(props: NativeSettingsNumericEditorProps) {
  const buffer = useComposeNativeState(props.initialValue)
  const colorScheme = useResolvedScheme()
  return (
    <ComposeHost colorScheme={colorScheme} matchContents>
      <AlertDialog
        modifiers={[testID(props.ids.container), imePadding()]}
        properties={{
          dismissOnBackPress: true,
          dismissOnClickOutside: false,
        }}
        onDismissRequest={props.onCancel}
      >
        <AlertDialog.Title>
          <MaterialText>{props.title}</MaterialText>
        </AlertDialog.Title>
        <AlertDialog.Text>
          <OutlinedTextField
            value={buffer}
            autoFocus
            singleLine
            isError={Boolean(props.validationMessage)}
            keyboardOptions={{ keyboardType: "number", imeAction: "done" }}
            keyboardActions={{ onDone: () => props.onSubmit(buffer.get()) }}
            modifiers={[testID(props.ids.field), fillMaxWidth()]}
          >
            <OutlinedTextField.Label>
              <MaterialText>{props.label}</MaterialText>
            </OutlinedTextField.Label>
            {props.validationMessage ? (
              <OutlinedTextField.SupportingText>
                <NativeErrorNotice
                  message={props.validationMessage}
                  testID={props.ids.message}
                />
              </OutlinedTextField.SupportingText>
            ) : null}
          </OutlinedTextField>
        </AlertDialog.Text>
        <AlertDialog.DismissButton>
          <TextButton
            onClick={props.onCancel}
            modifiers={[testID(props.ids.cancel)]}
          >
            <MaterialText>{props.cancelLabel}</MaterialText>
          </TextButton>
        </AlertDialog.DismissButton>
        <AlertDialog.ConfirmButton>
          <TextButton
            onClick={() => props.onSubmit(buffer.get())}
            modifiers={[testID(props.ids.submit)]}
          >
            <MaterialText>{props.submitLabel}</MaterialText>
          </TextButton>
        </AlertDialog.ConfirmButton>
      </AlertDialog>
    </ComposeHost>
  )
}

export function NativeSettingsNumericEditor(
  props: NativeSettingsNumericEditorProps,
) {
  return Platform.OS === "ios" ? (
    <IosNumericEditor {...props} />
  ) : (
    <AndroidNumericEditor {...props} />
  )
}

const styles = StyleSheet.create({ fill: { flex: 1 } })
