import {
  AlertDialog,
  Badge as MaterialBadge,
  Column,
  FloatingActionButton,
  Host as ComposeHost,
  type HostProps as ComposeHostProps,
  Icon as MaterialIcon,
  LazyColumn,
  ListItem,
  type MaterialColors,
  RadioButton,
  Row,
  Switch as MaterialSwitch,
  Text as MaterialText,
  TextButton,
  useMaterialColors,
} from "@expo/ui/jetpack-compose"
import {
  clickable,
  clip,
  defaultMinSize,
  fillMaxSize,
  fillMaxWidth,
  type ModifierConfig,
  padding,
  selectable,
  selectableGroup,
  Shapes,
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
  VStack,
} from "@expo/ui/swift-ui"
import {
  accessibilityHidden,
  accessibilityHint,
  accessibilityIdentifier,
  accessibilityLabel,
  accessibilityValue,
  background,
  font,
  foregroundStyle,
  frame,
  padding as swiftPadding,
  shapes,
  tint,
} from "@expo/ui/swift-ui/modifiers"
import type { Href } from "expo-router"
import { router } from "expo-router"
import {
  Children,
  createContext,
  isValidElement,
  type PropsWithChildren,
  useContext,
} from "react"
import { Platform, StyleSheet } from "react-native"

import {
  materialSymbolSource,
  type NativeSettingsIcon,
} from "@/components/chrome/native-settings-icons"
import { useErrorAnnouncement } from "@/components/use-error-announcement"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { useTheme } from "@/theme"

export type NativeSettingsRowProps = {
  kind: "navigation" | "action" | "value"
  label: string
  accessibilityLabel?: string | undefined
  testID: string
  icon?: NativeSettingsIcon | undefined
  hint?: string | undefined
  subtitle?: string | undefined
  value?: string | undefined
  destructive?: boolean | undefined
  badge?: string | undefined
  href?: Href | undefined
  onPress?: (() => void) | undefined
}

type NativeSettingsSectionProps = PropsWithChildren<{
  title?: string | undefined
  footer?: string | undefined
  testID?: string | undefined
}>

type NativeSettingsHostProps = PropsWithChildren<{
  reservesFloatingAction?: boolean | undefined
}>

type NativeSettingsFloatingActionProps = {
  label: string
  icon: NativeSettingsIcon
  testID: string
  onPress: () => void
}

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
  icon?: NativeSettingsIcon | undefined
  switchTestID?: string
  onValueChange: (value: boolean) => void
}

