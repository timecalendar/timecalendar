import {
  AlertDialog,
  Button as MaterialButton,
  Host as ComposeHost,
  LazyColumn,
  ListItem,
  RadioButton,
  Switch as MaterialSwitch,
  Text as MaterialText,
  TextButton,
} from "@expo/ui/jetpack-compose"
import {
  clickable,
  fillMaxSize,
  selectable,
  testID,
  toggleable,
} from "@expo/ui/jetpack-compose/modifiers"
import {
  Button as SwiftButton,
  Form,
  Host as SwiftHost,
  HStack,
  Image as SwiftImage,
  LabeledContent,
  Section as SwiftSection,
  Spacer,
  Text as SwiftText,
  Toggle as SwiftToggle,
} from "@expo/ui/swift-ui"
import {
  accessibilityHint,
  accessibilityIdentifier,
  accessibilityLabel,
  accessibilityValue,
} from "@expo/ui/swift-ui/modifiers"
import type { Href } from "expo-router"
import { router } from "expo-router"
import type { PropsWithChildren } from "react"
import { Platform, StyleSheet } from "react-native"

import { useColorScheme } from "@/hooks/use-color-scheme"

export type NativeSettingsRowProps = {
  kind: "navigation" | "action" | "value"
  label: string
  accessibilityLabel?: string | undefined
  testID: string
  hint?: string | undefined
  value?: string | undefined
  badge?: string | undefined
  href?: Href | undefined
  onPress?: (() => void) | undefined
}

type NativeSettingsSectionProps = PropsWithChildren<{
  title?: string
  testID?: string
}>

type NativeSettingsChoiceRowProps = {
  label: string
  selected: boolean
  selectedAccessibilityLabel: string
  testID: string
  onSelect: () => void
}

type NativeSettingsSwitchRowProps = {
  label: string
  value: boolean
  testID: string
  switchTestID?: string
  onValueChange: (value: boolean) => void
}

type NativeSettingsTextProps = {
  children: string
  testID?: string
}

type NativeSettingsRadioDialogOption<Value extends string> = {
  label: string
  value: Value
}

type NativeSettingsRadioDialogProps<Value extends string> = {
  visible: boolean
  title: string
  cancelLabel: string
  value: Value
  options: readonly NativeSettingsRadioDialogOption<Value>[]
  testID: string
  onSelect: (value: Value) => void
  onDismiss: () => void
}

function useResolvedScheme(): "light" | "dark" {
  return useColorScheme() === "dark" ? "dark" : "light"
}

export function NativeSettingsHost({ children }: PropsWithChildren) {
  const colorScheme = useResolvedScheme()
  if (Platform.OS === "ios") {
    return (
      <SwiftHost
        colorScheme={colorScheme}
        useViewportSizeMeasurement
        style={styles.fill}
      >
        <Form>{children}</Form>
      </SwiftHost>
    )
  }
  return (
    <ComposeHost
      colorScheme={colorScheme}
      useViewportSizeMeasurement
      style={styles.fill}
    >
      <LazyColumn
        contentPadding={{ top: 16, bottom: 24 }}
        modifiers={[fillMaxSize()]}
      >
        {children}
      </LazyColumn>
    </ComposeHost>
  )
}

export function NativeSettingsSection({
  title,
  testID: sectionTestID,
  children,
}: NativeSettingsSectionProps) {
  if (Platform.OS === "ios") {
    return (
      <SwiftSection
        {...(title ? { title } : {})}
        {...(sectionTestID
          ? { modifiers: [accessibilityIdentifier(sectionTestID)] }
          : {})}
      >
        {children}
      </SwiftSection>
    )
  }
  return (
    <>
      {title ? (
        <MaterialText
          style={{ typography: "titleSmall" }}
          {...(sectionTestID ? { modifiers: [testID(sectionTestID)] } : {})}
        >
          {title}
        </MaterialText>
      ) : null}
      {children}
    </>
  )
}

export function NativeSettingsText({
  children,
  testID: textTestID,
}: NativeSettingsTextProps) {
  if (Platform.OS === "ios") {
    return (
      <SwiftText
        {...(textTestID
          ? { modifiers: [accessibilityIdentifier(textTestID)] }
          : {})}
      >
        {children}
      </SwiftText>
    )
  }
  return (
    <MaterialText {...(textTestID ? { modifiers: [testID(textTestID)] } : {})}>
      {children}
    </MaterialText>
  )
}

function activateRow(props: NativeSettingsRowProps) {
  if (props.kind === "navigation" && props.href) {
    router.push(props.href)
  } else if (props.kind === "action") {
    props.onPress?.()
  }
}

function SwiftRowContent({
  label,
  value,
  badge,
  disclosure,
  selected,
}: {
  label: string
  value?: string | undefined
  badge?: string | undefined
  disclosure?: boolean
  selected?: boolean
}) {
  return (
    <HStack>
      <SwiftText>{label}</SwiftText>
      <Spacer />
      {value ? <SwiftText>{value}</SwiftText> : null}
      {badge ? <SwiftText>{badge}</SwiftText> : null}
      {selected ? <SwiftImage systemName="checkmark" /> : null}
      {disclosure ? <SwiftImage systemName="chevron.right" /> : null}
    </HStack>
  )
}

