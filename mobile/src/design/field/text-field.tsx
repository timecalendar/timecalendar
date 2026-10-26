import { type ReactNode, type Ref, useId, useState } from "react"
import {
  Platform,
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextInputProps,
  useWindowDimensions,
  View,
} from "react-native"

import type { ButtonLayoutStyle } from "@/design/button/button"
import { FieldInset, useFieldBoxStyle } from "@/design/field/field-box"
import { fieldErrorHint } from "@/design/field/field-error-hint"
import { FieldError } from "@/design/status/error-surfaces"
import { ThemedText } from "@/design/text/themed-text"
import {
  MinTouchTarget,
  Spacing,
  StateOpacity,
  TypeRamp,
  useTheme,
} from "@/theme"

export type TextFieldLayoutStyle = ButtonLayoutStyle

export type TextFieldRef = TextInput

export type TextFieldProps = Omit<
  TextInputProps,
  | "style"
  | "editable"
  | "multiline"
  | "numberOfLines"
  | "placeholderTextColor"
  | "selectionColor"
  | "cursorColor"
  | "underlineColorAndroid"
  | "textAlignVertical"
  | "clearButtonMode"
  | "allowFontScaling"
  | "maxFontSizeMultiplier"
  | "blurOnSubmit"
  | "accessibilityLabelledBy"
  | "aria-label"
  | "aria-labelledby"
  | "accessibilityState"
  | "aria-disabled"
  | "accessibilityHint"
  | "aria-describedby"
> & {
  label: string
  helper?: string
  error?: string | null | undefined
  hint?: string
  disabled?: boolean
  multiline?: boolean
  testID?: string
  style?: StyleProp<TextFieldLayoutStyle>
  ref?: Ref<TextFieldRef>
}

const MULTILINE_MIN_LINES = 4

const derived = (testID: string | undefined, suffix: string) =>
  testID === undefined ? undefined : `${testID}-${suffix}`

type FieldChromeProps = {
  label: string
  labelNativeID?: string
  helper?: string | undefined
  error?: string | null | undefined
  disabled?: boolean
  testID?: string | undefined
  style?: StyleProp<TextFieldLayoutStyle>
  children: ReactNode
}

// The error stays at full contrast: it still applies to a field the user
// cannot edit.

export function FieldChrome({
  label,
  labelNativeID,
  helper,
  error,
  disabled = false,
  testID,
  style,
  children,
}: FieldChromeProps) {
  const dimmed = disabled ? styles.disabled : undefined
  return (
    <View style={StyleSheet.flatten([styles.root, style])}>
      <ThemedText
        type="smallBold"
        nativeID={labelNativeID}
        testID={derived(testID, "label")}
        style={dimmed}
      >
        {label}
      </ThemedText>
      <View style={dimmed}>{children}</View>
      {helper ? (
        <ThemedText
          type="small"
          tone="secondary"
          style={dimmed}
          testID={derived(testID, "helper")}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {helper}
        </ThemedText>
      ) : null}
      {error ? (
        <FieldError
          message={error}
          {...(testID === undefined ? {} : { testID: `${testID}-error` })}
        />
      ) : null}
    </View>
  )
}

export function TextField({
  label,
  helper,
  error,
  hint,
  disabled = false,
  multiline = false,
  testID,
  style,
  ref,
  accessibilityLabel = label,
  onFocus,
  onBlur,
  submitBehavior,
  ...inputProps
}: TextFieldProps) {
  const theme = useTheme()
  const labelNativeID = useId()
  const { fontScale } = useWindowDimensions()
  const [focused, setFocused] = useState(false)
  const ios = Platform.OS === "ios"
  const box = useFieldBoxStyle({ focused, error: Boolean(error) })
  const body = TypeRamp.body.style
  const lineHeight = body.lineHeight ?? 0

  return (
    <FieldChrome
      label={label}
      labelNativeID={labelNativeID}
      helper={helper}
      error={error}
      disabled={disabled}
      testID={testID}
      style={style}
    >
      <View testID={derived(testID, "field")} style={box.style}>
        <TextInput
          {...inputProps}
          ref={ref}
          testID={testID}
          accessibilityLabel={accessibilityLabel}
          accessibilityLabelledBy={ios ? undefined : labelNativeID}
          accessibilityHint={fieldErrorHint(error, helper, hint)}
          accessibilityState={{ disabled }}
          editable={!disabled}
          multiline={multiline}
          submitBehavior={submitBehavior ?? (multiline ? "newline" : undefined)}
          textAlignVertical={multiline ? "top" : "center"}
          clearButtonMode={ios && !multiline ? "while-editing" : "never"}
          placeholderTextColor={theme.textSecondary}
          selectionColor={theme.primary}
          cursorColor={theme.primary}
          underlineColorAndroid="transparent"
          onFocus={(event) => {
            setFocused(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            onBlur?.(event)
          }}
          style={{
            color: theme.text,
            fontSize: body.fontSize,
            paddingHorizontal: FieldInset.horizontal - box.borderWidth,
            paddingVertical: FieldInset.vertical - box.borderWidth,
            minHeight: multiline
              ? MULTILINE_MIN_LINES * lineHeight * fontScale +
                2 * FieldInset.vertical
              : MinTouchTarget,
            ...(multiline ? { lineHeight } : null),
          }}
        />
      </View>
    </FieldChrome>
  )
}

const styles = StyleSheet.create({
  root: { gap: Spacing.two },
  disabled: { opacity: StateOpacity.disabled },
})