type NativeSettingsAlertProps = {
  title: string
  message: string
  testID: string
  messageTestID: string
  action?:
    | {
        label: string
        accessibilityLabel: string
        testID: string
        onPress: () => void
      }
    | undefined
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

type SegmentPosition = "first" | "middle" | "last" | "single"

type Segment = { position: SegmentPosition; titled: boolean }

const SegmentContext = createContext<Segment>({
  position: "single",
  titled: true,
})

const OUTER_RADIUS = 20
const INNER_RADIUS = 4
const SEGMENT_GAP = 2
const LIST_INSET = 16
const LIST_BOTTOM_PADDING = 24
const FAB_CLEARANCE = 88

const segmentCorners: Record<SegmentPosition, { top: number; bottom: number }> =
  {
    first: { top: OUTER_RADIUS, bottom: INNER_RADIUS },
    middle: { top: INNER_RADIUS, bottom: INNER_RADIUS },
    last: { top: INNER_RADIUS, bottom: OUTER_RADIUS },
    single: { top: OUTER_RADIUS, bottom: OUTER_RADIUS },
  }

function segmentPosition(index: number, count: number): SegmentPosition {
  if (count === 1) return "single"
  if (index === 0) return "first"
  return index === count - 1 ? "last" : "middle"
}

function useSegmentModifiers(): ModifierConfig[] {
  const { position, titled } = useContext(SegmentContext)
  const { top, bottom } = segmentCorners[position]
  const leading = position === "first" || position === "single"
  const trailing = position === "last" || position === "single"
  return [
    padding(
      LIST_INSET,
      leading && !titled ? LIST_INSET : 0,
      LIST_INSET,
      trailing ? 0 : SEGMENT_GAP,
    ),
    clip(
      Shapes.RoundedCorner({
        topStart: top,
        topEnd: top,
        bottomStart: bottom,
        bottomEnd: bottom,
      }),
    ),
  ]
}

function listItemColors(palette: MaterialColors) {
  return {
    containerColor: palette.surfaceContainer,
    contentColor: palette.onSurface,
    leadingContentColor: palette.onSurfaceVariant,
    trailingContentColor: palette.onSurfaceVariant,
    supportingContentColor: palette.onSurfaceVariant,
  }
}

function useResolvedScheme(): "light" | "dark" {
  return useColorScheme() === "dark" ? "dark" : "light"
}

function ComposeSettingsHost({
  children,
  ...props
}: Pick<
  ComposeHostProps,
  "children" | "matchContents" | "style" | "useViewportSizeMeasurement"
>) {
  const colorScheme = useResolvedScheme()
  const theme = useTheme()
  return (
    <ComposeHost {...props} colorScheme={colorScheme} seedColor={theme.primary}>
      {children}
    </ComposeHost>
  )
}

export function NativeSettingsHost({
  children,
  reservesFloatingAction = false,
}: NativeSettingsHostProps) {
  const colorScheme = useResolvedScheme()
  const theme = useTheme()
  if (Platform.OS === "ios") {
    return (
      <SwiftHost
        colorScheme={colorScheme}
        useViewportSizeMeasurement
        style={styles.fill}
      >
        <Form modifiers={[tint(theme.primary)]}>{children}</Form>
      </SwiftHost>
    )
  }
  return (
    <ComposeSettingsHost useViewportSizeMeasurement style={styles.fill}>
      <LazyColumn
        contentPadding={{
          top: 0,
          bottom: reservesFloatingAction
            ? LIST_BOTTOM_PADDING + FAB_CLEARANCE
            : LIST_BOTTOM_PADDING,
        }}
        modifiers={[fillMaxSize()]}
      >
        {children}
      </LazyColumn>
    </ComposeSettingsHost>
  )
}

// iOS adds through the navigation bar; only Material pages carry a FAB.
export function NativeSettingsFloatingAction({
  label,
  icon,
  testID: fabTestID,
  onPress,
}: NativeSettingsFloatingActionProps) {
  if (Platform.OS === "ios") return null
  return (
    <ComposeSettingsHost matchContents style={styles.floatingAction}>
      <FloatingActionButton onClick={onPress} modifiers={[testID(fabTestID)]}>
        <FloatingActionButton.Icon>
          <MaterialIcon
            source={materialSymbolSource(icon.android)}
            contentDescription={label}
            size={24}
          />
        </FloatingActionButton.Icon>
      </FloatingActionButton>
    </ComposeSettingsHost>
  )
}

export function NativeSettingsSection(props: NativeSettingsSectionProps) {
  if (Platform.OS === "ios") {
    return <SwiftSettingsSection {...props} />
  }
  return <ComposeSettingsSection {...props} />
}

function SwiftSettingsSection({
  title,
  footer,
  testID: sectionTestID,
  children,
}: NativeSettingsSectionProps) {
  return (
    <SwiftSection
      {...(title ? { title } : {})}
      {...(footer ? { footer: <SwiftText>{footer}</SwiftText> } : {})}
      {...(sectionTestID
        ? { modifiers: [accessibilityIdentifier(sectionTestID)] }
        : {})}
    >
      {children}
    </SwiftSection>
  )
}

function ComposeSettingsSection({
  title,
  footer,
  testID: sectionTestID,
  children,
}: NativeSettingsSectionProps) {
  const palette = useMaterialColors()
  const items = Children.toArray(children)
  const titled = Boolean(title)
  return (
    <>
      {title ? (
        <MaterialText
          color={palette.primary}
          style={{ typography: "titleSmall" }}
          modifiers={[
            padding(LIST_INSET, 24, LIST_INSET, 8),
            ...(sectionTestID ? [testID(sectionTestID)] : []),
          ]}
        >
          {title}
        </MaterialText>
      ) : null}
      {items.map((child, index) => (
        <SegmentContext.Provider
          key={isValidElement(child) && child.key !== null ? child.key : index}
          value={{ position: segmentPosition(index, items.length), titled }}
        >
          {child}
        </SegmentContext.Provider>
      ))}
      {footer ? (
        <MaterialText
          color={palette.onSurfaceVariant}
          style={{ typography: "bodySmall" }}
          modifiers={[padding(LIST_INSET, 8, LIST_INSET, 0)]}
        >
          {footer}
        </MaterialText>
      ) : null}
    </>
  )
}

export function NativeSettingsAlert(props: NativeSettingsAlertProps) {
  useErrorAnnouncement(`${props.title}. ${props.message}`, { native: true })
  if (Platform.OS === "ios") return <SwiftSettingsAlert {...props} />
  return <ComposeSettingsAlert {...props} />
}

function SwiftSettingsAlert({
  title,
  message,
  testID: alertTestID,
  messageTestID,
  action,
}: NativeSettingsAlertProps) {
  const theme = useTheme()
  return (
    <SwiftSection modifiers={[accessibilityIdentifier(alertTestID)]}>
      <HStack alignment="firstTextBaseline" spacing={12}>
        <SwiftImage
          systemName="exclamationmark.triangle.fill"
          modifiers={[
            font({ textStyle: "body" }),
            foregroundStyle(theme.error),
            accessibilityHidden(),
          ]}
        />
        <VStack alignment="leading" spacing={4}>
          <SwiftText
            modifiers={[
              font({ textStyle: "headline" }),
              foregroundStyle(theme.text),
            ]}
          >
            {title}
          </SwiftText>
          <SwiftText
            modifiers={[
              accessibilityIdentifier(messageTestID),
              font({ textStyle: "subheadline" }),
              foregroundStyle(theme.textSecondary),
            ]}
          >
            {message}
          </SwiftText>
        </VStack>
        <Spacer />
      </HStack>
      {action ? (
        <SwiftButton
          label={action.label}
          onPress={action.onPress}
          modifiers={[
            accessibilityIdentifier(action.testID),
            accessibilityLabel(action.accessibilityLabel),
          ]}
        />
      ) : null}
    </SwiftSection>
  )
}

function ComposeSettingsAlert({
  title,
  message,
  testID: alertTestID,
  messageTestID,
  action,
}: NativeSettingsAlertProps) {
  const palette = useMaterialColors()
  return (
    <ListItem
      colors={{
        containerColor: palette.errorContainer,
        contentColor: palette.onErrorContainer,
        supportingContentColor: palette.onErrorContainer,
        trailingContentColor: palette.onErrorContainer,
      }}
      modifiers={[
        padding(LIST_INSET, LIST_INSET, LIST_INSET, 0),
        clip(Shapes.RoundedCorner(OUTER_RADIUS)),
        testID(alertTestID),
      ]}
    >
      <ListItem.HeadlineContent>
        <MaterialText
          color={palette.onErrorContainer}
          style={{ typography: "titleMedium" }}
        >
          {title}
        </MaterialText>
      </ListItem.HeadlineContent>
      <ListItem.SupportingContent>
        <MaterialText
          color={palette.onErrorContainer}
          style={{ typography: "bodyMedium" }}
          modifiers={[testID(messageTestID)]}
        >
          {message}
        </MaterialText>
      </ListItem.SupportingContent>
      {action ? (
        <ListItem.TrailingContent>
          <TextButton
            onClick={action.onPress}
            modifiers={[testID(action.testID)]}
          >
            <MaterialText>{action.label}</MaterialText>
          </TextButton>
        </ListItem.TrailingContent>
      ) : null}
    </ListItem>
  )
}

function activateRow(props: NativeSettingsRowProps) {
  if (props.kind === "navigation" && props.href) {
    router.push(props.href)
  } else if (props.kind === "action") {
    props.onPress?.()
  }
}

function SwiftIconTile({ icon }: { icon: NativeSettingsIcon }) {
  const theme = useTheme()
  return (
    <SwiftImage
      systemName={icon.ios}
      size={17}
      color={theme.onPrimary}
      modifiers={[
        frame({ width: 29, height: 29 }),
        background(
          theme.primaryStrong,
          shapes.roundedRectangle({
            cornerRadius: 7,
            roundedCornerStyle: "continuous",
          }),
        ),
        accessibilityHidden(),
      ]}
    />
  )
}

function SwiftRowLabel({
  label,
  icon,
  subtitle,
  destructive = false,
}: {
  label: string
  icon?: NativeSettingsIcon | undefined
  subtitle?: string | undefined
  destructive?: boolean | undefined
}) {
  const theme = useTheme()
  const title = (
    <SwiftText
      modifiers={[foregroundStyle(destructive ? theme.error : theme.text)]}
    >
      {label}
    </SwiftText>
  )
  const text = subtitle ? (
    <VStack alignment="leading" spacing={2}>
      {title}
      <SwiftText
        modifiers={[
          font({ textStyle: "subheadline" }),
          foregroundStyle(theme.textSecondary),
        ]}
      >
        {subtitle}
      </SwiftText>
    </VStack>
  ) : (
    title
  )
  if (!icon) return text
  return (
    <HStack spacing={12}>
      <SwiftIconTile icon={icon} />
      {text}
    </HStack>
  )
}

function SwiftBadge({ children }: { children: string }) {
  return (
    <SwiftText
      modifiers={[
        font({ textStyle: "subheadline" }),
        foregroundStyle("white"),
        swiftPadding({ horizontal: 7, vertical: 2 }),
        background("red", shapes.capsule()),
      ]}
    >
      {children}
    </SwiftText>
  )
}

type SwiftRowContentProps = Pick<
  NativeSettingsRowProps,
  "label" | "icon" | "subtitle" | "value" | "badge" | "destructive"
>

function SwiftDisclosureRowContent({
  label,
  icon,
  subtitle,
  value,
  badge,
}: SwiftRowContentProps) {
  const theme = useTheme()
  return (
    <HStack spacing={12}>
      <SwiftRowLabel label={label} icon={icon} subtitle={subtitle} />
      <Spacer />
      <HStack spacing={6}>
        {value ? (
          <SwiftText modifiers={[foregroundStyle(theme.textSecondary)]}>
            {value}
          </SwiftText>
        ) : null}
        {badge ? <SwiftBadge>{badge}</SwiftBadge> : null}
        <SwiftImage
          systemName="chevron.forward"
          modifiers={[
            font({ textStyle: "footnote", weight: "semibold" }),
            foregroundStyle(theme.textTertiary),
            accessibilityHidden(),
          ]}
        />
      </HStack>
    </HStack>
  )
}

function SwiftActionRowContent({
  label,
  icon,
  subtitle,
  value,
  badge,
  destructive,
}: SwiftRowContentProps) {
  const theme = useTheme()
  return (
    <HStack spacing={12}>
      <SwiftRowLabel
        label={label}
        icon={icon}
        subtitle={subtitle}
        destructive={destructive}
      />
      <Spacer />
      {value ? (
        <SwiftText modifiers={[foregroundStyle(theme.textSecondary)]}>
          {value}
        </SwiftText>
      ) : null}
      {badge ? <SwiftBadge>{badge}</SwiftBadge> : null}
    </HStack>
  )
}

export function NativeSettingsRow(props: NativeSettingsRowProps) {
  if (Platform.OS === "ios") return <SwiftSettingsRow {...props} />
  return <ComposeSettingsRow {...props} />
}

function defaultAccessibilityLabel({
  label,
  subtitle,
}: Pick<NativeSettingsRowProps, "label" | "subtitle">) {
  return subtitle ? `${label}, ${subtitle}` : label
}

function SwiftSettingsRow(props: NativeSettingsRowProps) {
  const modifiers = [
    accessibilityIdentifier(props.testID),
    accessibilityLabel(
      props.accessibilityLabel ?? defaultAccessibilityLabel(props),
    ),
    ...(props.hint ? [accessibilityHint(props.hint)] : []),
    ...(props.value ? [accessibilityValue(props.value)] : []),
  ]
  if (props.kind === "value") {
    return (
      <LabeledContent
        label={
          props.icon ? (
            <SwiftRowLabel label={props.label} icon={props.icon} />
          ) : (
            props.label
          )
        }
        modifiers={modifiers}
      >
        <SwiftText>{props.value}</SwiftText>
      </LabeledContent>
    )
  }
  const Content =
    props.kind === "navigation"
      ? SwiftDisclosureRowContent
      : SwiftActionRowContent
  return (
    <SwiftButton onPress={() => activateRow(props)} modifiers={modifiers}>
      <Content
        label={props.label}
        icon={props.icon}
        subtitle={props.subtitle}
        value={props.value}
        badge={props.badge}
        destructive={props.destructive}
      />
    </SwiftButton>
  )
}

function ComposeLeadingIcon({ icon }: { icon: NativeSettingsIcon }) {
  const palette = useMaterialColors()
  return (
    <ListItem.LeadingContent>
      <MaterialIcon
        source={materialSymbolSource(icon.android)}
        tint={palette.onSurfaceVariant}
        size={24}
      />
    </ListItem.LeadingContent>
  )
}

function ComposeSettingsRow(props: NativeSettingsRowProps) {
  const palette = useMaterialColors()
  const segment = useSegmentModifiers()
  const interactive = props.kind !== "value"
  const supporting = props.subtitle ?? props.value
  const trailingValue = props.subtitle ? props.value : undefined
  return (
    <ListItem
      colors={listItemColors(palette)}
      modifiers={[
        ...segment,
        testID(props.testID),
        ...(interactive ? [clickable(() => activateRow(props))] : []),
      ]}
    >
      {props.icon ? <ComposeLeadingIcon icon={props.icon} /> : null}
      <ListItem.HeadlineContent>
        <MaterialText
          color={props.destructive ? palette.error : palette.onSurface}
          style={{ typography: "bodyLarge" }}
        >
          {props.label}
        </MaterialText>
      </ListItem.HeadlineContent>
      {supporting ? (
        <ListItem.SupportingContent>
          <MaterialText
            color={palette.onSurfaceVariant}
            style={{ typography: "bodyMedium" }}
          >
            {supporting}
          </MaterialText>
        </ListItem.SupportingContent>
      ) : null}
      {trailingValue || props.badge ? (
        <ListItem.TrailingContent>
          <Row
            horizontalArrangement={{ spacedBy: 8 }}
            verticalAlignment="center"
          >
            {trailingValue ? (
              <MaterialText
                color={palette.onSurfaceVariant}
                style={{ typography: "labelLarge" }}
              >
                {trailingValue}
              </MaterialText>
            ) : null}
            {props.badge ? (
              <MaterialBadge>
                <MaterialText>{props.badge}</MaterialText>
              </MaterialBadge>
            ) : null}
          </Row>
        </ListItem.TrailingContent>
      ) : null}
    </ListItem>
  )
}

export function NativeSettingsSwitchRow(props: NativeSettingsSwitchRowProps) {
  if (Platform.OS === "ios") {
    const { label, icon, value, testID: rowTestID, switchTestID } = props
    return (
      <SwiftToggle
        label={label}
        isOn={value}
        onIsOnChange={props.onValueChange}
        modifiers={[
          accessibilityIdentifier(switchTestID ?? rowTestID),
          accessibilityLabel(label),
        ]}
      >
        {icon ? <SwiftRowLabel label={label} icon={icon} /> : undefined}
      </SwiftToggle>
    )
  }
  return <ComposeSettingsSwitchRow {...props} />
}

function ComposeSettingsSwitchRow({
  label,
  icon,
  value,
  testID: rowTestID,
  switchTestID,
  onValueChange,
}: NativeSettingsSwitchRowProps) {
  const palette = useMaterialColors()
  const segment = useSegmentModifiers()
  const toggle = () => onValueChange(!value)
  return (
    <ListItem
      colors={listItemColors(palette)}
      modifiers={[
        ...segment,
        testID(rowTestID),
        toggleable(value, toggle, { role: "switch" }),
      ]}
    >
      {icon ? <ComposeLeadingIcon icon={icon} /> : null}
      <ListItem.HeadlineContent>
        <MaterialText
          color={palette.onSurface}
          style={{ typography: "bodyLarge" }}
        >
          {label}
        </MaterialText>
      </ListItem.HeadlineContent>
      <ListItem.TrailingContent>
        <MaterialSwitch
          value={value}
          onCheckedChange={onValueChange}
          {...(switchTestID ? { modifiers: [testID(switchTestID)] } : {})}
        />
      </ListItem.TrailingContent>
    </ListItem>
  )
}

export function NativeSettingsChoiceRow(props: NativeSettingsChoiceRowProps) {
  if (Platform.OS === "ios") return <SwiftSettingsChoiceRow {...props} />
  return <ComposeSettingsChoiceRow {...props} />
}

function SwiftSettingsChoiceRow({
  label,
  selected,
  selectedAccessibilityLabel,
  testID: rowTestID,
  onSelect,
}: NativeSettingsChoiceRowProps) {
  const theme = useTheme()
  return (
    <SwiftButton
      onPress={onSelect}
      modifiers={[
        accessibilityIdentifier(rowTestID),
        accessibilityLabel(label),
        accessibilityValue(selected ? selectedAccessibilityLabel : ""),
      ]}
    >
      <HStack>
        <SwiftRowLabel label={label} />
        <Spacer />
        {selected ? (
          <SwiftImage
            systemName="checkmark"
            modifiers={[
              font({ textStyle: "subheadline", weight: "semibold" }),
              foregroundStyle(theme.primary),
              accessibilityHidden(),
            ]}
          />
        ) : null}
      </HStack>
    </SwiftButton>
  )
}

function ComposeSettingsChoiceRow({
  label,
  selected,
  testID: rowTestID,
  onSelect,
}: NativeSettingsChoiceRowProps) {
  const palette = useMaterialColors()
  const segment = useSegmentModifiers()
  return (
    <ListItem
      colors={listItemColors(palette)}
      modifiers={[
        ...segment,
        testID(rowTestID),
        selectable(selected, onSelect, "radioButton"),
      ]}
    >
      <ListItem.HeadlineContent>
        <MaterialText
          color={palette.onSurface}
          style={{ typography: "bodyLarge" }}
        >
          {label}
        </MaterialText>
      </ListItem.HeadlineContent>
      <ListItem.TrailingContent>
        <RadioButton selected={selected} />
      </ListItem.TrailingContent>
    </ListItem>
  )
}

export function NativeSettingsRadioDialog<Value extends string>(
  props: NativeSettingsRadioDialogProps<Value>,
) {
  if (!props.visible || Platform.OS === "ios") return null
  return (
    <ComposeSettingsHost matchContents>
      <ComposeRadioDialog {...props} />
    </ComposeSettingsHost>
  )
}

function ComposeRadioDialog<Value extends string>({
  title,
  cancelLabel,
  value,
  options,
  testID: dialogTestID,
  onSelect,
  onDismiss,
}: NativeSettingsRadioDialogProps<Value>) {
  const palette = useMaterialColors()
  return (
    <AlertDialog
      modifiers={[testID(dialogTestID)]}
      onDismissRequest={onDismiss}
    >
      <AlertDialog.Title>
        <MaterialText>{title}</MaterialText>
      </AlertDialog.Title>
      <AlertDialog.Text>
        <Column modifiers={[selectableGroup()]}>
          {options.map((option) => (
            <Row
              key={option.value}
              verticalAlignment="center"
              modifiers={[
                fillMaxWidth(),
                defaultMinSize({ minHeight: 56 }),
                selectable(
                  option.value === value,
                  () => onSelect(option.value),
                  "radioButton",
                ),
                testID(`${dialogTestID}-${option.value}`),
              ]}
            >
              <RadioButton selected={option.value === value} />
              <MaterialText
                color={palette.onSurface}
                style={{ typography: "bodyLarge" }}
                modifiers={[padding(16, 0, 0, 0)]}
              >
                {option.label}
              </MaterialText>
            </Row>
          ))}
        </Column>
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
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  floatingAction: { position: "absolute", right: 16, bottom: 16 },
})