export function NativeSettingsRow(props: NativeSettingsRowProps) {
  const interactive = props.kind !== "value"
  const onPress = () => activateRow(props)
  if (Platform.OS === "ios") {
    const modifiers = [
      accessibilityIdentifier(props.testID),
      accessibilityLabel(props.accessibilityLabel ?? props.label),
      ...(props.hint ? [accessibilityHint(props.hint)] : []),
      ...(props.value ? [accessibilityValue(props.value)] : []),
    ]
    if (!interactive) {
      return (
        <LabeledContent label={props.label} modifiers={modifiers}>
          <SwiftText>{props.value}</SwiftText>
        </LabeledContent>
      )
    }
    return (
      <SwiftButton onPress={onPress} modifiers={modifiers}>
        <SwiftRowContent
          label={props.label}
          value={props.value}
          badge={props.badge}
          disclosure={props.kind === "navigation"}
        />
      </SwiftButton>
    )
  }
  return (
    <ListItem
      modifiers={[
        testID(props.testID),
        ...(interactive ? [clickable(onPress)] : []),
      ]}
    >
      <ListItem.HeadlineContent>
        <MaterialText>{props.label}</MaterialText>
      </ListItem.HeadlineContent>
      {props.value ? (
        <ListItem.SupportingContent>
          <MaterialText>{props.value}</MaterialText>
        </ListItem.SupportingContent>
      ) : null}
      {props.badge || props.kind === "navigation" ? (
        <ListItem.TrailingContent>
          <MaterialText>
            {props.badge ?? (props.kind === "navigation" ? "›" : "")}
          </MaterialText>
        </ListItem.TrailingContent>
      ) : null}
    </ListItem>
  )
}

export function NativeSettingsSwitchRow({
  label,
  value,
  testID: rowTestID,
  switchTestID,
  onValueChange,
}: NativeSettingsSwitchRowProps) {
  if (Platform.OS === "ios") {
    return (
      <SwiftToggle
        label={label}
        isOn={value}
        onIsOnChange={onValueChange}
        modifiers={[
          accessibilityIdentifier(switchTestID ?? rowTestID),
          accessibilityLabel(label),
        ]}
      />
    )
  }
  const toggle = () => onValueChange(!value)
  return (
    <ListItem
      modifiers={[
        testID(rowTestID),
        toggleable(value, toggle, { role: "switch" }),
      ]}
    >
      <ListItem.HeadlineContent>
        <MaterialText>{label}</MaterialText>
      </ListItem.HeadlineContent>
      <ListItem.TrailingContent>
        <MaterialSwitch
          value={value}
          {...(switchTestID ? { modifiers: [testID(switchTestID)] } : {})}
        />
      </ListItem.TrailingContent>
    </ListItem>
  )
}

export function NativeSettingsChoiceRow({
  label,
  selected,
  selectedAccessibilityLabel,
  testID: rowTestID,
  onSelect,
}: NativeSettingsChoiceRowProps) {
  if (Platform.OS === "ios") {
    return (
      <SwiftButton
        onPress={onSelect}
        modifiers={[
          accessibilityIdentifier(rowTestID),
          accessibilityLabel(label),
          accessibilityValue(selected ? selectedAccessibilityLabel : ""),
        ]}
      >
        <SwiftRowContent label={label} selected={selected} />
      </SwiftButton>
    )
  }
  return (
    <ListItem
      modifiers={[
        testID(rowTestID),
        selectable(selected, onSelect, "radioButton"),
      ]}
    >
      <ListItem.HeadlineContent>
        <MaterialText>{label}</MaterialText>
      </ListItem.HeadlineContent>
      <ListItem.TrailingContent>
        <RadioButton selected={selected} />
      </ListItem.TrailingContent>
    </ListItem>
  )
}

export function NativeSettingsRadioDialog<Value extends string>({
  visible,
  title,
  cancelLabel,
  value,
  options,
  testID: dialogTestID,
  onSelect,
  onDismiss,
}: NativeSettingsRadioDialogProps<Value>) {
  const colorScheme = useResolvedScheme()
  if (!visible || Platform.OS === "ios") return null
  return (
    <ComposeHost colorScheme={colorScheme} matchContents>
      <AlertDialog
        modifiers={[testID(dialogTestID)]}
        onDismissRequest={onDismiss}
      >
        <AlertDialog.Title>
          <MaterialText>{title}</MaterialText>
        </AlertDialog.Title>
        <AlertDialog.Text>
          {options.map((option) => (
            <MaterialButton
              key={option.value}
              onClick={() => onSelect(option.value)}
              modifiers={[testID(`${dialogTestID}-${option.value}`)]}
            >
              <RadioButton selected={option.value === value} />
              <MaterialText>{option.label}</MaterialText>
            </MaterialButton>
          ))}
        </AlertDialog.Text>
        <AlertDialog.DismissButton>
          <TextButton
            onClick={onDismiss}
            modifiers={[testID(`${dialogTestID}-cancel`)]}
          >
            <MaterialText>{cancelLabel}</MaterialText>
          </TextButton>
        </AlertDialog.DismissButton>
      </AlertDialog>
    </ComposeHost>
  )
}

const styles = StyleSheet.create({ fill: { flex: 1 } })
